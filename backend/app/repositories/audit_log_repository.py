from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.models.refresh_token import RefreshToken


class RefreshTokenRepository:
    def create(
        self,
        db: Session,
        *,
        user_id: UUID,
        token_hash: str,
        token_id: str,
        expires_at: datetime,
    ) -> RefreshToken:
        record = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            token_id=token_id,
            expires_at=expires_at,
        )

        db.add(record)
        db.flush()

        return record

    def get_by_token_hash(
        self,
        db: Session,
        token_hash: str,
    ) -> RefreshToken | None:
        return db.scalar(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
            )
        )

    def get_by_token_id(
        self,
        db: Session,
        token_id: str,
    ) -> RefreshToken | None:
        return db.scalar(
            select(RefreshToken).where(
                RefreshToken.token_id == token_id,
            )
        )

    def revoke(
        self,
        db: Session,
        token: RefreshToken,
        *,
        replaced_by_token_id: str | None = None,
    ) -> RefreshToken:
        if token.revoked_at is None:
            token.revoked_at = datetime.now(UTC)
            token.replaced_by_token_id = replaced_by_token_id
            db.flush()

        return token

    def revoke_all_for_user(
        self,
        db: Session,
        user_id: UUID,
    ) -> None:
        db.execute(
            update(RefreshToken)
            .where(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked_at.is_(None),
            )
            .values(
                revoked_at=datetime.now(UTC),
            )
        )

    def delete_expired(
        self,
        db: Session,
    ) -> int:
        from sqlalchemy import delete

        result = db.execute(
            delete(RefreshToken).where(
                RefreshToken.expires_at
                < datetime.now(UTC),
            )
        )

        return int(result.rowcount or 0)


refresh_token_repository = RefreshTokenRepository()