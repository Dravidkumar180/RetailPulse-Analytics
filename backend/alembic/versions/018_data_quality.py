"""Central data quality issue store and transactional check outbox."""

from alembic import op, context
import sqlalchemy as sa
from app.models.data_quality import QualityRun, QualityIssue, QualityChange

revision = "018"
down_revision = "017"
branch_labels = None
depends_on = None


def upgrade():
    if context.is_offline_mode() or "availableBefore" not in {
        c["name"] for c in sa.inspect(op.get_bind()).get_columns("inventory_movements")
    }:
        op.add_column(
            "inventory_movements",
            sa.Column("availableBefore", sa.Integer(), nullable=True),
        )
    for table in (
        QualityRun.__table__,
        QualityIssue.__table__,
        QualityChange.__table__,
    ):
        table.create(op.get_bind(), checkfirst=not context.is_offline_mode())
    if op.get_bind().dialect.name == "postgresql":
        with op.get_context().autocommit_block():
            for action in (
                "RECONCILIATION_STARTED",
                "RECONCILIATION_COMPLETED",
                "QUALITY_ISSUE_UPDATED",
            ):
                op.execute(
                    f"ALTER TYPE audit_action ADD VALUE IF NOT EXISTS '{action}'"
                )


def downgrade():
    op.drop_column("inventory_movements", "availableBefore")
    for table in (
        QualityChange.__table__,
        QualityIssue.__table__,
        QualityRun.__table__,
    ):
        table.drop(op.get_bind(), checkfirst=True)
