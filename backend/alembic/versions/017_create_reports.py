"""Reporting snapshots and recurring schedules."""

from alembic import op, context
import sqlalchemy as sa

revision = "017"
down_revision = "016"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    if context.is_offline_mode() or not sa.inspect(bind).has_table("report_schedules"):
        op.create_table(
            "report_schedules",
            sa.Column("id", sa.Uuid(), primary_key=True),
            sa.Column(
                "company_id",
                sa.Uuid(),
                sa.ForeignKey("companies.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "user_id",
                sa.Uuid(),
                sa.ForeignKey("users.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("name", sa.String(160), nullable=False),
            sa.Column("configuration", sa.JSON(), nullable=False),
            sa.Column("active", sa.Boolean(), nullable=False),
            sa.Column("next_run", sa.DateTime(timezone=True), nullable=False),
            sa.Column("last_run", sa.DateTime(timezone=True)),
        )
        op.create_index(
            "ix_report_schedules_company_id", "report_schedules", ["company_id"]
        )
        op.create_index(
            "ix_report_schedules_next_run", "report_schedules", ["next_run"]
        )
    if context.is_offline_mode() or not sa.inspect(bind).has_table("report_runs"):
        op.create_table(
            "report_runs",
            sa.Column("id", sa.Uuid(), primary_key=True),
            sa.Column(
                "company_id",
                sa.Uuid(),
                sa.ForeignKey("companies.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "user_id",
                sa.Uuid(),
                sa.ForeignKey("users.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "schedule_id",
                sa.Uuid(),
                sa.ForeignKey("report_schedules.id", ondelete="SET NULL"),
            ),
            sa.Column("name", sa.String(160), nullable=False),
            sa.Column("generated_by", sa.String(100), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("report_type", sa.String(30), nullable=False),
            sa.Column("filters", sa.JSON(), nullable=False),
            sa.Column("context", sa.JSON(), nullable=False),
            sa.Column("format", sa.String(10), nullable=False),
            sa.Column("status", sa.String(20), nullable=False),
            sa.Column("error", sa.Text()),
            sa.Column("delivery_status", sa.String(20)),
            sa.Column("rows", sa.JSON(), nullable=False),
            sa.Column("columns", sa.JSON(), nullable=False),
        )
        op.create_index("ix_report_runs_company_id", "report_runs", ["company_id"])
        op.create_index("ix_report_runs_schedule_id", "report_runs", ["schedule_id"])
        op.create_index("ix_report_runs_created_at", "report_runs", ["created_at"])


def downgrade():
    op.drop_table("report_runs")
    op.drop_table("report_schedules")
