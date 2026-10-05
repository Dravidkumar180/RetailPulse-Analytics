"""Durable import queue and transactional per-row processing ledger."""
from datetime import datetime
from uuid import UUID
from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as UUIDType
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class BulkImportJob(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "bulk_import_jobs"
    __table_args__ = (Index("ix_bulk_import_queue", "status", "lease_until"),)
    company_id: Mapped[UUID] = mapped_column(UUIDType(as_uuid=True), ForeignKey("companies.id"), index=True)
    user_id: Mapped[UUID] = mapped_column(UUIDType(as_uuid=True), ForeignKey("users.id"))
    user_name: Mapped[str] = mapped_column(String(100))
    import_type: Mapped[str] = mapped_column(String(30))
    filename: Mapped[str] = mapped_column(String(255))
    fingerprint: Mapped[str] = mapped_column(String(64))
    columns: Mapped[list] = mapped_column(JSON)
    total: Mapped[int] = mapped_column(Integer)
    successful: Mapped[int] = mapped_column(Integer, default=0)
    failed: Mapped[int] = mapped_column(Integer, default=0)
    skipped: Mapped[int] = mapped_column(Integer, default=0)
    duplicates: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(30), default="Uploaded")
    cancel_requested: Mapped[bool] = mapped_column(Boolean, default=False)
    lease_token: Mapped[str | None] = mapped_column(String(36))
    lease_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    message: Mapped[str | None] = mapped_column(Text)


class BulkImportRow(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "bulk_import_rows"
    __table_args__ = (UniqueConstraint("job_id", "row_number"), Index("ix_bulk_import_row_status", "job_id", "status", "row_number"))
    job_id: Mapped[UUID] = mapped_column(UUIDType(as_uuid=True), ForeignKey("bulk_import_jobs.id", ondelete="CASCADE"))
    row_number: Mapped[int] = mapped_column(Integer)
    data: Mapped[dict] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(20), default="Pending")
    action: Mapped[str | None] = mapped_column(String(20))
    error_type: Mapped[str | None] = mapped_column(String(40))
    message: Mapped[str | None] = mapped_column(Text)
    record_id: Mapped[str | None] = mapped_column(String(36))
