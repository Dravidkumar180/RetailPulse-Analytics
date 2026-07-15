"""Create audit_logs table.

Revision ID: 004
Revises: 003
Create Date: 2026-07-15
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision: str = "004"
down_revision: str | None = "003"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


audit_action_enum = postgresql.ENUM(
    "COMPANY_REGISTERED",
    "USER_LOGIN",
    "USER_LOGOUT",
    "PASSWORD_CHANGED",
    name="audit_action",
    create_type=False,
)


def upgrade() -> None:
    connection = op.get_bind()

    audit_action_enum.create(
        connection,
        checkfirst=True,
    )

    op.create_table(
        "audit_logs",
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
            "userId",
            postgresql.UUID(as_uuid=True),
            nullable=True,
        ),
        sa.Column(
            "action",
            audit_action_enum,
            nullable=False,
        ),
        sa.Column(
            "ipAddress",
            sa.String(length=64),
            nullable=False,
        ),
        sa.Column(
            "browser",
            sa.String(length=500),
            nullable=False,
        ),
        sa.Column(
            "timestamp",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["companyId"],
            ["companies.id"],
            name="fk_audit_logs_companyId_companies",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["userId"],
            ["users.id"],
            name="fk_audit_logs_userId_users",
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint(
            "id",
            name="pk_audit_logs",
        ),
    )

    op.create_index(
        "ix_audit_logs_companyId",
        "audit_logs",
        ["companyId"],
        unique=False,
    )

    op.create_index(
        "ix_audit_logs_userId",
        "audit_logs",
        ["userId"],
        unique=False,
    )

    op.create_index(
        "ix_audit_logs_action",
        "audit_logs",
        ["action"],
        unique=False,
    )

    op.create_index(
        "ix_audit_logs_timestamp",
        "audit_logs",
        ["timestamp"],
        unique=False,
    )

    op.create_index(
        "ix_audit_logs_company_timestamp",
        "audit_logs",
        ["companyId", "timestamp"],
        unique=False,
    )

    op.create_index(
        "ix_audit_logs_company_action",
        "audit_logs",
        ["companyId", "action"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_audit_logs_company_action",
        table_name="audit_logs",
    )
    op.drop_index(
        "ix_audit_logs_company_timestamp",
        table_name="audit_logs",
    )
    op.drop_index(
        "ix_audit_logs_timestamp",
        table_name="audit_logs",
    )
    op.drop_index(
        "ix_audit_logs_action",
        table_name="audit_logs",
    )
    op.drop_index(
        "ix_audit_logs_userId",
        table_name="audit_logs",
    )
    op.drop_index(
        "ix_audit_logs_companyId",
        table_name="audit_logs",
    )

    op.drop_table("audit_logs")

    connection = op.get_bind()

    audit_action_enum.drop(
        connection,
        checkfirst=True,
    )