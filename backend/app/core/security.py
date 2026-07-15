from typing import Annotated
from uuid import UUID

import bcrypt
from fastapi import Depends
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.constants import (
    MAX_PASSWORD_LENGTH,
    UserStatus,
)
from app.core.database import get_db
from app.core.exceptions import (
    AccountInactiveException,
    AccountSuspendedException,
    AuthenticationException,
    InvalidTokenException,
)
from app.core.jwt import decode_access_token
from app.models.user import User


bearer_scheme = HTTPBearer(
    auto_error=False,
    scheme_name="JWT Bearer",
    description="Enter the JWT access token.",
)


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.

    bcrypt accepts at most 72 bytes, so validation is performed before
    hashing instead of silently truncating the value.
    """
    password_bytes = password.encode("utf-8")

    if len(password_bytes) > MAX_PASSWORD_LENGTH:
        raise ValueError(
            "Password must not exceed 72 UTF-8 bytes."
        )

    salt = bcrypt.gensalt(rounds=12)

    return bcrypt.hashpw(
        password_bytes,
        salt,
    ).decode("utf-8")


def verify_password(
    plain_password: str,
    password_hash: str,
) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            password_hash.encode("utf-8"),
        )
    except (ValueError, TypeError):
        return False


def get_bearer_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    ),
) -> str:
    if (
        credentials is None
        or credentials.scheme.lower() != "bearer"
    ):
        raise AuthenticationException(
            detail="Authentication credentials were not provided.",
        )

    return credentials.credentials


def get_current_user(
    token: str = Depends(get_bearer_token),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_access_token(token)

    user_id = payload.get("sub")

    if not isinstance(user_id, str) or not user_id:
        raise InvalidTokenException(
            detail="Token does not contain a valid user identifier.",
        )

    try:
        parsed_user_id = UUID(user_id)
    except ValueError as exc:
        raise InvalidTokenException(
            detail="Token contains an invalid user identifier.",
        ) from exc

    user = db.scalar(
        select(User).where(User.id == parsed_user_id)
    )

    if user is None:
        raise AuthenticationException(
            detail="Authenticated user no longer exists.",
        )

    token_company_id = payload.get("companyId")

    if str(user.company_id) != str(token_company_id):
        raise AuthenticationException(
            detail="Token company does not match the user account.",
        )

    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.status == UserStatus.SUSPENDED:
        raise AccountSuspendedException()

    if current_user.status != UserStatus.ACTIVE:
        raise AccountInactiveException()

    return current_user


CurrentUser = Annotated[
    User,
    Depends(get_current_user),
]

CurrentActiveUser = Annotated[
    User,
    Depends(get_current_active_user),
]
