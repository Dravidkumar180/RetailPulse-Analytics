"""Add sale-level pricing totals.

Revision ID: 013
Revises: 012
"""
from collections.abc import Sequence
import sqlalchemy as sa
from alembic import op

revision: str = "013"
down_revision: str | None = "012"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None

def upgrade() -> None:
    # Store the calculated invoice totals directly on each sale.
    op.add_column("sales", sa.Column("subtotal", sa.Numeric(14, 2), nullable=False, server_default="0"))
    op.add_column("sales", sa.Column("discount", sa.Numeric(14, 2), nullable=False, server_default="0"))
    op.add_column("sales", sa.Column("tax", sa.Numeric(14, 2), nullable=False, server_default="0"))
    # Backfill totals for invoices that existed before these columns were added.
    op.execute(sa.text('UPDATE sales SET subtotal = (SELECT COALESCE(SUM("quantity" * "unitPrice"), 0) FROM sale_items WHERE "saleId" = sales.id), discount = (SELECT COALESCE(SUM(discount), 0) FROM sale_items WHERE "saleId" = sales.id), tax = (SELECT COALESCE(SUM(tax), 0) FROM sale_items WHERE "saleId" = sales.id)'))
    # SQLite cannot add named check constraints without rebuilding the table.
    if op.get_bind().dialect.name != "sqlite":
        op.create_check_constraint("sale_payment_status_valid", "sales", '"paymentStatus" IN (\'PAID\', \'PENDING\', \'FAILED\')')
        op.create_check_constraint("sale_subtotal_nonnegative", "sales", "subtotal >= 0")
        op.create_check_constraint("sale_discount_nonnegative", "sales", "discount >= 0")
        op.create_check_constraint("sale_tax_nonnegative", "sales", "tax >= 0")
        op.create_check_constraint("sale_total_nonnegative", "sales", '"totalAmount" >= 0')

def downgrade() -> None:
    # Remove constraints first, followed by the pricing columns.
    if op.get_bind().dialect.name != "sqlite":
        op.drop_constraint("sale_total_nonnegative", "sales", type_="check")
        op.drop_constraint("sale_tax_nonnegative", "sales", type_="check")
        op.drop_constraint("sale_discount_nonnegative", "sales", type_="check")
        op.drop_constraint("sale_subtotal_nonnegative", "sales", type_="check")
        op.drop_constraint("sale_payment_status_valid", "sales", type_="check")
    op.drop_column("sales", "tax")
    op.drop_column("sales", "discount")
    op.drop_column("sales", "subtotal")
