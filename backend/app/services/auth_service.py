from sqlalchemy.orm import Session

from app.core.constants import (
    AuditAction,
    UserStatus,
)
from app.core.exceptions import (
    AccountInactiveException,
    AccountSuspendedException,
    InvalidCredentialsException,
    InvalidPasswordException,
    InvalidTokenException,
    ResourceNotFoundException,
)
from app.core.jwt import decode_password_reset_token
from app.core.security import (
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories.refresh_token_repository import (
    user_repository,
)
from app.schemas.auth import (
    AuthenticatedUserResponse,
    ChangePasswordRequest,
    LoginRequest,
    LoginResponse,
    RefreshTokenResponse,
    ResetPasswordRequest,
)
from app.services.audit_log_service import (
    audit_log_service,
)
from app.services.token_service import token_service


class AuthService:
    def login(
        self,
        db: Session,
        *,
        request_data: LoginRequest,
        ip_address: str,
        browser: str,
    ) -> LoginResponse:
        user = user_repository.get_by_email(
            db,
            str(request_data.email),
        )

        if user is None or not verify_password(
            request_data.password,
            user.password_hash,
        ):
            raise InvalidCredentialsException()

        if user.status == UserStatus.SUSPENDED:
            raise AccountSuspendedException()

        if user.status != UserStatus.ACTIVE:
            raise AccountInactiveException()

        try:
            user_repository.update_last_login(
                db,
                user,
            )

            access_token, refresh_token = (
                token_service.create_token_pair(
                    db,
                    user,
                )
            )

            audit_log_service.create_log(
                db,
                company_id=user.company_id,
                user_id=user.id,
                action=AuditAction.USER_LOGIN,
                ip_address=ip_address,
                browser=browser,
            )

            db.commit()
            db.refresh(user)

            return LoginResponse(
                access_token=access_token,
                refresh_token=refresh_token,
                token_type="Bearer",
                user=AuthenticatedUserResponse.model_validate(
                    user
                ),
            )
        except Exception:
            db.rollback()
            raise

    def refresh_access_token(
        self,
        db: Session,
        *,
        refresh_token: str,
    ) -> RefreshTokenResponse:
        payload, stored_token = (
            token_service.validate_refresh_token(
                db,
                refresh_token,
            )
        )

        user_id = payload.get("sub")

        if not isinstance(user_id, str):
            raise InvalidTokenException()

        from uuid import UUID

        user = user_repository.get_by_id(
            db,
            UUID(user_id),
        )

        if user is None:
            raise ResourceNotFoundException(
                "User",
            )

        if user.status != UserStatus.ACTIVE:
            raise AccountInactiveException()

        access_token, new_refresh_token = (
            token_service.rotate_refresh_token(
                db,
                user,
                stored_token,
            )
        )

        db.commit()

        return RefreshTokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
            token_type="Bearer",
        )

    def logout(
        self,
        db: Session,
        *,
        current_user: User,
        refresh_token: str | None,
        ip_address: str,
        browser: str,
    ) -> None:
        try:
            if refresh_token:
                token_service.revoke_refresh_token(
                    db,
                    refresh_token,
                )

            audit_log_service.create_log(
                db,
                company_id=current_user.company_id,
                user_id=current_user.id,
                action=AuditAction.USER_LOGOUT,
                ip_address=ip_address,
                browser=browser,
            )

            db.commit()
        except Exception:
            db.rollback()
            raise

    def change_password(
        self,
        db: Session,
        *,
        current_user: User,
        request_data: ChangePasswordRequest,
        ip_address: str,
        browser: str,
    ) -> None:
        if not verify_password(
            request_data.current_password,
            current_user.password_hash,
        ):
            raise InvalidPasswordException(
                detail="Current password is incorrect.",
            )

        try:
            user_repository.update_password_hash(
                db,
                current_user,
                hash_password(
                    request_data.new_password
                ),
            )

            token_service.revoke_all_user_tokens(
                db,
                current_user.id,
            )

            audit_log_service.create_log(
                db,
                company_id=current_user.company_id,
                user_id=current_user.id,
                action=AuditAction.PASSWORD_CHANGED,
                ip_address=ip_address,
                browser=browser,
            )

            db.commit()
        except Exception:
            db.rollback()
            raise

    def request_password_reset(
        self,
        db: Session,
        *,
        email: str,
    ) -> str | None:
        user = user_repository.get_by_email(
            db,
            email,
        )

        if user is None:
            return None

        from app.core.jwt import (
            create_password_reset_token,
        )

        reset_token, _, _ = (
            create_password_reset_token(
                user_id=str(user.id),
                email=user.email,
            )
        )

        # Replace this return with an email service later.
        return reset_token

    def reset_password(
        self,
        db: Session,
        *,
        request_data: ResetPasswordRequest,
        ip_address: str,
        browser: str,
    ) -> None:
        payload = decode_password_reset_token(
            request_data.token
        )

        user_id = payload.get("sub")

        if not isinstance(user_id, str):
            raise InvalidTokenException()

        from uuid import UUID

        user = user_repository.get_by_id(
            db,
            UUID(user_id),
        )

        if user is None:
            raise ResourceNotFoundException(
                "User",
            )

        token_email = payload.get("email")

        if token_email != user.email:
            raise InvalidTokenException(
                detail=(
                    "Password reset token does not "
                    "match the account."
                ),
            )

        try:
            user_repository.update_password_hash(
                db,
                user,
                hash_password(
                    request_data.new_password
                ),
            )

            token_service.revoke_all_user_tokens(
                db,
                user.id,
            )

            audit_log_service.create_log(
                db,
                company_id=user.company_id,
                user_id=user.id,
                action=AuditAction.PASSWORD_CHANGED,
                ip_address=ip_address,
                browser=browser,
            )

            db.commit()
        except Exception:
            db.rollback()
            raise


auth_service = AuthService()
