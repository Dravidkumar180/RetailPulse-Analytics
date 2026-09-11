from datetime import UTC, datetime
from uuid import UUID
from typing import Literal
from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select, func, update, or_
from app.api.dependencies import DatabaseSession
from app.core.permissions import AllAuthenticatedRoles
from app.core.constants import AuditAction
from app.models.notification import Notification
from app.services.notification_service import allowed_types, audit

router = APIRouter()


def scope(user):
    return (
        Notification.company_id == user.company_id,
        Notification.user_id == user.id,
        Notification.type.in_(allowed_types(user.role)),
    )


def active():
    return (
        Notification.resolved_at.is_(None),
        or_(
            Notification.expires_at.is_(None),
            Notification.expires_at > datetime.now(UTC),
        ),
    )


def serialize(row):
    def value(key):
        item = getattr(row, key)
        return (
            item.replace(tzinfo=UTC)
            if isinstance(item, datetime) and item.tzinfo is None
            else item
        )

    return {
        key: value(key)
        for key in (
            "id",
            "type",
            "title",
            "message",
            "priority",
            "resource_type",
            "resource_id",
            "path",
            "details",
            "is_read",
            "created_at",
            "read_at",
            "resolved_at",
            "expires_at",
        )
    }


@router.get("")
def list_notifications(
    db: DatabaseSession,
    current_user: AllAuthenticatedRoles,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Literal["all", "read", "unread"] = "all",
    type: (
        Literal[
            "OUT_OF_STOCK",
            "STOCKOUT_RISK",
            "LOW_STOCK",
            "OVERSTOCK",
            "IMPORT_COMPLETED",
            "IMPORT_COMPLETED_WITH_ERRORS",
            "IMPORT_FAILED",
            "SALES_ALERT",
            "SYSTEM_ALERT",
        ]
        | None
    ) = None,
    priority: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"] | None = None,
    lifecycle: Literal["active", "resolved", "all"] = "active",
):
    filters = list(scope(current_user))
    if lifecycle == "active":
        filters.extend(active())
    elif lifecycle == "resolved":
        filters.append(
            or_(
                Notification.resolved_at.is_not(None),
                Notification.expires_at <= datetime.now(UTC),
            )
        )
    if status != "all":
        filters.append(Notification.is_read.is_(status == "read"))
    if type:
        filters.append(Notification.type == type)
    if priority:
        filters.append(Notification.priority == priority)
    total = db.scalar(select(func.count()).select_from(Notification).where(*filters))
    rows = db.scalars(
        select(Notification)
        .where(*filters)
        .order_by(Notification.created_at.desc(), Notification.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return {
        "items": [serialize(row) for row in rows],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/unread-count")
def unread_count(db: DatabaseSession, current_user: AllAuthenticatedRoles):
    return {
        "count": db.scalar(
            select(func.count())
            .select_from(Notification)
            .where(*scope(current_user), *active(), Notification.is_read.is_(False))
        )
    }


@router.patch("/read-all")
def read_all(db: DatabaseSession, current_user: AllAuthenticatedRoles):
    result = db.execute(
        update(Notification)
        .where(*scope(current_user), *active(), Notification.is_read.is_(False))
        .values(is_read=True, read_at=datetime.now(UTC))
    )
    if result.rowcount:
        audit(
            db,
            current_user.company_id,
            current_user.id,
            AuditAction.NOTIFICATIONS_READ_ALL,
            f"Marked {result.rowcount} notifications read",
        )
    db.commit()
    return {"updated": result.rowcount}


@router.get("/{notification_id}")
def detail(
    notification_id: UUID, db: DatabaseSession, current_user: AllAuthenticatedRoles
):
    row = db.scalar(
        select(Notification).where(
            *scope(current_user), Notification.id == notification_id
        )
    )
    if not row:
        raise HTTPException(404, "Notification not found")
    return serialize(row)


@router.patch("/{notification_id}/read")
def read_one(
    notification_id: UUID, db: DatabaseSession, current_user: AllAuthenticatedRoles
):
    row = db.scalar(
        select(Notification).where(
            *scope(current_user), Notification.id == notification_id
        )
    )
    if not row:
        raise HTTPException(404, "Notification not found")
    result = db.execute(
        update(Notification)
        .where(
            *scope(current_user),
            Notification.id == notification_id,
            Notification.is_read.is_(False),
        )
        .values(is_read=True, read_at=datetime.now(UTC))
    )
    if result.rowcount:
        audit(
            db,
            current_user.company_id,
            current_user.id,
            AuditAction.NOTIFICATION_READ,
            f"Notification {notification_id} marked read",
        )
    db.commit()
    db.refresh(row)
    return serialize(row)
