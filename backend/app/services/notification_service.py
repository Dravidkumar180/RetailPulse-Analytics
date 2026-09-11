"""Transactional event delivery and inventory condition lifecycle."""

from datetime import UTC, datetime, timedelta
from math import ceil
from uuid import uuid4
from urllib.parse import quote
from sqlalchemy import event, select, func, update, or_
from sqlalchemy.orm import Session
from app.core.constants import AuditAction, UserRole, UserStatus
from app.models.notification import Notification
from app.models.audit_log import AuditLog
from app.models.user import User
from app.models.catalog import Product
from app.models.inventory import Inventory
from app.models.sales import Sale, SaleItem
from app.models.data_import import DataImport
from app.models.customer import CustomerNotification

ADMINS = (UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
BUSINESS = (*ADMINS, UserRole.ANALYST)
TYPES = (
    "OUT_OF_STOCK",
    "STOCKOUT_RISK",
    "LOW_STOCK",
    "OVERSTOCK",
    "IMPORT_COMPLETED",
    "IMPORT_COMPLETED_WITH_ERRORS",
    "IMPORT_FAILED",
    "SALES_ALERT",
    "SYSTEM_ALERT",
)
PRIORITIES = ("LOW", "MEDIUM", "HIGH", "CRITICAL")


def allowed_types(role):
    if role in ADMINS:
        return TYPES
    if role == UserRole.ANALYST:
        return TYPES[:4] + ("SALES_ALERT",)
    return ()


def audit(db, company_id, user_id, action, details):
    db.add(
        AuditLog(
            company_id=company_id,
            user_id=user_id,
            action=action,
            ip_address="system",
            browser="Notification service",
            details=details,
            timestamp=datetime.now(UTC),
        )
    )


def emit(
    db,
    *,
    company_id,
    type,
    title,
    message,
    priority="LOW",
    resource_type=None,
    resource_id=None,
    path=None,
    details=None,
    event_key=None,
    active_key=None,
):
    # Database uniqueness makes concurrent workers and retries idempotent.
    from sqlalchemy.dialects.sqlite import insert as sqlite_insert
    from sqlalchemy.dialects.postgresql import insert as postgres_insert

    insert = sqlite_insert if db.bind.dialect.name == "sqlite" else postgres_insert
    users = db.scalars(
        select(User).where(
            User.company_id == company_id, User.status == UserStatus.ACTIVE
        )
    ).all()
    for user in users:
        if type not in allowed_types(user.role):
            continue
        nid = uuid4()
        result = db.execute(
            insert(Notification)
            .values(
                id=nid,
                company_id=company_id,
                user_id=user.id,
                type=type,
                title=title,
                message=message,
                priority=priority,
                resource_type=resource_type,
                resource_id=str(resource_id) if resource_id else None,
                path=path,
                details=details or {},
                event_key=event_key,
                active_key=active_key,
                created_at=datetime.now(UTC),
                is_read=False,
                expires_at=(
                    None if active_key else datetime.now(UTC) + timedelta(days=30)
                ),
            )
            .on_conflict_do_nothing()
        )
        if result.rowcount:
            audit(
                db,
                company_id,
                user.id,
                AuditAction.NOTIFICATION_CREATED,
                f"Notification {nid}: {title}",
            )


def inventory_condition(stock, reorder, daily):
    if stock == 0:
        return "OUT_OF_STOCK", "CRITICAL"
    if daily > 0 and stock / daily <= 3:
        return "STOCKOUT_RISK", "HIGH"
    if stock < reorder:
        return "LOW_STOCK", "MEDIUM"
    overstock_threshold = max(reorder * 3, ceil(daily * 60), 1)
    if stock > overstock_threshold:
        # Grade excess against the product's reorder point and recent demand.
        excess_ratio = stock / overstock_threshold
        priority = (
            "CRITICAL" if excess_ratio >= 5 else
            "HIGH" if excess_ratio >= 3 else
            "MEDIUM" if excess_ratio >= 2 else "LOW"
        )
        return "OVERSTOCK", priority
    return None, None


def evaluate_inventory(db, company_id):
    now = datetime.now(UTC)
    demand = dict(
        db.execute(
            select(SaleItem.product_id, func.sum(SaleItem.quantity))
            .join(Sale, Sale.id == SaleItem.sale_id)
            .where(
                Sale.company_id == company_id,
                Sale.payment_status != "FAILED",
                Sale.sale_date >= now - timedelta(days=30),
                Sale.sale_date <= now,
            )
            .group_by(SaleItem.product_id)
        ).all()
    )
    rows = db.execute(
        select(Product, Inventory)
        .outerjoin(
            Inventory,
            (Inventory.product_id == Product.id) & (Inventory.company_id == company_id),
        )
        .where(Product.company_id == company_id, Product.status == "ACTIVE")
    ).all()
    active = set()
    for product, inventory in rows:
        stock = max(
            0, product.stock_quantity - (inventory.reserved_stock if inventory else 0)
        )
        reorder = inventory.reorder_level if inventory else 5
        daily = float(demand.get(product.id, 0)) / 30
        kind, priority = inventory_condition(stock, reorder, daily)
        if not kind:
            continue
        key = f"inventory:{product.id}:{kind}"
        active.add(key)
        details = {
            "Product": product.name,
            "SKU": product.sku,
            "Current stock": product.stock_quantity,
            "Available stock": stock,
            "Reorder point": reorder,
            "Risk": kind.replace("_", " ").title(),
            "Days of stock": round(stock / daily, 1) if daily else "No recent demand",
            "Recommended quantity": max(0, max(reorder * 2, ceil(daily * 14)) - stock),
        }
        message = f"{product.name} ({product.sku}): {stock} available units. " + (
            f"Expected to stock out within {stock/daily:.1f} days."
            if kind == "STOCKOUT_RISK"
            else f"Reorder point: {reorder}."
        )
        # Keep existing alerts current without duplicating them or clearing read state.
        db.execute(
            update(Notification)
            .where(
                Notification.company_id == company_id,
                Notification.active_key == key,
            )
            .values(priority=priority, message=message, details=details)
        )
        emit(
            db,
            company_id=company_id,
            type=kind,
            title=kind.replace("_", " ").title(),
            message=message,
            priority=priority,
            resource_type="product",
            resource_id=product.id,
            path=f"/products?search={quote(product.sku)}",
            details=details,
            active_key=key,
        )
    obsolete = db.scalars(
        select(Notification).where(
            Notification.company_id == company_id,
            Notification.active_key.is_not(None),
            Notification.active_key.not_in(active),
        )
    ).all()
    for row in obsolete:
        row.active_key = None
        row.resolved_at = now
        audit(
            db,
            company_id,
            row.user_id,
            AuditAction.NOTIFICATION_RESOLVED,
            f"Notification {row.id}: inventory condition cleared",
        )
    db.execute(
        update(Notification)
        .where(
            Notification.company_id == company_id,
            Notification.resolved_at.is_(None),
            Notification.expires_at <= now,
        )
        .values(resolved_at=now)
    )


def import_event(db, job):
    types = {
        "Completed": ("IMPORT_COMPLETED", "LOW"),
        "Completed with Errors": ("IMPORT_COMPLETED_WITH_ERRORS", "MEDIUM"),
        "Failed": ("IMPORT_FAILED", "HIGH"),
    }
    if job.status not in types:
        return
    kind, priority = types[job.status]
    emit(
        db,
        company_id=job.company_id,
        type=kind,
        title=f"Import {job.status.lower()}",
        message=f"{job.filename}: {job.successful_records} imported, {job.failed_records} invalid, {job.duplicate_records} duplicate.",
        priority=priority,
        resource_type="import",
        resource_id=job.id,
        path=f"/data-import?import={job.id}",
        details={
            "File": job.filename,
            "Status": job.status,
            "Imported": job.successful_records,
            "Invalid": job.failed_records,
            "Duplicates": job.duplicate_records,
        },
        event_key=f"import:{job.id}:{job.status}",
    )


@event.listens_for(Session, "before_flush")
def collect_events(db, context, instances):
    for obj in list(db.new) + list(db.dirty) + list(db.deleted):
        if isinstance(obj, (Product, Inventory, Sale)) and obj.company_id:
            db.info.setdefault("notification_companies", set()).add(obj.company_id)
        if isinstance(obj, CustomerNotification) and obj in db.new:
            db.info.setdefault("notification_customers", {})[id(obj)] = obj
        if isinstance(obj, DataImport):
            db.info.setdefault("notification_imports", {})[id(obj)] = obj


@event.listens_for(Session, "before_commit")
def deliver_events(db):
    if db.info.get("delivering_notifications"):
        return
    db.info["delivering_notifications"] = True
    try:
        db.flush()
        for item in db.info.pop("notification_customers", {}).values():
            emit(
                db,
                company_id=item.company_id,
                type="SYSTEM_ALERT",
                title=item.title,
                message=item.message,
                resource_type="customer",
                resource_id=item.customer_id,
                path=f"/customers?customer={item.customer_id}",
                event_key=f"customer:{item.id}",
            )
        for job in db.info.pop("notification_imports", {}).values():
            import_event(db, job)
        for company_id in db.info.pop("notification_companies", set()):
            evaluate_inventory(db, company_id)
        db.flush()
    finally:
        db.info.pop("delivering_notifications", None)


@event.listens_for(Session, "after_rollback")
def discard_events(db):
    db.info.pop("notification_companies", None)
    db.info.pop("notification_imports", None)
    db.info.pop("notification_customers", None)
