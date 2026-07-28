"""add profile and settings audit actions

Revision ID: 009
Revises: 008
"""

from alembic import op


revision = "009"
down_revision = "008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    connection = op.get_bind()
    if connection.dialect.name == "postgresql":
        op.execute("ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'PROFILE_UPDATED'")
        op.execute("ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'SETTINGS_UPDATED'")


def downgrade() -> None:
    pass
