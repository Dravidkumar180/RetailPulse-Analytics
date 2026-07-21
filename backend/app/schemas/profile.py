# Teaching guide: This file contains profile data validation.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from datetime import datetime
# Imports the needed names from uuid.
from uuid import UUID

# Imports the needed names from pydantic.
from pydantic import EmailStr, Field

# Imports the needed names from app.core.constants.
from app.core.constants import UserRole, UserStatus
# Imports the needed names from app.schemas.common.
from app.schemas.common import CamelCaseModel
# Imports the needed names from app.schemas.company.
from app.schemas.company import CompanySummaryResponse


# Groups user profile response behavior.
class UserProfileResponse(CamelCaseModel):
    id: UUID
    company_id: UUID
    name: str
    email: EmailStr
    role: UserRole
    status: UserStatus
    last_login: datetime | None
    created_at: datetime
    # Stores updated at for the next steps.
    updated_at: datetime | None = None
    company: CompanySummaryResponse


# Groups update profile request behavior.
class UpdateProfileRequest(CamelCaseModel):
    # Stores name for the next steps.
    name: str = Field(min_length=2, max_length=100)
