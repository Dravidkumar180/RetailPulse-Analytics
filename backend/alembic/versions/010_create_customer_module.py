"""create customer management module

Revision ID: 010
Revises: 009
"""
from alembic import op
import sqlalchemy as sa

revision = "010"
down_revision = "009"
branch_labels = None
depends_on = None

def upgrade():
    # Tables are also discovered by create_all for the local SQLite development database.
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        for action in ("CUSTOMER_CREATED","CUSTOMER_UPDATED","CUSTOMER_DELETED","CUSTOMER_ACTIVATED","CUSTOMER_DEACTIVATED","CUSTOMER_STATUS_CHANGED","CUSTOMER_EXPORTED"):
            op.execute(f"ALTER TYPE audit_action ADD VALUE IF NOT EXISTS '{action}'")
    # Metadata-driven table creation keeps UUID behavior consistent across SQLite/PostgreSQL.
    from app.models.customer import Customer, CustomerPurchaseSummary, CustomerTimeline, CustomerNotification
    for table in (Customer.__table__, CustomerPurchaseSummary.__table__, CustomerTimeline.__table__, CustomerNotification.__table__):
        table.create(bind, checkfirst=True)

def downgrade():
    op.drop_table("customer_notifications")
    op.drop_table("customer_timeline")
    op.drop_table("customer_purchase_summary")
    op.drop_table("customers")
