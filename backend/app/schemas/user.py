# Teaching guide: This file contains user data validation.
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
from app.schemas.common import (
    CamelCaseModel,
    PaginationResponse,
)


# Groups user response behavior.
class UserResponse(CamelCaseModel):
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


# Groups create user request behavior.
class CreateUserRequest(CamelCaseModel):
    # Stores name for the next steps.
    name: str = Field(
        min_length=2,
        max_length=100,
    )
    email: EmailStr
    # Stores password for the next steps.
    password: str = Field(
        min_length=8,
        max_length=72,
    )
    role: UserRole

    # Checks role.
    @classmethod
    def validate_role(
        cls,
        role: UserRole,
    ) -> UserRole:
        # Checks whether this condition is true.
        if role == UserRole.SUPER_ADMIN:
            # Stops here and reports the problem.
            raise ValueError(
                "Super Admin cannot be created through this endpoint."
            )

        # Returns the completed value to the caller.
        return role


# Groups update user status request behavior.
class UpdateUserStatusRequest(CamelCaseModel):
    status: UserStatus


# Groups user list response behavior.
class UserListResponse(PaginationResponse):
    items: list[UserResponse]