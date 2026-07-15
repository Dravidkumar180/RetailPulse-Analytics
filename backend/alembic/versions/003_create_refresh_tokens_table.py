"""Create refresh_tokens table.

Revision ID: 003
Revises: 002
Create Date: 2026-07-15
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision: str = "003"
down_revision: str | None = "002"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "refresh_tokens",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "userId",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "tokenHash",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "tokenId",
            sa.String(length=100),
            nullable=False,
        ),
        sa.Column(
            "expiresAt",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "revokedAt",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "replacedByTokenId",
            sa.String(length=100),
            nullable=True,
        ),
        sa.Column(
            "createdAt",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updatedAt",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["userId"],
            ["users.id"],
            name="fk_refresh_tokens_userId_users",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint(
            "id",
            name="pk_refresh_tokens",
        ),
        sa.UniqueConstraint(
            "tokenHash",
            name="uq_refresh_tokens_tokenHash",
        ),
        sa.UniqueConstraint(
            "tokenId",
            name="uq_refresh_tokens_tokenId",
        ),
    )

    op.create_index(
        "ix_refresh_tokens_userId",
        "refresh_tokens",
        ["userId"],
        unique=False,
    )

    op.create_index(
        "ix_refresh_tokens_tokenHash",
        "refresh_tokens",
        ["tokenHash"],
        unique=False,
    )

    op.create_index(
        "ix_refresh_tokens_tokenId",
        "refresh_tokens",
        ["tokenId"],
        unique=False,
    )

    op.create_index(
        "ix_refresh_tokens_expiresAt",
        "refresh_tokens",
        ["expiresAt"],
        unique=False,
    )

    op.create_index(
        "ix_refresh_tokens_user_active",
        "refresh_tokens",
        ["userId", "revokedAt"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_refresh_tokens_user_active",
        table_name="refresh_tokens",
    )
    op.drop_index(
        "ix_refresh_tokens_expiresAt",
        table_name="refresh_tokens",
    )
    op.drop_index(
        "ix_refresh_tokens_tokenId",
        table_name="refresh_tokens",
    )
    op.drop_index(
        "ix_refresh_tokens_tokenHash",
        table_name="refresh_tokens",
    )
    op.drop_index(
        "ix_refresh_tokens_userId",
        table_name="refresh_tokens",
    )

    op.drop_table("refresh_tokens")