# Teaching guide: This file contains auth service business logic.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from sqlalchemy.orm import Session

# Imports the needed names from app.core.constants.
from app.core.constants import (
    AuditAction,
    UserStatus,
)
# Imports the needed names from app.core.exceptions.
from app.core.exceptions import (
    AccountInactiveException,
    AccountSuspendedException,
    InvalidCredentialsException,
    InvalidPasswordException,
    InvalidTokenException,
    ResourceNotFoundException,
)
# Imports the needed names from app.core.jwt.
from app.core.jwt import decode_password_reset_token
# Imports the needed names from app.core.security.
from app.core.security import (
    hash_password,
    verify_password,
)
# Imports the needed names from app.models.user.
from app.models.user import User
# Imports the needed names from app.repositories.refresh_token_repository.
from app.repositories.refresh_token_repository import (
    user_repository,
)
# Imports the needed names from app.schemas.auth.
from app.schemas.auth import (
    AuthenticatedUserResponse,
    ChangePasswordRequest,
    LoginRequest,
    LoginResponse,
    RefreshTokenResponse,
    ResetPasswordRequest,
)
# Imports the needed names from app.services.audit_log_service.
from app.services.audit_log_service import (
    audit_log_service,
)
# Imports the needed names from app.services.token_service.
from app.services.token_service import token_service


# Groups auth service behavior.
class AuthService:
    # Logs the user in.
    def login(
        self,
        db: Session,
        *,
        request_data: LoginRequest,
        ip_address: str,
        browser: str,
    ) -> LoginResponse:
        # Stores user for the next steps.
        user = user_repository.get_by_email(
            db,
            str(request_data.email),
        )

        # Checks whether this condition is true.
        if user is None or not verify_password(
            request_data.password,
            user.password_hash,
        ):
            # Stops here and reports the problem.
            raise InvalidCredentialsException()

        # Checks whether this condition is true.
        if user.status == UserStatus.SUSPENDED:
            # Stops here and reports the problem.
            raise AccountSuspendedException()

        # Checks whether this condition is true.
        if user.status != UserStatus.ACTIVE:
            # Stops here and reports the problem.
            raise AccountInactiveException()

        # Tries this work and watches for errors.
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

            # Applies this change to the database session.
            db.commit()
            # Applies this change to the database session.
            db.refresh(user)

            # Returns the completed value to the caller.
            return LoginResponse(
                access_token=access_token,
                refresh_token=refresh_token,
                token_type="Bearer",
                user=AuthenticatedUserResponse.model_validate(
                    user
                ),
            )
        # Handles the error raised by the work above.
        except Exception:
            # Applies this change to the database session.
            db.rollback()
            # Stops here and reports the problem.
            raise

    # Runs refresh access token logic.
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

        # Stores user id for the next steps.
        user_id = payload.get("sub")

        # Checks whether this condition is true.
        if not isinstance(user_id, str):
            # Stops here and reports the problem.
            raise InvalidTokenException()

        # Imports the needed names from uuid.
        from uuid import UUID

        # Stores user for the next steps.
        user = user_repository.get_by_id(
            db,
            UUID(user_id),
        )

        # Checks whether this condition is true.
        if user is None:
            # Stops here and reports the problem.
            raise ResourceNotFoundException(
                "User",
            )

        # Checks whether this condition is true.
        if user.status != UserStatus.ACTIVE:
            # Stops here and reports the problem.
            raise AccountInactiveException()

        access_token, new_refresh_token = (
            token_service.rotate_refresh_token(
                db,
                user,
                stored_token,
            )
        )

        # Applies this change to the database session.
        db.commit()

        # Returns the completed value to the caller.
        return RefreshTokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
            token_type="Bearer",
        )

    # Logs the user out.
    def logout(
        self,
        db: Session,
        *,
        current_user: User,
        refresh_token: str | None,
        ip_address: str,
        browser: str,
    ) -> None:
        # Tries this work and watches for errors.
        try:
            # Checks whether this condition is true.
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

            # Applies this change to the database session.
            db.commit()
        # Handles the error raised by the work above.
        except Exception:
            # Applies this change to the database session.
            db.rollback()
            # Stops here and reports the problem.
            raise

    # Runs change password logic.
    def change_password(
        self,
        db: Session,
        *,
        current_user: User,
        request_data: ChangePasswordRequest,
        ip_address: str,
        browser: str,
    ) -> None:
        # Checks whether this condition is true.
        if not verify_password(
            request_data.current_password,
            current_user.password_hash,
        ):
            # Stops here and reports the problem.
            raise InvalidPasswordException(
                detail="Current password is incorrect.",
            )

        # Tries this work and watches for errors.
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

            # Applies this change to the database session.
            db.commit()
        # Handles the error raised by the work above.
        except Exception:
            # Applies this change to the database session.
            db.rollback()
            # Stops here and reports the problem.
            raise

    # Runs request password reset logic.
    def request_password_reset(
        self,
        db: Session,
        *,
        email: str,
    ) -> str | None:
        # Stores user for the next steps.
        user = user_repository.get_by_email(
            db,
            email,
        )

        # Checks whether this condition is true.
        if user is None:
            # Returns the completed value to the caller.
            return None

        # Imports the needed names from app.core.jwt.
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

    # Runs reset password logic.
    def reset_password(
        self,
        db: Session,
        *,
        request_data: ResetPasswordRequest,
        ip_address: str,
        browser: str,
    ) -> None:
        # Stores payload for the next steps.
        payload = decode_password_reset_token(
            request_data.token
        )

        # Stores user id for the next steps.
        user_id = payload.get("sub")

        # Checks whether this condition is true.
        if not isinstance(user_id, str):
            # Stops here and reports the problem.
            raise InvalidTokenException()

        # Imports the needed names from uuid.
        from uuid import UUID

        # Stores user for the next steps.
        user = user_repository.get_by_id(
            db,
            UUID(user_id),
        )

        # Checks whether this condition is true.
        if user is None:
            # Stops here and reports the problem.
            raise ResourceNotFoundException(
                "User",
            )

        # Stores token email for the next steps.
        token_email = payload.get("email")

        # Checks whether this condition is true.
        if token_email != user.email:
            # Stops here and reports the problem.
            raise InvalidTokenException(
                detail=(
                    "Password reset token does not "
                    "match the account."
                ),
            )

        # Tries this work and watches for errors.
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

            # Applies this change to the database session.
            db.commit()
        # Handles the error raised by the work above.
        except Exception:
            # Applies this change to the database session.
            db.rollback()
            # Stops here and reports the problem.
            raise


# Stores auth service for the next steps.
auth_service = AuthService()
