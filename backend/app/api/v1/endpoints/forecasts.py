"""Demand forecasting API using a transparent weighted moving-average model."""

from collections import defaultdict
from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import delete, desc, func, select
from sqlalchemy.orm import joinedload

from app.api.dependencies import BrowserInfo, ClientIp, DatabaseSession
from app.core.constants import AuditAction
from app.core.permissions import AnalystOrHigher
from app.models.catalog import Product
from app.models.forecast import DemandForecast, ForecastHistory
from app.models.inventory import Inventory, InventoryNotification
from app.models.sales import Sale, SaleItem
from app.services.audit_log_service import audit_log_service

router = APIRouter()


def log(db, user, action, ip, browser, details):
    audit_log_service.create_log(db, company_id=user.company_id, user_id=user.id, action=action, ip_address=ip, browser=browser, details=details)


def period_days(period: str, custom_start=None, custom_end=None) -> int:
    if period == "7": return 7
    if period == "90": return 90
    if period == "custom" and custom_start and custom_end:
        return max(1, min(365, (custom_end - custom_start).days + 1))
    return 30


def build_dashboard(db, company_id: UUID, period: str):
    forecasts = list(db.scalars(
        select(DemandForecast).options(joinedload(DemandForecast.product).joinedload(Product.category))
        .where(DemandForecast.company_id == company_id, DemandForecast.forecast_period == period)
        .order_by(desc(DemandForecast.predicted_demand))
    ).unique().all())
    inventory = {row.product_id: row for row in db.scalars(select(Inventory).where(Inventory.company_id == company_id)).all()}
    latest_history = {}
    for row in db.scalars(select(ForecastHistory).join(DemandForecast).where(DemandForecast.company_id == company_id)).all():
        latest_history[row.forecast_id] = row
    products = []
    categories = defaultdict(lambda: {"historicalSales": 0, "predictedDemand": 0, "confidence": []})
    for forecast in forecasts:
        history = latest_history.get(forecast.id)
        inv = inventory.get(forecast.product_id)
        stock = inv.available_stock if inv else forecast.product.stock_quantity
        reorder = inv.reorder_level if inv else 5
        predicted = forecast.predicted_demand
        recommendation = "IMMEDIATE_RESTOCK" if stock < reorder or predicted > stock * 1.5 else "REORDER_SOON" if predicted > stock else "OVERSTOCK_RISK" if stock > predicted * 2 else "STOCK_HEALTHY"
        historical = history.historical_sales if history else 0
        growth = round(((predicted - historical) / max(historical, 1)) * 100, 1)
        products.append({"id": str(forecast.id), "productId": str(forecast.product_id), "name": forecast.product.name, "sku": forecast.product.sku, "brand": forecast.product.brand, "category": forecast.product.category.name, "categoryId": str(forecast.category_id), "currentStock": stock, "reorderLevel": reorder, "historicalSales": historical, "predictedDemand": predicted, "confidence": round(forecast.confidence_score, 1), "growth": growth, "recommendation": recommendation, "generatedAt": forecast.generated_at.isoformat()})
        cat = categories[forecast.product.category.name]
        cat["historicalSales"] += historical
        cat["predictedDemand"] += predicted
        cat["confidence"].append(forecast.confidence_score)
    # Add active products without forecastable history so the dashboard remains
    # a complete product and category catalogue for the current company.
    forecast_product_ids = {forecast.product_id for forecast in forecasts}
    all_active_products = list(
        db.scalars(
            select(Product)
            .options(joinedload(Product.category))
            .where(
                Product.company_id == company_id,
                Product.status == "ACTIVE",
            )
            .order_by(Product.name)
        ).unique().all()
    )
    for product in all_active_products:
        if product.id in forecast_product_ids:
            continue
        inv = inventory.get(product.id)
        products.append({
            "id": str(product.id),
            "productId": str(product.id),
            "name": product.name,
            "sku": product.sku,
            "brand": product.brand,
            "category": product.category.name,
            "categoryId": str(product.category_id),
            "currentStock": inv.available_stock if inv else product.stock_quantity,
            "reorderLevel": inv.reorder_level if inv else 5,
            "historicalSales": 0,
            "predictedDemand": 0,
            "confidence": 0,
            "growth": 0,
            "recommendation": "STOCK_HEALTHY",
            "generatedAt": "",
        })
        categories[product.category.name]

    products.sort(key=lambda item: (-item["predictedDemand"], item["name"]))
    category_rows = []
    for name, value in categories.items():
        growth = round((value["predictedDemand"] - value["historicalSales"]) / max(value["historicalSales"], 1) * 100, 1)
        category_rows.append({"name": name, "historicalSales": value["historicalSales"], "predictedDemand": value["predictedDemand"], "growth": growth, "confidence": round(sum(value["confidence"]) / len(value["confidence"]), 1) if value["confidence"] else 0})
    return {
        "products": products,
        "categories": category_rows,
        "generatedAt": forecasts[0].generated_at.isoformat() if forecasts else None,
        "options": {
            "brands": sorted({item["brand"] for item in products if item["brand"]}),
            "categories": sorted({item["category"] for item in products}),
        },
    }


@router.get("")
def dashboard(db: DatabaseSession, current_user: AnalystOrHigher, period: str = "30"):
    result = build_dashboard(db, current_user.company_id, period)
    return result


@router.post("/generate")
def generate(payload: dict, db: DatabaseSession, current_user: AnalystOrHigher, client_ip: ClientIp, browser: BrowserInfo):
    period = str(payload.get("period", "30"))
    days = period_days(period)
    refresh = bool(payload.get("refresh"))
    products = list(db.scalars(select(Product).where(Product.company_id == current_user.company_id, Product.status == "ACTIVE")).all())
    if not products:
        raise HTTPException(400, "No active products are available for forecasting.")
    cutoff = datetime.now(UTC) - timedelta(days=60)
    rows = db.execute(
        select(SaleItem.product_id, func.sum(SaleItem.quantity))
        .join(Sale).where(Sale.company_id == current_user.company_id, Sale.sale_date >= cutoff, SaleItem.product_id.in_([p.id for p in products]))
        .group_by(SaleItem.product_id)
    ).all()
    sales = {product_id: int(quantity) for product_id, quantity in rows}
    if not sales:
        raise HTTPException(400, "Forecast generation requires historical sales data.")
    existing = list(db.scalars(select(DemandForecast).where(DemandForecast.company_id == current_user.company_id, DemandForecast.forecast_period == period)).all())
    if existing and not refresh:
        raise HTTPException(409, "A forecast already exists for this period. Use Refresh Forecast to recalculate it.")
    if existing:
        db.execute(delete(ForecastHistory).where(ForecastHistory.forecast_id.in_([row.id for row in existing])))
        db.execute(delete(DemandForecast).where(DemandForecast.id.in_([row.id for row in existing])))
        db.flush()
    created = 0
    for product in products:
        historical = sales.get(product.id, 0)
        if historical == 0: continue
        daily_average = historical / 60
        predicted = max(1, round(daily_average * days * 1.08))
        confidence = max(62, min(96, 68 + historical ** 0.5 * 2))
        forecast = DemandForecast(company_id=current_user.company_id, product_id=product.id, category_id=product.category_id, forecast_period=period, predicted_demand=predicted, confidence_score=confidence)
        db.add(forecast); db.flush()
        db.add(ForecastHistory(forecast_id=forecast.id, historical_sales=round(historical * days / 60), prediction=predicted, accuracy=confidence))
        inventory = db.scalar(select(Inventory).where(Inventory.company_id == current_user.company_id, Inventory.product_id == product.id))
        stock = inventory.available_stock if inventory else product.stock_quantity
        if predicted > stock:
            db.add(InventoryNotification(company_id=current_user.company_id, product_id=product.id, title="Forecasted inventory risk", message=f"{product.name}: predicted demand ({predicted}) exceeds available stock ({stock})."))
        elif predicted > historical * days / 60 * 1.2:
            db.add(InventoryNotification(company_id=current_user.company_id, product_id=product.id, title="Significant demand growth", message=f"{product.name} is forecast to grow significantly."))
        created += 1
    action = AuditAction.FORECAST_REFRESHED if refresh else AuditAction.FORECAST_GENERATED
    log(db, current_user, action, client_ip, browser, f"Forecast period: {days} days; Products: {created}; Company: {current_user.company_id}")
    log(db, current_user, AuditAction.INVENTORY_RECOMMENDATION_GENERATED, client_ip, browser, f"Forecast period: {days} days; Recommendations generated: {created}")
    db.commit()
    return build_dashboard(db, current_user.company_id, period)


@router.post("/export")
def export_audit(payload: dict, db: DatabaseSession, current_user: AnalystOrHigher, client_ip: ClientIp, browser: BrowserInfo):
    report = payload.get("report", "Demand Forecast Report")
    period = payload.get("period", "30")
    log(db, current_user, AuditAction.FORECAST_EXPORTED, client_ip, browser, f"Report: {report}; Forecast period: {period} days")
    db.commit()
    return {"message": "Forecast export recorded."}
