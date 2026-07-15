from datetime import datetime
from uuid import UUID

from app.schemas.common import CamelCaseModel


class RefreshTokenRecordResponse(CamelCaseModel):
    id: UUID
    user_id: UUID
    token_id: str
    expires_at: datetime
    revoked_at: datetime | None
    replaced_by_token_id: str | None
    created_at: datetime