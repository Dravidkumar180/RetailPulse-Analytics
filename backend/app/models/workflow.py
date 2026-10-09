"""Company-scoped approval requests and append-only transition history."""
from datetime import UTC, datetime
from uuid import UUID
from sqlalchemy import Boolean, DateTime, ForeignKey, Index, JSON, String, Text, UniqueConstraint, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID as UUIDType
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, UUIDPrimaryKeyMixin, TimestampMixin

class WorkflowConfig(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "workflow_configs"
    __table_args__ = (UniqueConstraint("company_id", "request_type"),)
    company_id: Mapped[UUID] = mapped_column(UUIDType(as_uuid=True), ForeignKey("companies.id"), index=True)
    request_type: Mapped[str] = mapped_column(String(50))
    approver_role: Mapped[str] = mapped_column(String(30), default="COMPANY_ADMIN")
    approval_required: Mapped[bool] = mapped_column(Boolean, default=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    allow_self_approval: Mapped[bool] = mapped_column(Boolean, default=False)

class ApprovalRequest(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "approval_requests"
    __table_args__ = (
        Index("ix_workflow_queue", "company_id", "status", "approver_role"),
        CheckConstraint("status IN ('DRAFT','SUBMITTED','PENDING_APPROVAL','APPROVED','REJECTED','CANCELLED')", name="workflow_status"),
    )
    company_id: Mapped[UUID] = mapped_column(UUIDType(as_uuid=True), ForeignKey("companies.id"), index=True)
    requester_id: Mapped[UUID] = mapped_column(UUIDType(as_uuid=True), ForeignKey("users.id"))
    requester_name: Mapped[str] = mapped_column(String(160))
    request_type: Mapped[str] = mapped_column(String(50))
    related_id: Mapped[UUID] = mapped_column(UUIDType(as_uuid=True))
    related_label: Mapped[str] = mapped_column(String(255))
    current_values: Mapped[dict] = mapped_column(JSON)
    requested_values: Mapped[dict] = mapped_column(JSON)
    reason: Mapped[str] = mapped_column(Text)
    priority: Mapped[str] = mapped_column(String(10), default="MEDIUM")
    status: Mapped[str] = mapped_column(String(30), default="DRAFT")
    approver_role: Mapped[str] = mapped_column(String(30))
    allow_self_approval: Mapped[bool] = mapped_column(Boolean, default=False)
    approval_required: Mapped[bool] = mapped_column(Boolean, default=True)

class ApprovalHistory(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "approval_history"
    request_id: Mapped[UUID] = mapped_column(UUIDType(as_uuid=True), ForeignKey("approval_requests.id"), index=True)
    actor_id: Mapped[UUID] = mapped_column(UUIDType(as_uuid=True), ForeignKey("users.id"))
    actor_name: Mapped[str] = mapped_column(String(160))
    action: Mapped[str] = mapped_column(String(60))
    from_status: Mapped[str | None] = mapped_column(String(30))
    to_status: Mapped[str] = mapped_column(String(30))
    comment: Mapped[str | None] = mapped_column(Text)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
