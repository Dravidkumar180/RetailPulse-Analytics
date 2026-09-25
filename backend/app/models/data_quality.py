from datetime import UTC, datetime
from uuid import UUID
from sqlalchemy import DateTime, ForeignKey, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, UUIDPrimaryKeyMixin


def now():
    return datetime.now(UTC)


class QualityRun(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "quality_runs"
    company_id: Mapped[UUID] = mapped_column(ForeignKey("companies.id"), index=True)
    triggered_by: Mapped[str] = mapped_column(String(160))
    user_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    trigger: Mapped[str] = mapped_column(String(30), default="Manual")
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    claimed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(30), default="Running")
    active_company: Mapped[str | None] = mapped_column(String(36), unique=True)
    records_checked: Mapped[int] = mapped_column(default=0)
    valid_records: Mapped[int] = mapped_column(default=0)
    warning_records: Mapped[int] = mapped_column(default=0)
    error_records: Mapped[int] = mapped_column(default=0)
    issues_detected: Mapped[int] = mapped_column(default=0)
    issues_resolved: Mapped[int] = mapped_column(default=0)
    failed_checks: Mapped[list] = mapped_column(JSON, default=list)
    checks: Mapped[list] = mapped_column(JSON, default=list)


class QualityIssue(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "quality_issues"
    __table_args__ = (
        UniqueConstraint(
            "company_id", "issue_type", "record_id", name="uq_quality_problem"
        ),
    )
    company_id: Mapped[UUID] = mapped_column(ForeignKey("companies.id"), index=True)
    issue_type: Mapped[str] = mapped_column(String(80))
    severity: Mapped[str] = mapped_column(String(20))
    module: Mapped[str] = mapped_column(String(30))
    record_id: Mapped[str] = mapped_column(String(36))
    record_label: Mapped[str] = mapped_column(String(160))
    description: Mapped[str] = mapped_column(Text)
    evidence: Mapped[dict] = mapped_column(JSON, default=dict)
    detected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    status: Mapped[str] = mapped_column(String(20), default="Open", index=True)
    resolved_by: Mapped[str | None] = mapped_column(String(160))
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    resolution_note: Mapped[str | None] = mapped_column(Text)
    history: Mapped[list] = mapped_column(JSON, default=list)


class QualityChange(UUIDPrimaryKeyMixin, Base):
    """Transactional outbox: business writes and their check requests commit together."""

    __tablename__ = "quality_changes"
    company_id: Mapped[UUID] = mapped_column(ForeignKey("companies.id"), index=True)
    module: Mapped[str] = mapped_column(String(30))
    record_id: Mapped[str] = mapped_column(String(36))
