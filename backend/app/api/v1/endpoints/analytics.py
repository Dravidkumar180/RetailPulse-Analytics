from datetime import UTC, date, datetime, time
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import distinct, func, select

from app.api.dependencies import BrowserInfo, ClientIp, DatabaseSession
from app.core.constants import AuditAction
from app.core.permissions import AllAuthenticatedRoles
from app.models.catalog import Category, Product
from app.models.customer import Customer
from app.models.sales import Sale, SaleItem
from app.services.audit_log_service import audit_log_service

router = APIRouter()
VALID_INTERVALS = {"daily", "weekly", "monthly"}
VALID_PAYMENTS = {"CASH", "CARD", "UPI", "BANK_TRANSFER"}
VALID_STATUSES = {"PAID", "PENDING", "FAILED"}


def money(value: Decimal | int | float | None) -> float:
    return round(float(value or 0), 2)


def record_audit(db, user, action: AuditAction, ip: str, browser: str, details: str) -> None:
    audit_log_service.create_log(db, company_id=user.company_id, user_id=user.id,
        action=action, ip_address=ip, browser=browser, details=details)
    db.commit()


def validate_filters(start_date, end_date, interval, payment_method, payment_status):
    if start_date and end_date and start_date > end_date:
        raise HTTPException(422, "Start date must be on or before end date.")
    if interval not in VALID_INTERVALS:
        raise HTTPException(422, "Interval must be daily, weekly, or monthly.")
    if payment_method and payment_method not in VALID_PAYMENTS:
        raise HTTPException(422, "Invalid payment method.")
    if payment_status and payment_status not in VALID_STATUSES:
        raise HTTPException(422, "Invalid payment status.")


@router.get("/sales/dashboard")
@router.get("/dashboard", include_in_schema=False)
def sales_dashboard(
    db: DatabaseSession, current_user: AllAuthenticatedRoles,
    start_date: date | None = Query(None, alias="startDate"),
    end_date: date | None = Query(None, alias="endDate"),
    product_id: UUID | None = Query(None, alias="productId"),
    category_id: UUID | None = Query(None, alias="categoryId"),
    customer_id: UUID | None = Query(None, alias="customerId"),
    payment_method: str | None = Query(None, alias="paymentMethod"),
    payment_status: str | None = Query(None, alias="paymentStatus"),
    interval: str = "daily",
):
    """Sales analytics in one cacheable response; all large calculations run in SQL."""
    validate_filters(start_date, end_date, interval, payment_method, payment_status)
    company_id = current_user.company_id
    filters = [Sale.company_id == company_id]
    if start_date:
        filters.append(Sale.sale_date >= datetime.combine(start_date, time.min, tzinfo=UTC))
    if end_date:
        filters.append(Sale.sale_date <= datetime.combine(end_date, time.max, tzinfo=UTC))
    if customer_id:
        filters.append(Sale.customer_id == customer_id)
    if payment_method:
        filters.append(Sale.payment_method == payment_method)
    if payment_status:
        filters.append(Sale.payment_status == payment_status)

    line_filters = [*filters]
    if product_id:
        line_filters.append(SaleItem.product_id == product_id)
    if category_id:
        line_filters.append(SaleItem.category_id == category_id)

    line_base = select(Sale.id.label("sale_id"), Sale.sale_date, Sale.customer_id,
        Sale.customer_name, Sale.payment_method, SaleItem.product_id, SaleItem.quantity,
        SaleItem.discount, SaleItem.tax, SaleItem.total).join(SaleItem).where(*line_filters).subquery()
    totals = db.execute(select(func.coalesce(func.sum(line_base.c.total), 0),
        func.count(distinct(line_base.c.sale_id)), func.coalesce(func.sum(line_base.c.quantity), 0),
        func.coalesce(func.sum(line_base.c.discount), 0), func.coalesce(func.sum(line_base.c.tax), 0))).one()
    revenue, orders, items = money(totals[0]), int(totals[1]), int(totals[2])

    product_rows = db.execute(select(Product.id, Product.name, Product.sku,
        func.sum(line_base.c.quantity).label("units"), func.sum(line_base.c.total).label("revenue"))
        .join(line_base, line_base.c.product_id == Product.id).group_by(Product.id, Product.name, Product.sku)
        .order_by(func.sum(line_base.c.total).desc()).limit(100)).all()
    customer_rows = db.execute(select(line_base.c.customer_id, line_base.c.customer_name,
        func.count(distinct(line_base.c.sale_id)).label("orders"), func.sum(line_base.c.total).label("spend"))
        .group_by(line_base.c.customer_id, line_base.c.customer_name)
        .order_by(func.sum(line_base.c.total).desc()).limit(100)).all()
    payment_rows = db.execute(select(line_base.c.payment_method,
        func.count(distinct(line_base.c.sale_id)), func.sum(line_base.c.total))
        .group_by(line_base.c.payment_method).order_by(func.sum(line_base.c.total).desc())).all()

    # Only already-aggregated daily buckets are transformed in Python, keeping raw transactions off the wire.
    daily_rows = db.execute(select(func.date(line_base.c.sale_date).label("day"),
        func.sum(line_base.c.total), func.count(distinct(line_base.c.sale_id)))
        .group_by(func.date(line_base.c.sale_date)).order_by(func.date(line_base.c.sale_date))).all()
    buckets = {}
    for raw_day, amount, count in daily_rows:
        day = date.fromisoformat(str(raw_day)[:10])
        if interval == "monthly": key = day.strftime("%Y-%m")
        elif interval == "weekly":
            iso = day.isocalendar(); key = f"{iso.year}-W{iso.week:02d}"
        else: key = day.isoformat()
        bucket = buckets.setdefault(key, {"revenue": 0.0, "orders": 0})
        bucket["revenue"] += money(amount); bucket["orders"] += int(count)

    products = db.execute(select(Product.id, Product.name).where(Product.company_id == company_id).order_by(Product.name)).all()
    categories = db.execute(select(Category.id, Category.name).where(Category.company_id == company_id).order_by(Category.name)).all()
    customers = db.execute(select(Customer.id, Customer.full_name).where(Customer.company_id == company_id, Customer.is_deleted.is_(False)).order_by(Customer.full_name)).all()
    return {
        "kpis": {"totalRevenue": revenue, "totalOrders": orders,
            "averageOrderValue": money(revenue / orders) if orders else 0,
            "totalItemsSold": items, "totalDiscount": money(totals[3]), "totalTax": money(totals[4])},
        "trend": [{"label": key, **value} for key, value in buckets.items()],
        "topProducts": [{"id": str(row.id), "name": row.name, "sku": row.sku,
            "units": int(row.units), "revenue": money(row.revenue)} for row in product_rows],
        "topCustomers": [{"id": str(row.customer_id) if row.customer_id else None,
            "name": row.customer_name, "orders": int(row.orders), "totalSpend": money(row.spend),
            "averageOrderValue": money(row.spend / row.orders) if row.orders else 0} for row in customer_rows],
        "paymentMethods": [{"name": row[0], "transactions": int(row[1]), "revenue": money(row[2])} for row in payment_rows],
        "options": {"products": [{"id": str(x.id), "name": x.name} for x in products],
            "categories": [{"id": str(x.id), "name": x.name} for x in categories],
            "customers": [{"id": str(x.id), "name": x.full_name} for x in customers],
            "paymentMethods": sorted(VALID_PAYMENTS), "paymentStatuses": sorted(VALID_STATUSES)},
        "lastUpdated": datetime.now(UTC).isoformat(),
    }


@router.post("/audit")
def log_dashboard_action(payload: dict, db: DatabaseSession, current_user: AllAuthenticatedRoles,
    client_ip: ClientIp, browser: BrowserInfo):
    action = payload.get("action")
    audit_action = AuditAction.REPORT_EXPORTED if action == "export" else AuditAction.DASHBOARD_FILTERS_APPLIED
    if action not in {"export", "filters"}:
        raise HTTPException(422, "Unsupported analytics audit action.")
    record_audit(db, current_user, audit_action, client_ip, browser,
        str(payload.get("details") or "Sales analytics action")[:2000])
    return {"message": "Audit event recorded."}
