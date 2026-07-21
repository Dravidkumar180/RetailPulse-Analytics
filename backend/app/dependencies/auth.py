# Teaching guide: This file contains auth shared dependencies.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from typing import Annotated

# Imports the needed names from fastapi.
from fastapi import Depends
# Imports the needed names from fastapi.security.
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)
# Imports the needed names from sqlalchemy.orm.
from sqlalchemy.orm import Session

# Imports the needed names from app.core.exceptions.
from app.core.exceptions import AuthenticationException
# Imports the needed names from app.core.security.
from app.core.security import (
    get_current_active_user as core_get_current_active_user,
)
# Imports the needed names from app.core.security.
from app.core.security import (
    get_current_user as core_get_current_user,
)
# Imports the needed names from app.dependencies.database.
from app.dependencies.database import DatabaseSession
# Imports the needed names from app.models.user.
from app.models.user import User


# Stores bearer scheme for the next steps.
bearer_scheme = HTTPBearer(
    auto_error=False,
    scheme_name="JWT Bearer",
    description="Enter your JWT access token.",
)


# Gets access token.
def get_access_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme,
    ),
) -> str:
    # Checks whether this condition is true.
    if credentials is None:
        # Stops here and reports the problem.
        raise AuthenticationException(
            detail="Authentication credentials were not provided.",
        )

    # Checks whether this condition is true.
    if credentials.scheme.lower() != "bearer":
        # Stops here and reports the problem.
        raise AuthenticationException(
            detail="Only Bearer authentication is supported.",
        )

    # Checks whether this condition is true.
    if not credentials.credentials:
        # Stops here and reports the problem.
        raise AuthenticationException(
            detail="Access token is missing.",
        )

    # Returns the completed value to the caller.
    return credentials.credentials


# Gets current user.
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
    # Returns the completed value to the caller.
    return core_get_current_user(
        token=access_token,
        db=db,
    )


# Gets current active user.
def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Return only active users.

    Suspended and inactive accounts are rejected.
    """
    # Returns the completed value to the caller.
    return core_get_current_active_user(
        current_user=current_user,
    )


# Stores current user for the next steps.
CurrentUser = Annotated[
    User,
    Depends(get_current_user),
]

# Stores current active user for the next steps.
CurrentActiveUser = Annotated[
    User,
    Depends(get_current_active_user),
]