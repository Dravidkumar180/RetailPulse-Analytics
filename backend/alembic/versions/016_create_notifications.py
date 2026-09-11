"""Create user-specific notification inbox and audit actions."""

from alembic import op, context
import sqlalchemy as sa

revision = "016"
down_revision = "015"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    if context.is_offline_mode() or not sa.inspect(bind).has_table("notifications"):
        op.create_table(
            "notifications",
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
            sa.Column("type", sa.String(40), nullable=False),
            sa.Column("title", sa.String(160), nullable=False),
            sa.Column("message", sa.Text(), nullable=False),
            sa.Column("priority", sa.String(10), nullable=False),
            sa.Column("resource_type", sa.String(40)),
            sa.Column("resource_id", sa.String(80)),
            sa.Column("path", sa.String(250)),
            sa.Column("details", sa.JSON(), nullable=False),
            sa.Column("is_read", sa.Boolean(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("read_at", sa.DateTime(timezone=True)),
            sa.Column("resolved_at", sa.DateTime(timezone=True)),
            sa.Column("expires_at", sa.DateTime(timezone=True)),
            sa.Column("event_key", sa.String(180)),
            sa.Column("active_key", sa.String(180)),
            sa.UniqueConstraint("user_id", "event_key", name="uq_notification_event"),
            sa.UniqueConstraint("user_id", "active_key", name="uq_notification_active"),
        )
        op.create_index(
            "ix_notification_inbox",
            "notifications",
            ["company_id", "user_id", "is_read", "created_at"],
        )
    if bind.dialect.name == "postgresql":
        for action in (
            "NOTIFICATION_CREATED",
            "NOTIFICATION_READ",
            "NOTIFICATIONS_READ_ALL",
            "NOTIFICATION_RESOLVED",
        ):
            op.execute(f"ALTER TYPE audit_action ADD VALUE IF NOT EXISTS '{action}'")


def downgrade():
    op.drop_table("notifications")
    # Retain PostgreSQL enum values: historical audit rows still use them.
