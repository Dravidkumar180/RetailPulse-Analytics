from fastapi import APIRouter, Request, status
from sqlalchemy.orm import Session

from app.api.dependencies import (
    BrowserInfo,
    ClientIp,
    DatabaseSession,
)
from app.core.security import CurrentActiveUser
from app.core.config import settings
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
from app.schemas.company import (
    CompanyRegistrationRequest,
    CompanyRegistrationResponse,
)
from app.schemas.common import MessageResponse
from app.services.auth_service import auth_service
from app.services.company_service import company_service


router = APIRouter()


@router.post(
    "/register-company",
    response_model=CompanyRegistrationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register company and first administrator",
)
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
def login(
    request_data: LoginRequest,
    db: DatabaseSession,
    client_ip: ClientIp,
    browser: BrowserInfo,
) -> LoginResponse:
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
def refresh_access_token(
    request_data: RefreshTokenRequest,
    db: DatabaseSession,
) -> RefreshTokenResponse:
    return auth_service.refresh_access_token(
        db=db,
        refresh_token=request_data.refresh_token,
    )


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Logout user",
)
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

    return MessageResponse(
        message="Logged out successfully.",
    )


@router.post(
    "/change-password",
    response_model=MessageResponse,
    summary="Change authenticated user's password",
)
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

    return MessageResponse(
        message="Password changed successfully.",
    )


@router.post(
    "/forgot-password",
    response_model=ForgotPasswordResponse,
    summary="Request password reset",
)
def forgot_password(
    request_data: ForgotPasswordRequest,
    db: DatabaseSession,
) -> ForgotPasswordResponse:
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

    return MessageResponse(
        message="Password reset successfully.",
    )
