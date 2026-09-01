"""Add structured before and after snapshots to audit logs.

Revision ID: 015
Revises: 014
"""
from collections.abc import Sequence
from alembic import op
import sqlalchemy as sa

revision: str = "015"
down_revision: str | None = "014"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None

def upgrade() -> None:
    op.add_column("audit_logs", sa.Column("beforeValues", sa.JSON(), nullable=True))
    op.add_column("audit_logs", sa.Column("afterValues", sa.JSON(), nullable=True))

def downgrade() -> None:
    op.drop_column("audit_logs", "afterValues")
    op.drop_column("audit_logs", "beforeValues")
