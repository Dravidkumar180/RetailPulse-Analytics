from datetime import datetime, UTC
from uuid import UUID
from sqlalchemy import String, Text, JSON, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, UUIDPrimaryKeyMixin


class ReportSchedule(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "report_schedules"
    company_id: Mapped[UUID] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(160))
    configuration: Mapped[dict] = mapped_column(JSON)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    next_run: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    last_run: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class ReportRun(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "report_runs"
    company_id: Mapped[UUID] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    schedule_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("report_schedules.id", ondelete="SET NULL"), index=True
    )
    name: Mapped[str] = mapped_column(String(160))
    generated_by: Mapped[str] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), index=True
    )
    report_type: Mapped[str] = mapped_column(String(30))
    filters: Mapped[dict] = mapped_column(JSON)
    context: Mapped[dict] = mapped_column(JSON, default=dict)
    format: Mapped[str] = mapped_column(String(10))
    status: Mapped[str] = mapped_column(String(20), default="GENERATING")
    error: Mapped[str | None] = mapped_column(Text)
    delivery_status: Mapped[str | None] = mapped_column(String(20))
    rows: Mapped[list] = mapped_column(JSON, default=list)
    columns: Mapped[list] = mapped_column(JSON, default=list)
