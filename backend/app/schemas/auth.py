# Teaching guide: This file contains auth data validation.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from datetime import datetime
# Imports the needed names from uuid.
from uuid import UUID

# Imports the needed names from pydantic.
from pydantic import EmailStr, Field, model_validator

# Imports the needed names from app.core.constants.
from app.core.constants import UserRole, UserStatus
# Imports the needed names from app.schemas.common.
from app.schemas.common import CamelCaseModel
# Imports the needed names from app.schemas.company.
from app.schemas.company import CompanySummaryResponse


# Groups authenticated user response behavior.
class AuthenticatedUserResponse(CamelCaseModel):
    id: UUID
    company_id: UUID
    name: str
    email: EmailStr
    role: UserRole
    status: UserStatus
    last_login: datetime | None
    company: CompanySummaryResponse


# Groups login request behavior.
class LoginRequest(CamelCaseModel):
    email: EmailStr
    # Stores password for the next steps.
    password: str = Field(min_length=8, max_length=72)


# Groups login response behavior.
class LoginResponse(CamelCaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: AuthenticatedUserResponse


# Groups refresh token request behavior.
class RefreshTokenRequest(CamelCaseModel):
    refresh_token: str


# Groups refresh token response behavior.
class RefreshTokenResponse(CamelCaseModel):
    access_token: str
    refresh_token: str
    token_type: str


# Groups logout request behavior.
class LogoutRequest(CamelCaseModel):
    # Stores refresh token for the next steps.
    refresh_token: str | None = None


# Groups change password request behavior.
class ChangePasswordRequest(CamelCaseModel):
    # Stores current password for the next steps.
    current_password: str = Field(min_length=8, max_length=72)
    # Stores new password for the next steps.
    new_password: str = Field(min_length=8, max_length=72)
    # Stores confirm password for the next steps.
    confirm_password: str = Field(min_length=8, max_length=72)

    # Runs passwords match logic.
    @model_validator(mode="after")
    def passwords_match(self) -> "ChangePasswordRequest":
        # Checks whether this condition is true.
        if self.new_password != self.confirm_password:
            # Stops here and reports the problem.
            raise ValueError("New password and confirm password must match.")
        # Returns the completed value to the caller.
        return self


# Groups forgot password request behavior.
class ForgotPasswordRequest(CamelCaseModel):
    email: EmailStr


# Groups forgot password response behavior.
class ForgotPasswordResponse(CamelCaseModel):
    message: str
    # Stores reset token for the next steps.
    reset_token: str | None = None


# Groups reset password request behavior.
class ResetPasswordRequest(CamelCaseModel):
    token: str
    # Stores new password for the next steps.
    new_password: str = Field(min_length=8, max_length=72)
    # Stores confirm password for the next steps.
    confirm_password: str = Field(min_length=8, max_length=72)

    # Runs passwords match logic.
    @model_validator(mode="after")
    def passwords_match(self) -> "ResetPasswordRequest":
        # Checks whether this condition is true.
        if self.new_password != self.confirm_password:
            # Stops here and reports the problem.
            raise ValueError("New password and confirm password must match.")
        # Returns the completed value to the caller.
        return self
