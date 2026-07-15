import hashlib
import secrets
from datetime import datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import (
    ExpiredTokenException,
    InvalidTokenException,
)
from app.core.jwt import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
)
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.repositories.audit_log_repository import (
    refresh_token_repository,
)


class TokenService:
    @staticmethod
    def hash_token(token: str) -> str:
        return hashlib.sha256(
            token.encode("utf-8")
        ).hexdigest()

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

        return access_token, refresh_token

    def validate_refresh_token(
        self,
        db: Session,
        raw_token: str,
    ) -> tuple[dict[str, object], RefreshToken]:
        payload = decode_refresh_token(raw_token)
        token_hash = self.hash_token(raw_token)

        stored_token = (
            refresh_token_repository.get_by_token_hash(
                db,
                token_hash,
            )
        )

        if stored_token is None:
            raise InvalidTokenException(
                detail="Refresh token is not recognized.",
            )

        if stored_token.revoked_at is not None:
            raise InvalidTokenException(
                detail="Refresh token has been revoked.",
            )

        from datetime import UTC, datetime

        if stored_token.expires_at <= datetime.now(UTC):
            raise ExpiredTokenException()

        if stored_token.token_id != payload.get("jti"):
            raise InvalidTokenException(
                detail="Refresh token identifier is invalid.",
            )

        return payload, stored_token

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

        return new_access_token, new_refresh_token

    def revoke_refresh_token(
        self,
        db: Session,
        raw_token: str,
    ) -> None:
        token_hash = self.hash_token(raw_token)

        token = refresh_token_repository.get_by_token_hash(
            db,
            token_hash,
        )

        if token:
            refresh_token_repository.revoke(
                db,
                token,
            )

    def revoke_all_user_tokens(
        self,
        db: Session,
        user_id: UUID,
    ) -> None:
        refresh_token_repository.revoke_all_for_user(
            db,
            user_id,
        )


token_service = TokenService()
