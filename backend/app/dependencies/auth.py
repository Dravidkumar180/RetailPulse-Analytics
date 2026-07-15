from typing import Annotated

from fastapi import Depends
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)
from sqlalchemy.orm import Session

from app.core.exceptions import AuthenticationException
from app.core.security import (
    get_current_active_user as core_get_current_active_user,
)
from app.core.security import (
    get_current_user as core_get_current_user,
)
from app.dependencies.database import DatabaseSession
from app.models.user import User


bearer_scheme = HTTPBearer(
    auto_error=False,
    scheme_name="JWT Bearer",
    description="Enter your JWT access token.",
)


def get_access_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme,
    ),
) -> str:
    if credentials is None:
        raise AuthenticationException(
            detail="Authentication credentials were not provided.",
        )

    if credentials.scheme.lower() != "bearer":
        raise AuthenticationException(
            detail="Only Bearer authentication is supported.",
        )

    if not credentials.credentials:
        raise AuthenticationException(
            detail="Access token is missing.",
        )

    return credentials.credentials


def get_current_user(
    db: DatabaseSession,
    access_token: str = Depends(get_access_token),
) -> User:
    """
    Authenticate the request and return the corresponding user.

    The core authentication function validates:
    - JWT signature;
    - token expiration;
    - token type;
    - user existence;
    - company ID consistency.
    """
    return core_get_current_user(
        token=access_token,
        db=db,
    )


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Return only active users.

    Suspended and inactive accounts are rejected.
    """
    return core_get_current_active_user(
        current_user=current_user,
    )


CurrentUser = Annotated[
    User,
    Depends(get_current_user),
]

CurrentActiveUser = Annotated[
    User,
    Depends(get_current_active_user),
]