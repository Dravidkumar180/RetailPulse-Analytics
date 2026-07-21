# Teaching guide: This file contains refresh token data validation.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from datetime import datetime
# Imports the needed names from uuid.
from uuid import UUID

# Imports the needed names from app.schemas.common.
from app.schemas.common import CamelCaseModel


# Groups refresh token record response behavior.
class RefreshTokenRecordResponse(CamelCaseModel):
    id: UUID
    user_id: UUID
    token_id: str
    expires_at: datetime
    revoked_at: datetime | None
    replaced_by_token_id: str | None
    created_at: datetime