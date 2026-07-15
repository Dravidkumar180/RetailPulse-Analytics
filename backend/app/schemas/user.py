from datetime import datetime
from uuid import UUID

from pydantic import EmailStr, Field

from app.core.constants import UserRole, UserStatus
from app.schemas.common import (
    CamelCaseModel,
    PaginationResponse,
)


class UserResponse(CamelCaseModel):
    id: UUID
    company_id: UUID
    name: str
    email: EmailStr
    role: UserRole
    status: UserStatus
    last_login: datetime | None
    created_at: datetime
    updated_at: datetime | None = None


class CreateUserRequest(CamelCaseModel):
    name: str = Field(
        min_length=2,
        max_length=100,
    )
    email: EmailStr
    password: str = Field(
        min_length=8,
        max_length=72,
    )
    role: UserRole

    @classmethod
    def validate_role(
        cls,
        role: UserRole,
    ) -> UserRole:
        if role == UserRole.SUPER_ADMIN:
            raise ValueError(
                "Super Admin cannot be created through this endpoint."
            )

        return role


class UpdateUserStatusRequest(CamelCaseModel):
    status: UserStatus


class UserListResponse(PaginationResponse):
    items: list[UserResponse]