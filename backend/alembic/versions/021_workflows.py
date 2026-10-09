"""Company-isolated approval workflows and immutable history."""
from alembic import op
from app.models.workflow import WorkflowConfig, ApprovalRequest, ApprovalHistory
revision='021'
down_revision='020'
branch_labels=None
depends_on=None

def upgrade():
    bind=op.get_bind()
    if bind.dialect.name == 'postgresql':
        with op.get_context().autocommit_block():
            for suffix in ('CREATED','SUBMITTED','APPROVED','REJECTED','CANCELLED','VIEWED','APPLIED','CONFIG_CHANGED'):
                op.execute(f"ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'WORKFLOW_{suffix}'")
    for model in (WorkflowConfig,ApprovalRequest,ApprovalHistory):model.__table__.create(bind,checkfirst=True)

def downgrade():
    for model in (ApprovalHistory,ApprovalRequest,WorkflowConfig):model.__table__.drop(op.get_bind(),checkfirst=True)
