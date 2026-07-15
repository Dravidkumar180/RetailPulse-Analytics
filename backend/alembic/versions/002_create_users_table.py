"""Create users table.

Revision ID: 002
Revises: 001
Create Date: 2026-07-15
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision: str = "002"
down_revision: str | None = "001"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


user_role_enum = postgresql.ENUM(
    "SUPER_ADMIN",
    "COMPANY_ADMIN",
    "ANALYST",
    "VIEWER",
    name="user_role",
    create_type=False,
)

user_status_enum = postgresql.ENUM(
    "ACTIVE",
    "INACTIVE",
    "SUSPENDED",
    name="user_status",
    create_type=False,
)


def upgrade() -> None:
    connection = op.get_bind()

    user_role_enum.create(
        connection,
        checkfirst=True,
    )

    user_status_enum.create(
        connection,
        checkfirst=True,
    )

    op.create_table(
        "users",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "companyId",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "name",
            sa.String(length=100),
            nullable=False,
        ),
        sa.Column(
            "email",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "passwordHash",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "role",
            user_role_enum,
            nullable=False,
            server_default="VIEWER",
        ),
        sa.Column(
            "status",
            user_status_enum,
            nullable=False,
            server_default="ACTIVE",
        ),
        sa.Column(
            "lastLogin",
            sa.DateTime(timezone=True),
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
            ["companyId"],
            ["companies.id"],
            name="fk_users_companyId_companies",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint(
            "id",
            name="pk_users",
        ),
        sa.UniqueConstraint(
            "email",
            name="uq_users_email",
        ),
    )

    op.create_index(
        "ix_users_companyId",
        "users",
        ["companyId"],
        unique=False,
    )

    op.create_index(
        "ix_users_email",
        "users",
        ["email"],
        unique=False,
    )

    op.create_index(
        "ix_users_company_email",
        "users",
        ["companyId", "email"],
        unique=False,
    )

    op.create_index(
        "ix_users_company_role",
        "users",
        ["companyId", "role"],
        unique=False,
    )

    op.create_index(
        "ix_users_company_status",
        "users",
        ["companyId", "status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_users_company_status",
        table_name="users",
    )
    op.drop_index(
        "ix_users_company_role",
        table_name="users",
    )
    op.drop_index(
        "ix_users_company_email",
        table_name="users",
    )
    op.drop_index(
        "ix_users_email",
        table_name="users",
    )
    op.drop_index(
        "ix_users_companyId",
        table_name="users",
    )

    op.drop_table("users")

    connection = op.get_bind()

    user_status_enum.drop(
        connection,
        checkfirst=True,
    )

    user_role_enum.drop(
        connection,
        checkfirst=True,
    )