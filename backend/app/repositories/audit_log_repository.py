# Teaching guide: This file contains audit log repository database access.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from datetime import UTC, datetime
# Imports the needed names from uuid.
from uuid import UUID

# Imports the needed names from sqlalchemy.
from sqlalchemy import select, update
# Imports the needed names from sqlalchemy.orm.
from sqlalchemy.orm import Session

# Imports the needed names from app.models.refresh_token.
from app.models.refresh_token import RefreshToken


# Groups refresh token repository behavior.
class RefreshTokenRepository:
    # Adds create.
    def create(
        self,
        db: Session,
        *,
        user_id: UUID,
        token_hash: str,
        token_id: str,
        expires_at: datetime,
    ) -> RefreshToken:
        # Stores record for the next steps.
        record = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            token_id=token_id,
            expires_at=expires_at,
        )

        # Applies this change to the database session.
        db.add(record)
        # Applies this change to the database session.
        db.flush()

        # Returns the completed value to the caller.
        return record

    # Gets by token hash.
    def get_by_token_hash(
        self,
        db: Session,
        token_hash: str,
    ) -> RefreshToken | None:
        # Returns the completed value to the caller.
        return db.scalar(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
            )
        )

    # Gets by token id.
    def get_by_token_id(
        self,
        db: Session,
        token_id: str,
    ) -> RefreshToken | None:
        # Returns the completed value to the caller.
        return db.scalar(
            select(RefreshToken).where(
                RefreshToken.token_id == token_id,
            )
        )

    # Removes revoke.
    def revoke(
        self,
        db: Session,
        token: RefreshToken,
        *,
        replaced_by_token_id: str | None = None,
    ) -> RefreshToken:
        # Checks whether this condition is true.
        if token.revoked_at is None:
            token.revoked_at = datetime.now(UTC)
            token.replaced_by_token_id = replaced_by_token_id
            # Applies this change to the database session.
            db.flush()

        # Returns the completed value to the caller.
        return token

    # Removes all for user.
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

    # Removes expired.
    def delete_expired(
        self,
        db: Session,
    ) -> int:
        # Imports the needed names from sqlalchemy.
        from sqlalchemy import delete

        # Stores result for the next steps.
        result = db.execute(
            delete(RefreshToken).where(
                RefreshToken.expires_at
                < datetime.now(UTC),
            )
        )

        # Returns the completed value to the caller.
        return int(result.rowcount or 0)


# Stores refresh token repository for the next steps.
refresh_token_repository = RefreshTokenRepository()