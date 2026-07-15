"""Create companies table.

Revision ID: 001
Revises:
Create Date: 2026-07-15
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision: str = "001"
down_revision: str | None = None
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "companies",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "name",
            sa.String(length=150),
            nullable=False,
        ),
        sa.Column(
            "industry",
            sa.String(length=100),
            nullable=False,
        ),
        sa.Column(
            "email",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "address",
            sa.Text(),
            nullable=False,
        ),
        sa.Column(
            "phone",
            sa.String(length=30),
            nullable=False,
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
        sa.PrimaryKeyConstraint(
            "id",
            name="pk_companies",
        ),
        sa.UniqueConstraint(
            "name",
            name="uq_companies_name",
        ),
        sa.UniqueConstraint(
            "email",
            name="uq_companies_email",
        ),
    )

    op.create_index(
        "ix_companies_name",
        "companies",
        ["name"],
        unique=False,
    )

    op.create_index(
        "ix_companies_email",
        "companies",
        ["email"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_companies_email",
        table_name="companies",
    )

    op.drop_index(
        "ix_companies_name",
        table_name="companies",
    )

    op.drop_table("companies")