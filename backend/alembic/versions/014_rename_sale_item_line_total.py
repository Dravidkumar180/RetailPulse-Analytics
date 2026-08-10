"""Use the contract name lineTotal for sale item totals.

Revision ID: 014
Revises: 013
"""
from collections.abc import Sequence
from alembic import op

revision: str = "014"
down_revision: str | None = "013"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None

def upgrade() -> None:
    # Match the database column name used by the API contract.
    op.alter_column("sale_items", "total", new_column_name="lineTotal")

def downgrade() -> None:
    # Restore the original column name during rollback.
    op.alter_column("sale_items", "lineTotal", new_column_name="total")
