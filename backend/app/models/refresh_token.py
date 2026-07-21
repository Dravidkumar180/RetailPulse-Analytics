# Teaching guide: This file contains refresh token database tables.
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
    ForeignKey,
    Index,
    String,
)
# Imports the needed names from sqlalchemy.dialects.postgresql.
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
# Imports the needed names from sqlalchemy.orm.
from sqlalchemy.orm import Mapped, mapped_column, relationship

# Imports the needed names from app.models.base.
from app.models.base import (
    Base,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
)

# Checks whether this condition is true.
if TYPE_CHECKING:
    # Imports the needed names from app.models.user.
    from app.models.user import User


# Groups refresh token behavior.
class RefreshToken(
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    Base,
):
    # Stores  tablename  for the next steps.
    __tablename__ = "refresh_tokens"

    # Stores  table args  for the next steps.
    __table_args__ = (
        Index(
            "ix_refresh_tokens_user_active",
            "userId",
            "revokedAt",
        ),
    )

    # Stores user id for the next steps.
    user_id: Mapped[UUID] = mapped_column(
        "userId",
        PostgreSQLUUID(as_uuid=True),
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    # Stores token hash for the next steps.
    token_hash: Mapped[str] = mapped_column(
        "tokenHash",
        String(255),
        nullable=False,
        unique=True,
        index=True,
    )

    # Stores token id for the next steps.
    token_id: Mapped[str] = mapped_column(
        "tokenId",
        String(100),
        nullable=False,
        unique=True,
        index=True,
    )

    # Stores expires at for the next steps.
    expires_at: Mapped[datetime] = mapped_column(
        "expiresAt",
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    # Stores revoked at for the next steps.
    revoked_at: Mapped[datetime | None] = mapped_column(
        "revokedAt",
        DateTime(timezone=True),
        nullable=True,
    )

    # Stores replaced by token id for the next steps.
    replaced_by_token_id: Mapped[str | None] = mapped_column(
        "replacedByTokenId",
        String(100),
        nullable=True,
    )

    # Stores user for the next steps.
    user: Mapped["User"] = relationship(
        back_populates="refresh_tokens",
    )

    # Checks revoked.
    @property
    def is_revoked(self) -> bool:
        # Returns the completed value to the caller.
        return self.revoked_at is not None

    def __repr__(self) -> str:
        # Returns the completed value to the caller.
        return (
            f"<RefreshToken id={self.id} "
            f"user_id={self.user_id}>"
        )