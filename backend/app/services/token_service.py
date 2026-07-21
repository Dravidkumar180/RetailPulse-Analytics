# Teaching guide: This file contains token service business logic.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

import hashlib
# Imports secrets for use below.
import secrets
# Imports the needed names from datetime.
from datetime import datetime
# Imports the needed names from uuid.
from uuid import UUID

# Imports the needed names from sqlalchemy.orm.
from sqlalchemy.orm import Session

# Imports the needed names from app.core.exceptions.
from app.core.exceptions import (
    ExpiredTokenException,
    InvalidTokenException,
)
# Imports the needed names from app.core.jwt.
from app.core.jwt import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
)
# Imports the needed names from app.models.refresh_token.
from app.models.refresh_token import RefreshToken
# Imports the needed names from app.models.user.
from app.models.user import User
# Imports the needed names from app.repositories.audit_log_repository.
from app.repositories.audit_log_repository import (
    refresh_token_repository,
)
from app.utils.datetime_utils import is_expired


# Groups token service behavior.
class TokenService:
    # Checks hash token.
    @staticmethod
    def hash_token(token: str) -> str:
        # Returns the completed value to the caller.
        return hashlib.sha256(
            token.encode("utf-8")
        ).hexdigest()

    # Adds token pair.
    def create_token_pair(
        self,
        db: Session,
        user: User,
    ) -> tuple[str, str]:
        access_token, _, _ = create_access_token(
            user_id=str(user.id),
            company_id=str(user.company_id),
            role=user.role.value,
        )

        refresh_token, refresh_expires_at, token_id = (
            create_refresh_token(
                user_id=str(user.id),
                company_id=str(user.company_id),
                role=user.role.value,
            )
        )

        refresh_token_repository.create(
            db,
            user_id=user.id,
            token_hash=self.hash_token(refresh_token),
            token_id=token_id,
            expires_at=refresh_expires_at,
        )

        # Returns the completed value to the caller.
        return access_token, refresh_token

    # Checks refresh token.
    def validate_refresh_token(
        self,
        db: Session,
        raw_token: str,
    ) -> tuple[dict[str, object], RefreshToken]:
        # Stores payload for the next steps.
        payload = decode_refresh_token(raw_token)
        # Stores token hash for the next steps.
        token_hash = self.hash_token(raw_token)

        # Stores stored token for the next steps.
        stored_token = (
            refresh_token_repository.get_by_token_hash(
                db,
                token_hash,
            )
        )

        # Checks whether this condition is true.
        if stored_token is None:
            # Stops here and reports the problem.
            raise InvalidTokenException(
                detail="Refresh token is not recognized.",
            )

        # Checks whether this condition is true.
        if stored_token.revoked_at is not None:
            # Stops here and reports the problem.
            raise InvalidTokenException(
                detail="Refresh token has been revoked.",
            )

        # Checks whether this condition is true.
        if is_expired(stored_token.expires_at):
            # Stops here and reports the problem.
            raise ExpiredTokenException()

        # Checks whether this condition is true.
        if stored_token.token_id != payload.get("jti"):
            # Stops here and reports the problem.
            raise InvalidTokenException(
                detail="Refresh token identifier is invalid.",
            )

        # Returns the completed value to the caller.
        return payload, stored_token

    # Runs rotate refresh token logic.
    def rotate_refresh_token(
        self,
        db: Session,
        user: User,
        current_token: RefreshToken,
    ) -> tuple[str, str]:
        new_access_token, _, _ = create_access_token(
            user_id=str(user.id),
            company_id=str(user.company_id),
            role=user.role.value,
        )

        new_refresh_token, expires_at, new_token_id = (
            create_refresh_token(
                user_id=str(user.id),
                company_id=str(user.company_id),
                role=user.role.value,
            )
        )

        refresh_token_repository.revoke(
            db,
            current_token,
            replaced_by_token_id=new_token_id,
        )

        refresh_token_repository.create(
            db,
            user_id=user.id,
            token_hash=self.hash_token(new_refresh_token),
            token_id=new_token_id,
            expires_at=expires_at,
        )

        # Returns the completed value to the caller.
        return new_access_token, new_refresh_token

    # Removes refresh token.
    def revoke_refresh_token(
        self,
        db: Session,
        raw_token: str,
    ) -> None:
        # Stores token hash for the next steps.
        token_hash = self.hash_token(raw_token)

        # Stores token for the next steps.
        token = refresh_token_repository.get_by_token_hash(
            db,
            token_hash,
        )

        # Checks whether this condition is true.
        if token:
            refresh_token_repository.revoke(
                db,
                token,
            )

    # Removes all user tokens.
    def revoke_all_user_tokens(
        self,
        db: Session,
        user_id: UUID,
    ) -> None:
        refresh_token_repository.revoke_all_for_user(
            db,
            user_id,
        )


# Stores token service for the next steps.
token_service = TokenService()
