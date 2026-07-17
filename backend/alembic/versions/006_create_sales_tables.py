"""Create sales and sale_items tables and sales audit actions.

Revision ID: 006
Revises: 005
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "006"
down_revision: str | None = "005"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None

def upgrade() -> None:
    connection = op.get_bind()
    if connection.dialect.name == "postgresql":
        for value in ("SALE_CREATED", "SALE_UPDATED", "SALE_DELETED", "INVENTORY_UPDATED", "PRODUCT_OUT_OF_STOCK"):
            op.execute(sa.text(f"ALTER TYPE audit_action ADD VALUE IF NOT EXISTS '{value}'"))
    op.add_column("audit_logs", sa.Column("details", sa.Text(), nullable=True))
    op.create_table("sales",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("companyId", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("invoiceNumber", sa.String(40), nullable=False), sa.Column("customerName", sa.String(160), nullable=False),
        sa.Column("saleDate", sa.DateTime(timezone=True), nullable=False), sa.Column("salesChannel", sa.String(30), nullable=False),
        sa.Column("paymentMethod", sa.String(30), nullable=False), sa.Column("totalAmount", sa.Numeric(14,2), nullable=False),
        sa.Column("createdBy", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("createdAt", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updatedAt", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["companyId"], ["companies.id"], ondelete="CASCADE"), sa.ForeignKeyConstraint(["createdBy"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"), sa.UniqueConstraint("companyId", "invoiceNumber", name="uq_sales_company_invoice"))
    op.create_index("ix_sales_companyId", "sales", ["companyId"]); op.create_index("ix_sales_company_date", "sales", ["companyId", "saleDate"])
    op.create_table("sale_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False), sa.Column("saleId", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("productId", postgresql.UUID(as_uuid=True), nullable=False), sa.Column("categoryId", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False), sa.Column("unitPrice", sa.Numeric(12,2), nullable=False), sa.Column("discount", sa.Numeric(12,2), nullable=False, server_default="0"), sa.Column("tax", sa.Numeric(12,2), nullable=False, server_default="0"), sa.Column("total", sa.Numeric(14,2), nullable=False),
        sa.CheckConstraint('"quantity" > 0', name="sale_item_quantity_positive"), sa.CheckConstraint('"unitPrice" >= 0', name="sale_item_unit_price_nonnegative"), sa.CheckConstraint('"discount" >= 0', name="sale_item_discount_nonnegative"), sa.CheckConstraint('"tax" >= 0', name="sale_item_tax_nonnegative"),
        sa.ForeignKeyConstraint(["saleId"], ["sales.id"], ondelete="CASCADE"), sa.ForeignKeyConstraint(["productId"], ["products.id"], ondelete="RESTRICT"), sa.ForeignKeyConstraint(["categoryId"], ["categories.id"], ondelete="RESTRICT"), sa.PrimaryKeyConstraint("id"))
    op.create_index("ix_sale_items_saleId", "sale_items", ["saleId"])

def downgrade() -> None:
    op.drop_table("sale_items"); op.drop_table("sales"); op.drop_column("audit_logs", "details")
