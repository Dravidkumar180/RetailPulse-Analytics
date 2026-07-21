# =========================================================
# Inventory API endpoints
# =========================================================

from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import asc, delete, desc, func, or_, select
from sqlalchemy.orm import joinedload

from app.api.dependencies import BrowserInfo, ClientIp, DatabaseSession
from app.core.constants import AuditAction
from app.core.permissions import AnalystOrHigher, CompanyAdminOrSuperAdmin
from app.models.catalog import Category, Product
from app.models.inventory import Inventory, InventoryMovement, InventoryNotification
from app.schemas.inventory import (
    InventoryItem,
    InventoryList,
    InventorySummary,
    MovementResponse,
    NotificationResponse,
    StockAdjustment,
)
from app.services.audit_log_service import audit_log_service

# All routes in this module are mounted under /api/v1/inventory.
router = APIRouter()


# =========================================================
# Stock status rules
# =========================================================


def stock_status(available: int, reorder_level: int) -> str:
    """Calculate the required stock status from available stock."""

    # Zero availability always takes priority and means out of stock.
    if available == 0:
        return "OUT_OF_STOCK"
    # Positive availability at or below the reorder level is low stock.
    if available <= reorder_level:
        return "LOW_STOCK"
    return "IN_STOCK"


# =========================================================
# Inventory synchronization
# =========================================================


def sync_inventory(db, company_id: UUID) -> None:
    """Create missing inventory rows and keep them aligned with products."""

    # Load only products and inventory belonging to the requested company.
    products = db.scalars(select(Product).where(Product.company_id == company_id)).all()
    existing = {
        row.product_id: row
        for row in db.scalars(
            select(Inventory).where(Inventory.company_id == company_id)
        ).all()
    }
    changed = False
    product_ids = {product.id for product in products}
    # Remove inventory records whose products were deleted from SQLite.
    orphan_ids = [
        row.id for product_id, row in existing.items() if product_id not in product_ids
    ]
    if orphan_ids:
        db.execute(
            delete(InventoryMovement).where(
                InventoryMovement.inventory_id.in_(orphan_ids)
            )
        )
        db.execute(delete(Inventory).where(Inventory.id.in_(orphan_ids)))
        changed = True
    # Create inventory for existing products and synchronize legacy quantities.
    for product in products:
        row = existing.get(product.id)
        if row is None:
            available = product.stock_quantity
            db.add(
                Inventory(
                    company_id=company_id,
                    product_id=product.id,
                    current_stock=product.stock_quantity,
                    reserved_stock=0,
                    available_stock=available,
                    reorder_level=5,
                    stock_status=stock_status(available, 5),
                )
            )
            changed = True
        elif row.current_stock != product.stock_quantity:
            row.current_stock = product.stock_quantity
            row.available_stock = max(0, product.stock_quantity - row.reserved_stock)
            row.stock_status = stock_status(row.available_stock, row.reorder_level)
            changed = True
    if changed:
        db.commit()


# =========================================================
# Response mapping
# =========================================================


def item_response(row: Inventory) -> InventoryItem:
    """Combine inventory and product fields for the overview table."""

    product = row.product
    return InventoryItem(
        id=row.id,
        product_id=product.id,
        product_name=product.name,
        sku=product.sku,
        category_id=product.category_id,
        category_name=product.category.name,
        brand=product.brand,
        current_stock=row.current_stock,
        reserved_stock=row.reserved_stock,
        available_stock=row.available_stock,
        reorder_level=row.reorder_level,
        stock_status=row.stock_status,
        updated_at=row.updated_at,
    )


# =========================================================
# Inventory overview, search, filtering and sorting
# =========================================================


@router.get("", response_model=InventoryList)
def list_inventory(
    db: DatabaseSession,
    current_user: AnalystOrHigher,
    search: str | None = None,
    category_id: UUID | None = Query(None, alias="categoryId"),
    brand: str | None = None,
    stock_status_filter: str | None = Query(None, alias="stockStatus"),
    sort: str = "product",
) -> InventoryList:
    """Return the current company's filtered inventory and dashboard data."""

    # Ensure older products have inventory rows before querying the overview.
    sync_inventory(db, current_user.company_id)
    # Company ID is always the first filter to enforce tenant isolation.
    filters = [Inventory.company_id == current_user.company_id]
    if search:
        filters.append(
            Inventory.product.has(
                or_(Product.name.ilike(f"%{search}%"), Product.sku.ilike(f"%{search}%"))
            )
        )
    if category_id:
        filters.append(Inventory.product.has(Product.category_id == category_id))
    if brand:
        filters.append(Inventory.product.has(Product.brand == brand))
    if stock_status_filter:
        filters.append(Inventory.stock_status == stock_status_filter)

    # Convert the frontend sort value into a safe SQLAlchemy ordering.
    ordering = (
        desc(Inventory.updated_at)
        if sort == "recent"
        else asc(Inventory.current_stock) if sort == "stock" else asc(Product.name)
    )
    statement = (
        select(Inventory)
        .join(Inventory.product)
        .options(joinedload(Inventory.product).joinedload(Product.category))
        .where(*filters)
        .order_by(ordering)
    )
    rows = list(db.scalars(statement).unique().all())
    all_rows = list(
        db.scalars(
            select(Inventory)
            .join(Inventory.product)
            .options(joinedload(Inventory.product).joinedload(Product.category))
            .where(Inventory.company_id == current_user.company_id)
        )
        .unique()
        .all()
    )

    # Aggregate current-company data for both dashboard charts.
    category_totals: dict[str, int] = {}
    status_totals = {"IN_STOCK": 0, "LOW_STOCK": 0, "OUT_OF_STOCK": 0}
    for row in all_rows:
        category_totals[row.product.category.name] = (
            category_totals.get(row.product.category.name, 0) + row.available_stock
        )
        status_totals[row.stock_status] = status_totals.get(row.stock_status, 0) + 1
    categories = [
        {"id": str(category.id), "name": category.name}
        for category in db.scalars(
            select(Category)
            .where(Category.company_id == current_user.company_id)
            .order_by(Category.name)
        ).all()
    ]
    brands = sorted({row.product.brand for row in all_rows if row.product.brand})
    summary = InventorySummary(
        total_products=len(all_rows),
        total_inventory_quantity=sum(row.current_stock for row in all_rows),
        low_stock_products=status_totals["LOW_STOCK"],
        out_of_stock_products=status_totals["OUT_OF_STOCK"],
        inventory_by_category=[
            {"name": name, "value": value} for name, value in category_totals.items()
        ],
        stock_status_distribution=[
            {"name": name, "value": value} for name, value in status_totals.items()
        ],
    )
    return InventoryList(
        items=[item_response(row) for row in rows],
        total=len(rows),
        summary=summary,
        categories=categories,
        brands=brands,
    )


# =========================================================
# Stock movement history
# =========================================================


@router.get("/movements", response_model=list[MovementResponse])
def list_movements(
    db: DatabaseSession,
    current_user: AnalystOrHigher,
    movement_type: str | None = Query(None, alias="movementType"),
    product_id: UUID | None = Query(None, alias="productId"),
) -> list[MovementResponse]:
    """Return up to 250 recent movements for the current company."""

    # Joining through Inventory guarantees company-based movement isolation.
    filters = [Inventory.company_id == current_user.company_id]
    if movement_type:
        filters.append(InventoryMovement.movement_type == movement_type)
    if product_id:
        filters.append(Inventory.product_id == product_id)
    rows = (
        db.scalars(
            select(InventoryMovement)
            .join(InventoryMovement.inventory)
            .options(
                joinedload(InventoryMovement.inventory).joinedload(Inventory.product),
                joinedload(InventoryMovement.performed_by),
            )
            .where(*filters)
            .order_by(desc(InventoryMovement.created_at))
            .limit(250)
        )
        .unique()
        .all()
    )
    return [
        MovementResponse(
            id=row.id,
            product_id=row.inventory.product_id,
            product_name=row.inventory.product.name,
            movement_type=row.movement_type,
            previous_quantity=row.previous_quantity,
            updated_quantity=row.updated_quantity,
            quantity_changed=row.quantity_changed,
            reason=row.reason,
            remarks=row.remarks,
            performed_by=row.performed_by.name,
            created_at=row.created_at,
        )
        for row in rows
    ]


# =========================================================
# Add stock, remove stock and manual adjustments
# =========================================================


@router.post(
    "/adjustments", response_model=MovementResponse, status_code=status.HTTP_201_CREATED
)
def adjust_stock(
    data: StockAdjustment,
    db: DatabaseSession,
    current_user: CompanyAdminOrSuperAdmin,
    client_ip: ClientIp,
    browser: BrowserInfo,
) -> MovementResponse:
    """Apply one validated stock adjustment as an atomic transaction."""

    # Synchronize and lock the selected row to avoid concurrent lost updates.
    sync_inventory(db, current_user.company_id)
    row = db.scalar(
        select(Inventory)
        .join(Inventory.product)
        .options(joinedload(Inventory.product), joinedload(Inventory.movements))
        .where(
            Inventory.company_id == current_user.company_id,
            Inventory.product_id == data.product_id,
        )
        .with_for_update()
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Inventory product not found.")
    previous = row.current_stock
    # Stock additions increase the current quantity.
    if data.adjustment_type == "STOCK_ADDITION":
        updated = previous + data.quantity
        audit_action = AuditAction.STOCK_ADDED
    # Stock removals cannot exceed the quantity currently available.
    elif data.adjustment_type == "STOCK_REMOVAL":
        if data.quantity > row.available_stock:
            raise HTTPException(
                status_code=400,
                detail=f"Stock out cannot exceed available stock ({row.available_stock}).",
            )
        updated = previous - data.quantity
        audit_action = AuditAction.STOCK_REMOVED
    # Manual adjustment sets the current stock to an exact counted quantity.
    else:
        updated = data.quantity
        if updated < row.reserved_stock:
            raise HTTPException(
                status_code=400,
                detail=f"Adjusted stock cannot be below reserved stock ({row.reserved_stock}).",
            )
        audit_action = AuditAction.STOCK_ADJUSTED

    old_status = row.stock_status
    old_reorder = row.reorder_level
    if data.reorder_level is not None:
        row.reorder_level = data.reorder_level
    # Recalculate all derived inventory fields after the adjustment.
    row.current_stock = updated
    row.available_stock = updated - row.reserved_stock
    row.stock_status = stock_status(row.available_stock, row.reorder_level)
    row.product.stock_quantity = updated
    # Persist a complete immutable movement history entry.
    movement = InventoryMovement(
        inventory_id=row.id,
        movement_type=data.adjustment_type,
        quantity_changed=updated - previous,
        previous_quantity=previous,
        updated_quantity=updated,
        reason=data.reason.strip(),
        remarks=data.remarks.strip() if data.remarks else None,
        performed_by_id=current_user.id,
    )
    db.add(movement)
    details = f"Product: {row.product.name}; Movement: {data.adjustment_type}; Quantity changed: {updated - previous:+d}; Previous: {previous}; Updated: {updated}; Reason: {data.reason}"
    # Store the main adjustment event on the shared Audit Logs page.
    audit_log_service.create_log(
        db,
        company_id=current_user.company_id,
        user_id=current_user.id,
        action=audit_action,
        ip_address=client_ip,
        browser=browser,
        details=details,
    )
    if data.reorder_level is not None and data.reorder_level != old_reorder:
        audit_log_service.create_log(
            db,
            company_id=current_user.company_id,
            user_id=current_user.id,
            action=AuditAction.REORDER_LEVEL_UPDATED,
            ip_address=client_ip,
            browser=browser,
            details=f"Product: {row.product.name}; Reorder level: {old_reorder} to {row.reorder_level}",
        )

    # Manual adjustments always notify admins; status transitions add alerts.
    notifications: list[tuple[str, str, AuditAction | None]] = [
        (
            "Stock manually adjusted",
            f"{row.product.name} stock changed from {previous} to {updated}.",
            None,
        )
    ]
    if row.stock_status == "OUT_OF_STOCK" and old_status != "OUT_OF_STOCK":
        notifications.append(
            (
                "Product out of stock",
                f"{row.product.name} is now out of stock.",
                AuditAction.PRODUCT_OUT_OF_STOCK,
            )
        )
    elif row.stock_status == "LOW_STOCK" and old_status != "LOW_STOCK":
        notifications.append(
            (
                "Low stock alert",
                f"{row.product.name} has only {row.available_stock} available.",
                AuditAction.PRODUCT_LOW_STOCK,
            )
        )
    for title, message, action in notifications:
        db.add(
            InventoryNotification(
                company_id=current_user.company_id,
                product_id=row.product_id,
                title=title,
                message=message,
            )
        )
        if action:
            audit_log_service.create_log(
                db,
                company_id=current_user.company_id,
                user_id=current_user.id,
                action=action,
                ip_address=client_ip,
                browser=browser,
                details=f"Product: {row.product.name}; Available stock: {row.available_stock}",
            )
    # Commit inventory, product, movement, notification and audit changes together.
    db.commit()
    db.refresh(movement)
    return MovementResponse(
        id=movement.id,
        product_id=row.product_id,
        product_name=row.product.name,
        movement_type=movement.movement_type,
        previous_quantity=previous,
        updated_quantity=updated,
        quantity_changed=movement.quantity_changed,
        reason=movement.reason,
        remarks=movement.remarks,
        performed_by=current_user.name,
        created_at=movement.created_at,
    )


# =========================================================
# Company Admin inventory notifications
# =========================================================


@router.get("/notifications", response_model=list[NotificationResponse])
def list_notifications(
    db: DatabaseSession, current_user: CompanyAdminOrSuperAdmin
) -> list[NotificationResponse]:
    """Return recent stock alerts for the current company's bell icon."""

    rows = db.scalars(
        select(InventoryNotification)
        .where(InventoryNotification.company_id == current_user.company_id)
        .order_by(desc(InventoryNotification.created_at))
        .limit(50)
    ).all()
    return [NotificationResponse.model_validate(row) for row in rows]


@router.delete("/notifications", status_code=status.HTTP_204_NO_CONTENT)
def clear_notifications(
    db: DatabaseSession, current_user: CompanyAdminOrSuperAdmin
) -> None:
    """Mark all company inventory notifications as read by removing them."""

    db.execute(
        delete(InventoryNotification).where(
            InventoryNotification.company_id == current_user.company_id
        )
    )
    db.commit()
