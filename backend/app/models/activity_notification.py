from datetime import datetime
from uuid import UUID

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDPrimaryKeyMixin


class ActivityNotification(UUIDPrimaryKeyMixin, Base):
    """Persistent tenant activity shown in the shared notification bell."""

    __tablename__ = "activity_notifications"
    __table_args__ = (Index("ix_activity_notifications_company_created", "companyId", "createdAt"),)

    company_id: Mapped[UUID] = mapped_column("companyId", PostgreSQLUUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id: Mapped[UUID | None] = mapped_column("actorId", PostgreSQLUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action: Mapped[str] = mapped_column(String(80), nullable=False)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    path: Mapped[str] = mapped_column(String(160), nullable=False)
    is_read: Mapped[bool] = mapped_column("isRead", Boolean, nullable=False, default=False, index=True)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=True), nullable=False, default=lambda: datetime.now().astimezone())
