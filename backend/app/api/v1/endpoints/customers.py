from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID
import re

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import asc, desc, func, or_, select
from sqlalchemy.orm import joinedload

from app.api.dependencies import BrowserInfo, ClientIp, DatabaseSession
from app.core.constants import AuditAction
from app.core.permissions import AllAuthenticatedRoles, AnalystOrHigher, CompanyAdminOrSuperAdmin
from app.models.catalog import Category, Product
from app.models.customer import Customer, CustomerNotification, CustomerPurchaseSummary, CustomerTimeline
from app.models.sales import Sale, SaleItem
from app.schemas.customer import CustomerList, CustomerResponse, CustomerWrite
from app.services.audit_log_service import audit_log_service

router = APIRouter()


def import_sales_customers(db, company_id: UUID) -> int:
    """Materialize customers that already exist by name in the Sales module."""
    names = list(db.scalars(select(Sale.customer_name).where(Sale.company_id == company_id).distinct()).all())
    existing_names = {name.lower() for name in db.scalars(select(Customer.full_name).where(Customer.company_id == company_id)).all()}
    latest = db.scalar(select(Customer.customer_id).where(Customer.company_id == company_id).order_by(desc(Customer.customer_id)).limit(1))
    next_number = int(latest.rsplit("-", 1)[1]) + 1 if latest else 1
    created = 0
    for name in names:
        clean_name = name.strip()
        if not clean_name or clean_name.lower() in existing_names:
            continue
        slug = re.sub(r"[^a-z0-9]+", ".", clean_name.lower()).strip(".") or "customer"
        code = f"CUST-{datetime.now().year}-{next_number:06d}"
        customer = Customer(
            company_id=company_id,
            customer_id=code,
            full_name=clean_name,
            email=f"{slug}.{next_number}@sales-import.example.com",
            phone=f"SALES-{next_number:06d}",
            customer_type="RETAIL",
            preferred_sales_channel=None,
            status="ACTIVE",
        )
        db.add(customer)
        db.flush()
        db.add(CustomerPurchaseSummary(customer_id=customer.id))
        db.add(CustomerTimeline(customer_id=customer.id, event="Customer Imported from Sales", details="Profile created automatically from existing sales history."))
        db.add(CustomerNotification(company_id=company_id, customer_id=customer.id, title="Sales customer added", message=f"{clean_name} was automatically added from Sales."))
        existing_names.add(clean_name.lower())
        next_number += 1
        created += 1
    return created


def segment(orders: int, revenue: Decimal) -> str:
    if revenue >= 10000 or orders >= 20:
        return "VIP Customer"
    if orders >= 8:
        return "Loyal Customer"
    if orders >= 2:
        return "Regular Customer"
    return "New Customer"


def sync_summary(db, customer: Customer) -> CustomerPurchaseSummary:
    sales = list(db.scalars(select(Sale).where(
        Sale.company_id == customer.company_id,
        func.lower(Sale.customer_name) == customer.full_name.lower(),
    ).order_by(Sale.sale_date)).all())
    summary = customer.summary
    if summary is None:
        summary = CustomerPurchaseSummary(customer_id=customer.id)
        db.add(summary)
        customer.summary = summary
    old_segment = segment(summary.total_orders or 0, Decimal(summary.total_revenue or 0))
    summary.total_orders = len(sales)
    summary.total_revenue = sum((Decimal(s.total_amount) for s in sales), Decimal("0"))
    summary.average_order_value = summary.total_revenue / len(sales) if sales else Decimal("0")
    summary.first_purchase_date = sales[0].sale_date if sales else None
    summary.last_purchase_date = sales[-1].sale_date if sales else None
    sale_ids = [s.id for s in sales]
    if sale_ids:
        summary.total_products_purchased = int(db.scalar(select(func.coalesce(func.sum(SaleItem.quantity), 0)).where(SaleItem.sale_id.in_(sale_ids))) or 0)
        months = max(1, ((sales[-1].sale_date.date() - sales[0].sale_date.date()).days // 30) + 1)
        summary.purchase_frequency = Decimal(len(sales)) / Decimal(months)
        favorite = db.execute(select(Product.id, Category.id).join(SaleItem, SaleItem.product_id == Product.id).join(Category, Category.id == SaleItem.category_id).where(SaleItem.sale_id.in_(sale_ids)).group_by(Product.id, Category.id).order_by(desc(func.sum(SaleItem.quantity))).limit(1)).first()
        if favorite:
            summary.favorite_product_id, summary.favorite_category_id = favorite
    new_segment = segment(summary.total_orders, Decimal(summary.total_revenue))
    if old_segment != "VIP Customer" and new_segment == "VIP Customer":
        db.add(CustomerTimeline(customer_id=customer.id, event="Customer Reached VIP Status", details="Automatically promoted from purchase behaviour."))
        db.add(CustomerNotification(company_id=customer.company_id, customer_id=customer.id, title="Customer reached VIP status", message=f"{customer.full_name} is now a VIP customer."))
    return summary


def serialize(db, customer: Customer) -> CustomerResponse:
    summary = sync_summary(db, customer)
    product_name = db.scalar(select(Product.name).where(Product.id == summary.favorite_product_id)) if summary.favorite_product_id else None
    category_name = db.scalar(select(Category.name).where(Category.id == summary.favorite_category_id)) if summary.favorite_category_id else None
    customer_sales = list(db.scalars(select(Sale).where(
        Sale.company_id == customer.company_id,
        func.lower(Sale.customer_name) == customer.full_name.lower(),
    ).order_by(desc(Sale.sale_date))).all())
    sale_ids = [sale.id for sale in customer_sales]
    purchased_products = []
    if sale_ids:
        purchased_products = [
            {"productName": name, "quantity": int(quantity), "purchaseCount": int(purchase_count)}
            for name, quantity, purchase_count in db.execute(
                select(Product.name, func.sum(SaleItem.quantity), func.count(func.distinct(SaleItem.sale_id)))
                .join(SaleItem, SaleItem.product_id == Product.id)
                .where(SaleItem.sale_id.in_(sale_ids))
                .group_by(Product.name)
                .order_by(desc(func.sum(SaleItem.quantity)))
                .limit(10)
            ).all()
        ]
    return CustomerResponse.model_validate({
        "id": customer.id,
        "customerId": customer.customer_id,
        "fullName": customer.full_name,
        "email": customer.email,
        "phone": customer.phone,
        "gender": customer.gender,
        "dateOfBirth": customer.date_of_birth,
        "address": customer.address,
        "city": customer.city,
        "state": customer.state,
        "country": customer.country,
        "customerType": customer.customer_type,
        "preferredSalesChannel": customer.preferred_sales_channel,
        "status": customer.status,
        "createdAt": customer.created_at,
        "updatedAt": customer.updated_at,
        "segment": segment(summary.total_orders, Decimal(summary.total_revenue)),
        "summary": {
            "totalOrders": summary.total_orders,
            "totalRevenue": summary.total_revenue,
            "totalProductsPurchased": summary.total_products_purchased,
            "averageOrderValue": summary.average_order_value,
            "purchaseFrequency": summary.purchase_frequency,
            "firstPurchaseDate": summary.first_purchase_date,
            "lastPurchaseDate": summary.last_purchase_date,
            "favoriteProduct": product_name,
            "favoriteCategory": category_name,
        },
        "timeline": sorted(customer.timeline, key=lambda item: item.occurred_at, reverse=True),
        "recentTransactions": [
            {"id": sale.id, "invoiceNumber": sale.invoice_number, "saleDate": sale.sale_date, "totalAmount": sale.total_amount, "paymentMethod": sale.payment_method, "salesChannel": sale.sales_channel}
            for sale in customer_sales[:10]
        ],
        "mostPurchasedProducts": purchased_products,
    })


def get_customer(db, company_id: UUID, customer_id: UUID) -> Customer:
    item = db.scalar(select(Customer).options(joinedload(Customer.summary), joinedload(Customer.timeline)).where(Customer.id == customer_id, Customer.company_id == company_id))
    if not item:
        raise HTTPException(404, "Customer not found.")
    return item


def ensure_unique(db, company_id: UUID, data: CustomerWrite, exclude: UUID | None = None):
    filters = [Customer.company_id == company_id, or_(func.lower(Customer.email) == data.email.lower(), Customer.phone == data.phone)]
    if exclude:
        filters.append(Customer.id != exclude)
    if db.scalar(select(Customer.id).where(*filters)):
        raise HTTPException(409, "A customer with this email or phone already exists in your company.")


def audit(db, user, action, customer, ip, browser):
    audit_log_service.create_log(db, company_id=user.company_id, user_id=user.id, action=action, ip_address=ip, browser=browser, details=f"Customer {customer.customer_id} — {customer.full_name}")


@router.get("", response_model=CustomerList)
def list_customers(db: DatabaseSession, current_user: AllAuthenticatedRoles, search: str | None = None, customer_type: str | None = Query(None, alias="customerType"), customer_status: str | None = Query(None, alias="status"), city: str | None = None, state: str | None = None, country: str | None = None, sort: str = "name"):
    import_sales_customers(db, current_user.company_id)
    db.flush()
    filters = [Customer.company_id == current_user.company_id]
    if search:
        term = f"%{search}%"
        filters.append(or_(Customer.full_name.ilike(term), Customer.customer_id.ilike(term), Customer.email.ilike(term), Customer.phone.ilike(term)))
    if customer_type: filters.append(Customer.customer_type == customer_type)
    if customer_status: filters.append(Customer.status == customer_status)
    if city: filters.append(Customer.city == city)
    if state: filters.append(Customer.state == state)
    if country: filters.append(Customer.country == country)
    order = desc(Customer.created_at) if sort == "since" else asc(Customer.full_name)
    customers = list(db.scalars(select(Customer).options(joinedload(Customer.summary), joinedload(Customer.timeline)).where(*filters).order_by(order)).unique().all())
    items = [serialize(db, item) for item in customers]
    if sort == "spend": items.sort(key=lambda x: x.summary.total_revenue, reverse=True)
    elif sort == "orders": items.sort(key=lambda x: x.summary.total_orders, reverse=True)
    elif sort == "lastPurchase": items.sort(key=lambda x: x.summary.last_purchase_date or datetime.min.replace(tzinfo=UTC), reverse=True)
    db.commit()
    return CustomerList(items=items, total=len(items))


@router.get("/analytics")
def analytics(db: DatabaseSession, current_user: AllAuthenticatedRoles):
    import_sales_customers(db, current_user.company_id)
    db.flush()
    customers = list(db.scalars(select(Customer).options(joinedload(Customer.summary), joinedload(Customer.timeline)).where(Customer.company_id == current_user.company_id)).unique().all())
    rows = [serialize(db, c) for c in customers]
    now = datetime.now(UTC)
    total_revenue = sum((Decimal(r.summary.total_revenue) for r in rows), Decimal("0"))
    returning = sum(r.summary.total_orders > 1 for r in rows)
    by_type = {}
    by_location = {}
    segments = {}
    for row in rows:
        by_type[row.customer_type] = by_type.get(row.customer_type, 0) + float(row.summary.total_revenue)
        location = row.city or row.state or row.country or "Unknown"
        by_location[location] = by_location.get(location, 0) + 1
        segments[row.segment] = segments.get(row.segment, 0) + 1
    monthly = {}
    for row in rows:
        key = row.created_at.strftime("%Y-%m")
        monthly[key] = monthly.get(key, 0) + 1
    sales_rows = list(db.scalars(select(Sale).where(Sale.company_id == current_user.company_id)).all())
    period_starts = {
        "day": now.replace(hour=0, minute=0, second=0, microsecond=0),
        "month": now.replace(day=1, hour=0, minute=0, second=0, microsecond=0),
        "year": now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0),
    }
    top_by_period = {}
    for period, start in period_starts.items():
        totals = {}
        for sale in sales_rows:
            sale_date = sale.sale_date if sale.sale_date.tzinfo else sale.sale_date.replace(tzinfo=UTC)
            if sale_date >= start:
                totals[sale.customer_name] = totals.get(sale.customer_name, Decimal("0")) + Decimal(sale.total_amount)
        top_by_period[period] = [{"name": name, "value": float(value)} for name, value in sorted(totals.items(), key=lambda item: item[1], reverse=True)[:10]]
    db.commit()
    return {
        "kpis": {"totalCustomers": len(rows), "activeCustomers": sum(r.status == "ACTIVE" for r in rows), "newCustomers": sum(r.created_at.year == now.year and r.created_at.month == now.month for r in rows), "returningCustomers": returning, "averageCustomerSpend": float(total_revenue / len(rows)) if rows else 0, "totalRevenue": float(total_revenue), "averagePurchaseFrequency": sum(float(r.summary.purchase_frequency) for r in rows) / len(rows) if rows else 0},
        "growth": [{"name": k, "value": v} for k, v in sorted(monthly.items())],
        "newVsReturning": [{"name": "New", "value": len(rows)-returning}, {"name": "Returning", "value": returning}],
        "revenueByType": [{"name": k, "value": v} for k, v in by_type.items()],
        "topCustomers": [{"name": r.full_name, "value": float(r.summary.total_revenue)} for r in sorted(rows, key=lambda x: x.summary.total_revenue, reverse=True)[:10]],
        "topCustomersByPeriod": top_by_period,
        "purchaseFrequency": [{"name": r.full_name, "value": float(r.summary.purchase_frequency)} for r in rows[:12]],
        "locations": [{"name": k, "value": v} for k, v in by_location.items()],
        "acquisition": [{"name": k, "value": v} for k, v in sorted(monthly.items())],
        "segments": [{"name": k, "value": v} for k, v in segments.items()],
    }


@router.get("/notifications")
def notifications(db: DatabaseSession, current_user: CompanyAdminOrSuperAdmin):
    return [{"id": n.id, "title": n.title, "message": n.message, "customerId": n.customer_id, "createdAt": n.created_at} for n in db.scalars(select(CustomerNotification).where(CustomerNotification.company_id == current_user.company_id, CustomerNotification.is_read.is_(False)).order_by(desc(CustomerNotification.created_at))).all()]


@router.delete("/notifications", status_code=204)
def clear_notifications(db: DatabaseSession, current_user: CompanyAdminOrSuperAdmin):
    for item in db.scalars(select(CustomerNotification).where(CustomerNotification.company_id == current_user.company_id, CustomerNotification.is_read.is_(False))).all():
        item.is_read = True
    db.commit()


@router.post("/export", status_code=204)
def log_export(db: DatabaseSession, current_user: AnalystOrHigher, client_ip: ClientIp, browser: BrowserInfo, report: str = "Customer List"):
    audit_log_service.create_log(db, company_id=current_user.company_id, user_id=current_user.id, action=AuditAction.CUSTOMER_EXPORTED, ip_address=client_ip, browser=browser, details=f"{report} exported")
    db.commit()


@router.get("/{customer_id}", response_model=CustomerResponse)
def detail(customer_id: UUID, db: DatabaseSession, current_user: AllAuthenticatedRoles):
    item = serialize(db, get_customer(db, current_user.company_id, customer_id)); db.commit(); return item


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create(data: CustomerWrite, db: DatabaseSession, current_user: AnalystOrHigher, client_ip: ClientIp, browser: BrowserInfo):
    ensure_unique(db, current_user.company_id, data)
    latest = db.scalar(select(Customer.customer_id).where(Customer.company_id == current_user.company_id).order_by(desc(Customer.customer_id)).limit(1))
    code = f"CUST-{datetime.now().year}-{(int(latest.rsplit('-', 1)[1]) + 1 if latest else 1):06d}"
    customer = Customer(company_id=current_user.company_id, customer_id=code, **data.model_dump())
    db.add(customer); db.flush()
    db.add(CustomerPurchaseSummary(customer_id=customer.id))
    db.add(CustomerTimeline(customer_id=customer.id, event="Customer Registered", details="Customer profile created."))
    db.add(CustomerNotification(company_id=current_user.company_id, customer_id=customer.id, title="New customer registered", message=f"{customer.full_name} ({code}) was added."))
    audit(db, current_user, AuditAction.CUSTOMER_CREATED, customer, client_ip, browser)
    db.commit()
    return serialize(db, get_customer(db, current_user.company_id, customer.id))


@router.put("/{customer_id}", response_model=CustomerResponse)
def update(customer_id: UUID, data: CustomerWrite, db: DatabaseSession, current_user: AnalystOrHigher, client_ip: ClientIp, browser: BrowserInfo):
    customer = get_customer(db, current_user.company_id, customer_id); ensure_unique(db, current_user.company_id, data, customer.id)
    old_status = customer.status
    for key, value in data.model_dump().items(): setattr(customer, key, value)
    db.add(CustomerTimeline(customer_id=customer.id, event="Profile Updated", details="Customer information updated."))
    action = AuditAction.CUSTOMER_UPDATED
    if old_status != customer.status:
        event = "Customer Reactivated" if customer.status == "ACTIVE" else "Customer Deactivated"
        db.add(CustomerTimeline(customer_id=customer.id, event=event, details=f"Status changed from {old_status}."))
        action = AuditAction.CUSTOMER_ACTIVATED if customer.status == "ACTIVE" else AuditAction.CUSTOMER_DEACTIVATED
        audit(db, current_user, AuditAction.CUSTOMER_STATUS_CHANGED, customer, client_ip, browser)
    audit(db, current_user, action, customer, client_ip, browser); db.commit()
    return serialize(db, get_customer(db, current_user.company_id, customer.id))


@router.delete("/{customer_id}", status_code=204)
def delete(customer_id: UUID, db: DatabaseSession, current_user: AnalystOrHigher, client_ip: ClientIp, browser: BrowserInfo):
    customer = get_customer(db, current_user.company_id, customer_id)
    audit(db, current_user, AuditAction.CUSTOMER_DELETED, customer, client_ip, browser)
    db.delete(customer); db.commit()
