from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Index,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import AuditAction
from app.models.base import Base, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.user import User


class AuditLog(
    UUIDPrimaryKeyMixin,
    Base,
):
    __tablename__ = "audit_logs"

    __table_args__ = (
        Index(
            "ix_audit_logs_company_timestamp",
            "companyId",
            "timestamp",
        ),
        Index(
            "ix_audit_logs_company_action",
            "companyId",
            "action",
        ),
    )

    company_id: Mapped[UUID] = mapped_column(
        "companyId",
        PostgreSQLUUID(as_uuid=True),
        ForeignKey(
            "companies.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    user_id: Mapped[UUID | None] = mapped_column(
        "userId",
        PostgreSQLUUID(as_uuid=True),
        ForeignKey(
            "users.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    action: Mapped[AuditAction] = mapped_column(
        Enum(
            AuditAction,
            name="audit_action",
            native_enum=True,
        ),
        nullable=False,
        index=True,
    )

    ip_address: Mapped[str] = mapped_column(
        "ipAddress",
        String(64),
        nullable=False,
    )

    browser: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )
    details: Mapped[str | None] = mapped_column(Text, nullable=True)

    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    company: Mapped["Company"] = relationship(
        back_populates="audit_logs",
    )

    user: Mapped["User | None"] = relationship(
        back_populates="audit_logs",
    )

    def __repr__(self) -> str:
        return (
            f"<AuditLog id={self.id} "
            f"action={self.action}>"
        )
