from collections import defaultdict
from datetime import UTC, date, datetime, time
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Query
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.api.dependencies import BrowserInfo, ClientIp, DatabaseSession
from app.core.constants import AuditAction
from app.core.permissions import AllAuthenticatedRoles
from app.models.catalog import Category, Product
from app.models.inventory import Inventory
from app.models.sales import Sale, SaleItem
from app.services.audit_log_service import audit_log_service

router = APIRouter()


def as_money(value: Decimal | int | float) -> float:
    return round(float(value), 2)


def audit(db, user, action: AuditAction, ip: str, browser: str, details: str) -> None:
    audit_log_service.create_log(
        db,
        company_id=user.company_id,
        user_id=user.id,
        action=action,
        ip_address=ip,
        browser=browser,
        details=details,
    )
    db.commit()


@router.get("/dashboard")
def dashboard(
    db: DatabaseSession,
    current_user: AllAuthenticatedRoles,
    client_ip: ClientIp,
    browser: BrowserInfo,
    start_date: date | None = Query(None, alias="startDate"),
    end_date: date | None = Query(None, alias="endDate"),
    product_id: UUID | None = Query(None, alias="productId"),
    category_id: UUID | None = Query(None, alias="categoryId"),
    brand: str | None = None,
    sales_channel: str | None = Query(None, alias="salesChannel"),
    payment_method: str | None = Query(None, alias="paymentMethod"),
    interval: str = "daily",
):
    company_id = current_user.company_id
    product_filters = [Product.company_id == company_id]
    if product_id:
        product_filters.append(Product.id == product_id)
    if category_id:
        product_filters.append(Product.category_id == category_id)
    if brand:
        product_filters.append(Product.brand == brand)
    products = list(
        db.scalars(
            select(Product)
            .options(joinedload(Product.category))
            .where(*product_filters)
            .order_by(Product.name)
        ).all()
    )
    selected_product_ids = {product.id for product in products}

    sale_filters = [Sale.company_id == company_id]
    if start_date:
        sale_filters.append(Sale.sale_date >= datetime.combine(start_date, time.min, tzinfo=UTC))
    if end_date:
        sale_filters.append(Sale.sale_date <= datetime.combine(end_date, time.max, tzinfo=UTC))
    if sales_channel:
        sale_filters.append(Sale.sales_channel == sales_channel)
    if payment_method:
        sale_filters.append(Sale.payment_method == payment_method)
    if product_id or category_id or brand:
        sale_filters.append(Sale.items.any(SaleItem.product_id.in_(selected_product_ids or {UUID(int=0)})))
    sales = list(
        db.scalars(
            select(Sale)
            .options(
                joinedload(Sale.items).joinedload(SaleItem.product),
                joinedload(Sale.items).joinedload(SaleItem.category),
            )
            .where(*sale_filters)
            .order_by(Sale.sale_date)
        ).unique().all()
    )

    filtered_lines = []
    for sale in sales:
        for item in sale.items:
            if (product_id or category_id or brand) and item.product_id not in selected_product_ids:
                continue
            filtered_lines.append((sale, item))

    revenue = sum((item.total for _, item in filtered_lines), Decimal("0"))
    order_ids = {sale.id for sale, _ in filtered_lines}
    units = sum(item.quantity for _, item in filtered_lines)

    inventory_rows = list(
        db.scalars(
            select(Inventory)
            .join(Inventory.product)
            .options(joinedload(Inventory.product).joinedload(Product.category))
            .where(Inventory.company_id == company_id, Product.id.in_(selected_product_ids or {UUID(int=0)}))
        ).unique().all()
    )
    inventory_value = sum(
        (row.product.cost_price * row.current_stock for row in inventory_rows),
        Decimal("0"),
    )

    product_sales = defaultdict(lambda: {"units": 0, "revenue": Decimal("0"), "transactions": []})
    category_sales = defaultdict(lambda: {"units": 0, "revenue": Decimal("0")})
    payment_totals = defaultdict(Decimal)
    channel_totals = defaultdict(Decimal)
    trend = defaultdict(lambda: {"revenue": Decimal("0"), "units": 0, "orders": set()})
    for sale, item in filtered_lines:
        product_sales[item.product.name]["units"] += item.quantity
        product_sales[item.product.name]["revenue"] += item.total
        product_sales[item.product.name]["transactions"].append({
            "id": str(sale.id), "invoiceNumber": sale.invoice_number,
            "date": sale.sale_date.isoformat(), "quantity": item.quantity,
            "amount": as_money(item.total), "customer": sale.customer_name,
        })
        category_sales[item.category.name]["units"] += item.quantity
        category_sales[item.category.name]["revenue"] += item.total
        payment_totals[sale.payment_method] += item.total
        channel_totals[sale.sales_channel] += item.total
        day = sale.sale_date.date()
        if interval == "monthly":
            key = day.strftime("%Y-%m")
        elif interval == "weekly":
            iso = day.isocalendar()
            key = f"{iso.year}-W{iso.week:02d}"
        else:
            key = day.isoformat()
        trend[key]["revenue"] += item.total
        trend[key]["units"] += item.quantity
        trend[key]["orders"].add(sale.id)

    inventory_categories = defaultdict(lambda: {"quantity": 0, "value": Decimal("0")})
    statuses = defaultdict(int)
    for row in inventory_rows:
        name = row.product.category.name
        inventory_categories[name]["quantity"] += row.available_stock
        inventory_categories[name]["value"] += row.product.cost_price * row.current_stock
        statuses[row.stock_status] += 1

    all_products = list(
        db.scalars(
            select(Product).options(joinedload(Product.category))
            .where(Product.company_id == company_id).order_by(Product.name)
        ).all()
    )
    categories = list(
        db.scalars(select(Category).where(Category.company_id == company_id).order_by(Category.name)).all()
    )
    return {
        "kpis": {
            "totalRevenue": as_money(revenue),
            "totalOrders": len(order_ids),
            "totalProductsSold": units,
            "averageOrderValue": as_money(revenue / len(order_ids)) if order_ids else 0,
            "totalInventoryValue": as_money(inventory_value),
            "lowStockProducts": statuses["LOW_STOCK"],
            "outOfStockProducts": statuses["OUT_OF_STOCK"],
            "totalCategories": len({product.category_id for product in products}),
        },
        "trend": [
            {"label": key, "revenue": as_money(value["revenue"]), "sales": value["units"], "orders": len(value["orders"])}
            for key, value in sorted(trend.items())
        ],
        "topProducts": [
            {"name": name, "units": value["units"], "revenue": as_money(value["revenue"]), "transactions": value["transactions"]}
            for name, value in sorted(product_sales.items(), key=lambda item: item[1]["units"], reverse=True)[:10]
        ],
        "topCategories": [
            {"name": name, "units": value["units"], "revenue": as_money(value["revenue"])}
            for name, value in sorted(category_sales.items(), key=lambda item: item[1]["revenue"], reverse=True)
        ],
        "paymentMethods": [{"name": key, "value": as_money(value)} for key, value in payment_totals.items()],
        "salesChannels": [{"name": key, "value": as_money(value)} for key, value in channel_totals.items()],
        "inventoryByCategory": [
            {"name": key, "quantity": value["quantity"], "value": as_money(value["value"])}
            for key, value in inventory_categories.items()
        ],
        "stockStatus": [{"name": key, "value": value} for key, value in statuses.items()],
        "lowStock": [
            {"productId": str(row.product_id), "name": row.product.name, "sku": row.product.sku, "stock": row.available_stock, "reorderLevel": row.reorder_level}
            for row in sorted(inventory_rows, key=lambda item: item.available_stock) if row.stock_status == "LOW_STOCK"
        ][:10],
        "outOfStock": [
            {"productId": str(row.product_id), "name": row.product.name, "sku": row.product.sku}
            for row in inventory_rows if row.stock_status == "OUT_OF_STOCK"
        ],
        "options": {
            "products": [{"id": str(product.id), "name": product.name} for product in all_products],
            "categories": [{"id": str(category.id), "name": category.name} for category in categories],
            "brands": sorted({product.brand for product in all_products if product.brand}),
        },
        "lastUpdated": datetime.now(UTC).isoformat(),
    }


@router.post("/audit")
def log_dashboard_action(
    payload: dict,
    db: DatabaseSession,
    current_user: AllAuthenticatedRoles,
    client_ip: ClientIp,
    browser: BrowserInfo,
):
    action = payload.get("action")
    if action != "export":
        return {"message": "No audit event required for this action."}
    audit_action = AuditAction.REPORT_EXPORTED
    details = payload.get("details") or "Analytics dashboard action"
    audit(db, current_user, audit_action, client_ip, browser, details)
    return {"message": "Audit event recorded."}
