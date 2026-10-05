"""Add import start and cancellation audit actions."""
from alembic import op

revision = "020"
down_revision = "019"
branch_labels = None
depends_on = None


def upgrade():
    if op.get_bind().dialect.name == "postgresql":
        with op.get_context().autocommit_block():
            for action in ("IMPORT_STARTED", "IMPORT_CANCELLED"):
                op.execute(f"ALTER TYPE audit_action ADD VALUE IF NOT EXISTS '{action}'")


def downgrade():
    # PostgreSQL enum values cannot be safely removed while audit history uses them.
    pass
