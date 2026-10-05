"""Durable bulk import jobs and per-row outcomes."""
from alembic import context, op
from app.models.bulk_import import BulkImportJob, BulkImportRow

revision = "019"
down_revision = "018"
branch_labels = None
depends_on = None


def upgrade():
    for table in (BulkImportJob.__table__, BulkImportRow.__table__):
        table.create(op.get_bind(), checkfirst=not context.is_offline_mode())


def downgrade():
    for table in (BulkImportRow.__table__, BulkImportJob.__table__):
        table.drop(op.get_bind(), checkfirst=True)
