"""Create categories and products tables.

Revision ID: 005
Revises: 004
"""
from collections.abc import Sequence
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "005"
down_revision: str | None = "004"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None

def upgrade() -> None:
    connection = op.get_bind()
    if connection.dialect.name == "postgresql":
        for value in ("CATEGORY_CREATED","CATEGORY_UPDATED","CATEGORY_DELETED","PRODUCT_CREATED","PRODUCT_UPDATED","PRODUCT_DELETED","PRODUCT_ACTIVATED","PRODUCT_DEACTIVATED"):
            op.execute(sa.text(f"ALTER TYPE audit_action ADD VALUE IF NOT EXISTS '{value}'"))
    op.create_table("categories",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("companyId", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(120), nullable=False), sa.Column("description", sa.Text()),
        sa.Column("status", sa.String(20), nullable=False, server_default="ACTIVE"),
        sa.Column("createdAt", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updatedAt", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["companyId"],["companies.id"],ondelete="CASCADE"), sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("companyId","name",name="uq_categories_company_name"))
    op.create_index("ix_categories_companyId","categories",["companyId"])
    op.create_table("products",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False), sa.Column("companyId", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("categoryId", postgresql.UUID(as_uuid=True), nullable=False), sa.Column("name",sa.String(160),nullable=False),
        sa.Column("sku",sa.String(80),nullable=False), sa.Column("brand",sa.String(120)), sa.Column("description",sa.Text()),
        sa.Column("unitPrice",sa.Numeric(12,2),nullable=False), sa.Column("costPrice",sa.Numeric(12,2),nullable=False),
        sa.Column("stockQuantity",sa.Integer(),nullable=False,server_default="0"), sa.Column("unitOfMeasure",sa.String(40),nullable=False),
        sa.Column("status",sa.String(20),nullable=False,server_default="ACTIVE"),
        sa.Column("createdAt",sa.DateTime(timezone=True),server_default=sa.text("CURRENT_TIMESTAMP"),nullable=False),
        sa.Column("updatedAt",sa.DateTime(timezone=True),server_default=sa.text("CURRENT_TIMESTAMP"),nullable=False),
        sa.CheckConstraint('"unitPrice" > 0',name="ck_products_product_unit_price_positive"),
        sa.CheckConstraint('"costPrice" >= 0 AND "costPrice" <= "unitPrice"',name="ck_products_product_cost_valid"),
        sa.CheckConstraint('"stockQuantity" >= 0',name="ck_products_product_stock_nonnegative"),
        sa.ForeignKeyConstraint(["companyId"],["companies.id"],ondelete="CASCADE"), sa.ForeignKeyConstraint(["categoryId"],["categories.id"],ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"), sa.UniqueConstraint("companyId","sku",name="uq_products_company_sku"),
        sa.UniqueConstraint("companyId","categoryId","name",name="uq_products_company_category_name"))
    op.create_index("ix_products_companyId","products",["companyId"]); op.create_index("ix_products_categoryId","products",["categoryId"]); op.create_index("ix_products_company_status","products",["companyId","status"])

def downgrade() -> None:
    op.drop_table("products"); op.drop_table("categories")
