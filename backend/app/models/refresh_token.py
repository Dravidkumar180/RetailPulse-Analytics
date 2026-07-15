from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    String,
)
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import (
    Base,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
)

if TYPE_CHECKING:
    from app.models.user import User


class RefreshToken(
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    Base,
):
    __tablename__ = "refresh_tokens"

    __table_args__ = (
        Index(
            "ix_refresh_tokens_user_active",
            "userId",
            "revokedAt",
        ),
    )

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

    token_hash: Mapped[str] = mapped_column(
        "tokenHash",
        String(255),
        nullable=False,
        unique=True,
        index=True,
    )

    token_id: Mapped[str] = mapped_column(
        "tokenId",
        String(100),
        nullable=False,
        unique=True,
        index=True,
    )

    expires_at: Mapped[datetime] = mapped_column(
        "expiresAt",
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    revoked_at: Mapped[datetime | None] = mapped_column(
        "revokedAt",
        DateTime(timezone=True),
        nullable=True,
    )

    replaced_by_token_id: Mapped[str | None] = mapped_column(
        "replacedByTokenId",
        String(100),
        nullable=True,
    )

    user: Mapped["User"] = relationship(
        back_populates="refresh_tokens",
    )

    @property
    def is_revoked(self) -> bool:
        return self.revoked_at is not None

    def __repr__(self) -> str:
        return (
            f"<RefreshToken id={self.id} "
            f"user_id={self.user_id}>"
        )