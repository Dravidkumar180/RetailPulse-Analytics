"""Add analytics dashboard audit actions.

Revision ID: 007
Revises: 006
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "007"
down_revision: str | None = "006"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    if op.get_bind().dialect.name == "postgresql":
        for value in (
            "DASHBOARD_VIEWED",
            "REPORT_EXPORTED",
            "DASHBOARD_FILTERS_APPLIED",
        ):
            op.execute(sa.text(f"ALTER TYPE audit_action ADD VALUE IF NOT EXISTS '{value}'"))


def downgrade() -> None:
    # PostgreSQL enum values cannot be removed safely while rows may use them.
    pass
