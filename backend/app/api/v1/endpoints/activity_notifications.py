from fastapi import APIRouter, status
from sqlalchemy import select, update

from app.api.dependencies import DatabaseSession
from app.core.permissions import AllAuthenticatedRoles
from app.models.activity_notification import ActivityNotification

router = APIRouter()


@router.get("")
def list_activity_notifications(db: DatabaseSession, current_user: AllAuthenticatedRoles):
    rows = db.scalars(
        select(ActivityNotification)
        .where(ActivityNotification.company_id == current_user.company_id, ActivityNotification.is_read.is_(False))
        .order_by(ActivityNotification.created_at.desc())
        .limit(100)
    ).all()
    return [{"id": str(row.id), "title": row.title, "message": row.message,
             "path": row.path, "action": row.action, "createdAt": row.created_at} for row in rows]


@router.patch("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_activity_notification_read(notification_id: str, db: DatabaseSession, current_user: AllAuthenticatedRoles):
    row = db.scalar(select(ActivityNotification).where(
        ActivityNotification.id == notification_id,
        ActivityNotification.company_id == current_user.company_id,
    ))
    if row:
        row.is_read = True
        db.commit()


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def clear_activity_notifications(db: DatabaseSession, current_user: AllAuthenticatedRoles):
    db.execute(update(ActivityNotification).where(
        ActivityNotification.company_id == current_user.company_id,
        ActivityNotification.is_read.is_(False),
    ).values(is_read=True))
    db.commit()
