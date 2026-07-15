from datetime import datetime
from uuid import UUID

from pydantic import EmailStr, Field, model_validator

from app.core.constants import UserRole, UserStatus
from app.schemas.common import CamelCaseModel
from app.schemas.company import CompanySummaryResponse


class AuthenticatedUserResponse(CamelCaseModel):
    id: UUID
    company_id: UUID
    name: str
    email: EmailStr
    role: UserRole
    status: UserStatus
    last_login: datetime | None
    company: CompanySummaryResponse


class LoginRequest(CamelCaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


class LoginResponse(CamelCaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: AuthenticatedUserResponse


class RefreshTokenRequest(CamelCaseModel):
    refresh_token: str


class RefreshTokenResponse(CamelCaseModel):
    access_token: str
    refresh_token: str
    token_type: str


class LogoutRequest(CamelCaseModel):
    refresh_token: str | None = None


class ChangePasswordRequest(CamelCaseModel):
    current_password: str = Field(min_length=8, max_length=72)
    new_password: str = Field(min_length=8, max_length=72)
    confirm_password: str = Field(min_length=8, max_length=72)

    @model_validator(mode="after")
    def passwords_match(self) -> "ChangePasswordRequest":
        if self.new_password != self.confirm_password:
            raise ValueError("New password and confirm password must match.")
        return self


class ForgotPasswordRequest(CamelCaseModel):
    email: EmailStr


class ForgotPasswordResponse(CamelCaseModel):
    message: str
    reset_token: str | None = None


class ResetPasswordRequest(CamelCaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=72)
    confirm_password: str = Field(min_length=8, max_length=72)

    @model_validator(mode="after")
    def passwords_match(self) -> "ResetPasswordRequest":
        if self.new_password != self.confirm_password:
            raise ValueError("New password and confirm password must match.")
        return self
