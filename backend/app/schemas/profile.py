from datetime import datetime
from uuid import UUID

from pydantic import EmailStr, Field

from app.core.constants import UserRole, UserStatus
from app.schemas.common import CamelCaseModel
from app.schemas.company import CompanySummaryResponse


class UserProfileResponse(CamelCaseModel):
    id: UUID
    company_id: UUID
    name: str
    email: EmailStr
    role: UserRole
    status: UserStatus
    last_login: datetime | None
    created_at: datetime
    updated_at: datetime | None = None
    company: CompanySummaryResponse


class UpdateProfileRequest(CamelCaseModel):
    name: str = Field(min_length=2, max_length=100)
