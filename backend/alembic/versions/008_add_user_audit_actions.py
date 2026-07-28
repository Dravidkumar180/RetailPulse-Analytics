"""add user invitation and update audit actions

Revision ID: 008
Revises: 007
"""

from alembic import op


revision = "008"
down_revision = "007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    connection = op.get_bind()
    if connection.dialect.name == "postgresql":
        op.execute("ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'USER_INVITED'")
        op.execute("ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'USER_UPDATED'")


def downgrade() -> None:
    # PostgreSQL enum values cannot be safely removed while rows may use them.
    pass
