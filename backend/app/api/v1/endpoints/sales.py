from datetime import UTC, date, datetime, time
from decimal import Decimal, ROUND_HALF_UP
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import asc, desc, func, or_, select
from sqlalchemy.orm import joinedload

from app.api.dependencies import BrowserInfo, ClientIp, DatabaseSession
from app.core.constants import AuditAction
from app.core.permissions import AnalystOrHigher
from app.models.catalog import Product
from app.models.sales import Sale, SaleItem
from app.schemas.sales import SaleList, SaleResponse, SalesSummary, SaleWrite
from app.services.audit_log_service import audit_log_service

router = APIRouter()
MONEY = Decimal("0.01")
LOW_STOCK_THRESHOLD = 5

def money(value: Decimal) -> Decimal:
    return value.quantize(MONEY, rounding=ROUND_HALF_UP)

def get_sale(db, company_id: UUID, sale_id: UUID) -> Sale:
    statement = select(Sale).options(joinedload(Sale.created_by), joinedload(Sale.items).joinedload(SaleItem.product), joinedload(Sale.items).joinedload(SaleItem.category)).where(Sale.id == sale_id, Sale.company_id == company_id)
    sale = db.scalar(statement)
    if not sale: raise HTTPException(status_code=404, detail="Sale not found.")
    return sale

def response(sale: Sale, alerts: list[str] | None = None) -> SaleResponse:
    return SaleResponse.model_validate({"id": sale.id, "invoice_number": sale.invoice_number, "customer_name": sale.customer_name, "sale_date": sale.sale_date, "sales_channel": sale.sales_channel, "payment_method": sale.payment_method, "total_amount": sale.total_amount, "created_by_name": sale.created_by.name, "created_at": sale.created_at, "updated_at": sale.updated_at, "inventory_alerts": alerts or [], "items": [{"id": i.id, "product_id": i.product_id, "product_name": i.product.name, "category_id": i.category_id, "category_name": i.category.name, "quantity": i.quantity, "unit_price": i.unit_price, "discount": i.discount, "tax": i.tax, "total": i.total, "remaining_stock": i.product.stock_quantity} for i in sale.items]})

def next_invoice(db, company_id: UUID, sale_date: datetime) -> str:
    prefix = f"INV-{sale_date.year}-"
    latest = db.scalar(select(Sale.invoice_number).where(Sale.company_id == company_id, Sale.invoice_number.like(f"{prefix}%")).order_by(desc(Sale.invoice_number)).limit(1))
    return f"{prefix}{(int(latest.rsplit('-', 1)[1]) + 1 if latest else 1):06d}"

def apply_items(db, company_id: UUID, sale: Sale, data: SaleWrite, restore: bool = False) -> list[str]:
    if restore:
        for old in sale.items:
            product = db.scalar(select(Product).where(Product.id == old.product_id).with_for_update())
            if product: product.stock_quantity += old.quantity
        sale.items.clear(); db.flush()
    requested = [item.product_id for item in data.items]
    products = {p.id: p for p in db.scalars(select(Product).where(Product.company_id == company_id, Product.id.in_(requested)).with_for_update()).all()}
    if len(products) != len(requested): raise HTTPException(status_code=400, detail="One or more selected products do not belong to your company.")
    alerts: list[str] = []; total = Decimal("0")
    for item in data.items:
        product = products[item.product_id]
        if product.status != "ACTIVE": raise HTTPException(status_code=400, detail=f"{product.name} is inactive and cannot be sold.")
        if item.quantity > product.stock_quantity: raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name}. Only {product.stock_quantity} remaining.")
        line_total = money(item.quantity * item.unit_price - item.discount + item.tax)
        product.stock_quantity -= item.quantity
        if product.stock_quantity == 0:
            product.status = "OUT_OF_STOCK"; alerts.append(f"{product.name} is now out of stock.")
        elif product.stock_quantity <= LOW_STOCK_THRESHOLD: alerts.append(f"{product.name} is low in stock ({product.stock_quantity} remaining).")
        sale.items.append(SaleItem(product_id=product.id, category_id=product.category_id, quantity=item.quantity, unit_price=money(item.unit_price), discount=money(item.discount), tax=money(item.tax), total=line_total)); total += line_total
    sale.customer_name=data.customer_name.strip(); sale.sale_date=data.sale_date; sale.sales_channel=data.sales_channel; sale.payment_method=data.payment_method; sale.total_amount=money(total)
    return alerts

def log(db, user, action: AuditAction, sale: Sale, ip: str, browser: str, suffix: str = "") -> None:
    product_ids = [item.product_id for item in sale.items]
    products = ", ".join(
        db.scalars(
            select(Product.name).where(Product.id.in_(product_ids))
        ).all()
    )
    audit_log_service.create_log(db, company_id=user.company_id, user_id=user.id, action=action, ip_address=ip, browser=browser, details=f"Invoice {sale.invoice_number}; Products: {products}{suffix}")

@router.get("/summary", response_model=SalesSummary)
def summary(db: DatabaseSession, current_user: AnalystOrHigher) -> SalesSummary:
    orders, revenue = db.execute(select(func.count(Sale.id), func.coalesce(func.sum(Sale.total_amount), 0)).where(Sale.company_id == current_user.company_id)).one(); total = Decimal(revenue)
    return SalesSummary(total_sales=orders, total_revenue=total, total_orders=orders, average_order_value=money(total/orders) if orders else Decimal("0"))

@router.get("", response_model=SaleList)
def list_sales(db: DatabaseSession, current_user: AnalystOrHigher, search: str | None = None, start_date: date | None = Query(None, alias="startDate"), end_date: date | None = Query(None, alias="endDate"), category_id: UUID | None = Query(None, alias="categoryId"), sales_channel: str | None = Query(None, alias="salesChannel"), payment_method: str | None = Query(None, alias="paymentMethod"), sort: str = "date") -> SaleList:
    filters = [Sale.company_id == current_user.company_id]
    if search: filters.append(or_(Sale.invoice_number.ilike(f"%{search}%"), Sale.customer_name.ilike(f"%{search}%"), Sale.items.any(SaleItem.product.has(Product.name.ilike(f"%{search}%")))))
    if start_date: filters.append(Sale.sale_date >= datetime.combine(start_date, time.min, tzinfo=UTC))
    if end_date: filters.append(Sale.sale_date <= datetime.combine(end_date, time.max, tzinfo=UTC))
    if category_id: filters.append(Sale.items.any(SaleItem.category_id == category_id))
    if sales_channel: filters.append(Sale.sales_channel == sales_channel)
    if payment_method: filters.append(Sale.payment_method == payment_method)
    ordering = asc(Sale.invoice_number) if sort == "invoice" else desc(Sale.total_amount) if sort == "total" else desc(Sale.sale_date)
    items = list(db.scalars(select(Sale).options(joinedload(Sale.created_by), joinedload(Sale.items).joinedload(SaleItem.product), joinedload(Sale.items).joinedload(SaleItem.category)).where(*filters).order_by(ordering)).unique().all())
    return SaleList(items=[response(s) for s in items], total=len(items))

@router.get("/{sale_id}", response_model=SaleResponse)
def detail(sale_id: UUID, db: DatabaseSession, current_user: AnalystOrHigher) -> SaleResponse: return response(get_sale(db, current_user.company_id, sale_id))

@router.post("", response_model=SaleResponse, status_code=status.HTTP_201_CREATED)
def create(data: SaleWrite, db: DatabaseSession, current_user: AnalystOrHigher, client_ip: ClientIp, browser: BrowserInfo) -> SaleResponse:
    sale=Sale(company_id=current_user.company_id, invoice_number=next_invoice(db,current_user.company_id,data.sale_date), customer_name=data.customer_name.strip(), sale_date=data.sale_date, sales_channel=data.sales_channel, payment_method=data.payment_method, total_amount=0, created_by_id=current_user.id); db.add(sale); db.flush(); alerts=apply_items(db,current_user.company_id,sale,data); log(db,current_user,AuditAction.SALE_CREATED,sale,client_ip,browser); log(db,current_user,AuditAction.INVENTORY_UPDATED,sale,client_ip,browser)
    if any("out of stock" in a for a in alerts): log(db,current_user,AuditAction.PRODUCT_OUT_OF_STOCK,sale,client_ip,browser)
    db.commit(); return response(get_sale(db,current_user.company_id,sale.id),alerts)

@router.put("/{sale_id}", response_model=SaleResponse)
def update(sale_id: UUID, data: SaleWrite, db: DatabaseSession, current_user: AnalystOrHigher, client_ip: ClientIp, browser: BrowserInfo) -> SaleResponse:
    sale=get_sale(db,current_user.company_id,sale_id); alerts=apply_items(db,current_user.company_id,sale,data,True); log(db,current_user,AuditAction.SALE_UPDATED,sale,client_ip,browser); log(db,current_user,AuditAction.INVENTORY_UPDATED,sale,client_ip,browser); db.commit(); return response(get_sale(db,current_user.company_id,sale.id),alerts)

@router.delete("/{sale_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(sale_id: UUID, db: DatabaseSession, current_user: AnalystOrHigher, client_ip: ClientIp, browser: BrowserInfo):
    sale=get_sale(db,current_user.company_id,sale_id)
    for item in sale.items:
        item.product.stock_quantity += item.quantity
        if item.product.status == "OUT_OF_STOCK": item.product.status="ACTIVE"
    log(db,current_user,AuditAction.SALE_DELETED,sale,client_ip,browser,"; inventory restored"); log(db,current_user,AuditAction.INVENTORY_UPDATED,sale,client_ip,browser,"; inventory restored"); db.delete(sale); db.commit()
