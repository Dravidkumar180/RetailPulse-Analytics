# Teaching guide: This file contains audit log database tables.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from datetime import datetime
# Imports the needed names from typing.
from typing import TYPE_CHECKING
# Imports the needed names from uuid.
from uuid import UUID

# Imports the needed names from sqlalchemy.
from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Index,
    String,
    Text,
)
# Imports the needed names from sqlalchemy.dialects.postgresql.
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
# Imports the needed names from sqlalchemy.orm.
from sqlalchemy.orm import Mapped, mapped_column, relationship

# Imports the needed names from app.core.constants.
from app.core.constants import AuditAction
# Imports the needed names from app.models.base.
from app.models.base import Base, UUIDPrimaryKeyMixin

# Checks whether this condition is true.
if TYPE_CHECKING:
    # Imports the needed names from app.models.company.
    from app.models.company import Company
    # Imports the needed names from app.models.user.
    from app.models.user import User


# Groups audit log behavior.
class AuditLog(
    UUIDPrimaryKeyMixin,
    Base,
):
    # Stores  tablename  for the next steps.
    __tablename__ = "audit_logs"

    # Stores  table args  for the next steps.
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

    # Stores company id for the next steps.
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

    # Stores user id for the next steps.
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

    # Stores action for the next steps.
    action: Mapped[AuditAction] = mapped_column(
        Enum(
            AuditAction,
            name="audit_action",
            native_enum=True,
        ),
        nullable=False,
        index=True,
    )

    # Stores ip address for the next steps.
    ip_address: Mapped[str] = mapped_column(
        "ipAddress",
        String(64),
        nullable=False,
    )

    # Stores browser for the next steps.
    browser: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )
    # Stores details for the next steps.
    details: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Stores timestamp for the next steps.
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    # Stores company for the next steps.
    company: Mapped["Company"] = relationship(
        back_populates="audit_logs",
    )

    # Stores user for the next steps.
    user: Mapped["User | None"] = relationship(
        back_populates="audit_logs",
    )

    def __repr__(self) -> str:
        # Returns the completed value to the caller.
        return (
            f"<AuditLog id={self.id} "
            f"action={self.action}>"
        )
