# Teaching guide: This file contains API requests and responses for auth.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from fastapi import APIRouter, Request, status
# Imports the needed names from sqlalchemy.orm.
from sqlalchemy.orm import Session

# Imports the needed names from app.api.dependencies.
from app.api.dependencies import (
    BrowserInfo,
    ClientIp,
    DatabaseSession,
)
# Imports the needed names from app.core.security.
from app.core.security import CurrentActiveUser
# Imports the needed names from app.core.config.
from app.core.config import settings
# Imports the needed names from app.schemas.auth.
from app.schemas.auth import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    LoginResponse,
    LogoutRequest,
    RefreshTokenRequest,
    RefreshTokenResponse,
    ResetPasswordRequest,
)
# Imports the needed names from app.schemas.company.
from app.schemas.company import (
    CompanyRegistrationRequest,
    CompanyRegistrationResponse,
)
# Imports the needed names from app.schemas.common.
from app.schemas.common import MessageResponse
# Imports the needed names from app.services.auth_service.
from app.services.auth_service import auth_service
# Imports the needed names from app.services.company_service.
from app.services.company_service import company_service


# Stores router for the next steps.
router = APIRouter()


@router.post(
    "/register-company",
    response_model=CompanyRegistrationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register company and first administrator",
)
# Adds company.
def register_company(
    request_data: CompanyRegistrationRequest,
    request: Request,
    db: DatabaseSession,
    client_ip: ClientIp,
    browser: BrowserInfo,
) -> CompanyRegistrationResponse:
    """
    Create a company and its first Company Admin in one transaction.

    The service must:
    - verify company name and company email uniqueness;
    - verify owner email uniqueness;
    - hash the password;
    - create the company;
    - create the Company Admin;
    - create the Company Registered audit entry.
    """
    # Returns the completed value to the caller.
    return company_service.register_company(
        db=db,
        request_data=request_data,
        ip_address=client_ip,
        browser=browser,
    )


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Authenticate user",
)
# Logs the user in.
def login(
    request_data: LoginRequest,
    db: DatabaseSession,
    client_ip: ClientIp,
    browser: BrowserInfo,
) -> LoginResponse:
    # Returns the completed value to the caller.
    return auth_service.login(
        db=db,
        request_data=request_data,
        ip_address=client_ip,
        browser=browser,
    )


@router.post(
    "/refresh",
    response_model=RefreshTokenResponse,
    summary="Refresh access token",
)
# Runs refresh access token logic.
def refresh_access_token(
    request_data: RefreshTokenRequest,
    db: DatabaseSession,
) -> RefreshTokenResponse:
    # Returns the completed value to the caller.
    return auth_service.refresh_access_token(
        db=db,
        refresh_token=request_data.refresh_token,
    )


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Logout user",
)
# Logs the user out.
def logout(
    request_data: LogoutRequest,
    db: DatabaseSession,
    current_user: CurrentActiveUser,
    client_ip: ClientIp,
    browser: BrowserInfo,
) -> MessageResponse:
    auth_service.logout(
        db=db,
        current_user=current_user,
        refresh_token=request_data.refresh_token,
        ip_address=client_ip,
        browser=browser,
    )

    # Returns the completed value to the caller.
    return MessageResponse(
        message="Logged out successfully.",
    )


@router.post(
    "/change-password",
    response_model=MessageResponse,
    summary="Change authenticated user's password",
)
# Runs change password logic.
def change_password(
    request_data: ChangePasswordRequest,
    db: DatabaseSession,
    current_user: CurrentActiveUser,
    client_ip: ClientIp,
    browser: BrowserInfo,
) -> MessageResponse:
    auth_service.change_password(
        db=db,
        current_user=current_user,
        request_data=request_data,
        ip_address=client_ip,
        browser=browser,
    )

    # Returns the completed value to the caller.
    return MessageResponse(
        message="Password changed successfully.",
    )


@router.post(
    "/forgot-password",
    response_model=ForgotPasswordResponse,
    summary="Request password reset",
)
# Runs forgot password logic.
def forgot_password(
    request_data: ForgotPasswordRequest,
    db: DatabaseSession,
) -> ForgotPasswordResponse:
    # Stores reset token for the next steps.
    reset_token = auth_service.request_password_reset(
        db=db,
        email=request_data.email,
    )

    # Always return a generic response to prevent email enumeration.
    return ForgotPasswordResponse(
        message=(
            "If an account exists for this email address, "
            "a password reset link has been sent."
        ),
        reset_token=(
            reset_token
            if settings.EXPOSE_PASSWORD_RESET_TOKEN
            and settings.ENVIRONMENT.lower() != "production"
            else None
        ),
    )


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    summary="Reset password using reset token",
)
# Runs reset password logic.
def reset_password(
    request_data: ResetPasswordRequest,
    db: DatabaseSession,
    client_ip: ClientIp,
    browser: BrowserInfo,
) -> MessageResponse:
    auth_service.reset_password(
        db=db,
        request_data=request_data,
        ip_address=client_ip,
        browser=browser,
    )

    # Returns the completed value to the caller.
    return MessageResponse(
        message="Password reset successfully.",
    )
