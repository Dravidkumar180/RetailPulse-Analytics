"""Complete sales invoice fields.

Revision ID: 012
Revises: 011
"""
from collections.abc import Sequence
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "012"
down_revision: str | None = "011"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None

def upgrade() -> None:
    # Add the customer link and invoice fields required by Sales Management.
    op.add_column("sales", sa.Column("customerId", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column("sales", sa.Column("paymentStatus", sa.String(20), nullable=False, server_default="PAID"))
    op.add_column("sales", sa.Column("notes", sa.Text(), nullable=True))
    op.create_foreign_key("fk_sales_customer", "sales", "customers", ["customerId"], ["id"], ondelete="RESTRICT")
    op.create_index("ix_sales_customerId", "sales", ["customerId"])

def downgrade() -> None:
    # Remove the fields in reverse order when rolling back this migration.
    op.drop_index("ix_sales_customerId", table_name="sales")
    op.drop_constraint("fk_sales_customer", "sales", type_="foreignkey")
    op.drop_column("sales", "notes")
    op.drop_column("sales", "paymentStatus")
    op.drop_column("sales", "customerId")
