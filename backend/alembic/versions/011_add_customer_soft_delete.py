"""add customer soft deletion

Revision ID: 011
Revises: 010
"""

from alembic import op
import sqlalchemy as sa

revision = "011"
down_revision = "010"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "customers",
        sa.Column("isDeleted", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "customers",
        sa.Column("deletedAt", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_customers_isDeleted", "customers", ["isDeleted"])


def downgrade():
    op.drop_index("ix_customers_isDeleted", table_name="customers")
    op.drop_column("customers", "deletedAt")
    op.drop_column("customers", "isDeleted")
