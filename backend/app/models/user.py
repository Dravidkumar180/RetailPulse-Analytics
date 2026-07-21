# Teaching guide: This file contains user database tables.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from datetime import datetime
# Imports the needed names from typing.
from typing import TYPE_CHECKING
# Imports the needed names from uuid.
from uuid import UUID

# Imports the needed names from sqlalchemy.
from sqlalchemy import DateTime, Enum, ForeignKey, Index, String
# Imports the needed names from sqlalchemy.dialects.postgresql.
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
# Imports the needed names from sqlalchemy.orm.
from sqlalchemy.orm import Mapped, mapped_column, relationship

# Imports the needed names from app.core.constants.
from app.core.constants import UserRole, UserStatus
# Imports the needed names from app.models.base.
from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

# Checks whether this condition is true.
if TYPE_CHECKING:
    # Imports the needed names from app.models.audit_log.
    from app.models.audit_log import AuditLog
    # Imports the needed names from app.models.company.
    from app.models.company import Company
    # Imports the needed names from app.models.refresh_token.
    from app.models.refresh_token import RefreshToken
    # Imports the needed names from app.models.sales.
    from app.models.sales import Sale


# Groups user behavior.
class User(
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    Base,
):
    # Stores  tablename  for the next steps.
    __tablename__ = "users"

    # Stores  table args  for the next steps.
    __table_args__ = (
        Index("ix_users_company_email", "companyId", "email"),
        Index("ix_users_company_role", "companyId", "role"),
        Index("ix_users_company_status", "companyId", "status"),
    )

    # Stores company id for the next steps.
    company_id: Mapped[UUID] = mapped_column(
        "companyId",
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Stores name for the next steps.
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    # Stores email for the next steps.
    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
        index=True,
    )

    # Stores password hash for the next steps.
    password_hash: Mapped[str] = mapped_column(
        "passwordHash",
        String(255),
        nullable=False,
    )

    # Stores role for the next steps.
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", native_enum=True),
        nullable=False,
        default=UserRole.VIEWER,
    )

    # Stores status for the next steps.
    status: Mapped[UserStatus] = mapped_column(
        Enum(UserStatus, name="user_status", native_enum=True),
        nullable=False,
        default=UserStatus.ACTIVE,
    )

    # Stores last login for the next steps.
    last_login: Mapped[datetime | None] = mapped_column(
        "lastLogin",
        DateTime(timezone=True),
        nullable=True,
    )

    # Stores company for the next steps.
    company: Mapped["Company"] = relationship(back_populates="users")

    # Stores refresh tokens for the next steps.
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    # Stores audit logs for the next steps.
    audit_logs: Mapped[list["AuditLog"]] = relationship(
        back_populates="user",
        passive_deletes=True,
    )
    # Stores sales created for the next steps.
    sales_created: Mapped[list["Sale"]] = relationship(back_populates="created_by")

    def __repr__(self) -> str:
        # Returns the completed value to the caller.
        return f"<User id={self.id} email={self.email!r}>"
