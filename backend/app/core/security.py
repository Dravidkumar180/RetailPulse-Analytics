# Teaching guide: This file contains security application logic.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from typing import Annotated
# Imports the needed names from uuid.
from uuid import UUID

# Imports bcrypt for use below.
import bcrypt
# Imports the needed names from fastapi.
from fastapi import Depends
# Imports the needed names from fastapi.security.
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)
# Imports the needed names from sqlalchemy.
from sqlalchemy import select
# Imports the needed names from sqlalchemy.orm.
from sqlalchemy.orm import Session

# Imports the needed names from app.core.constants.
from app.core.constants import (
    MAX_PASSWORD_LENGTH,
    UserStatus,
)
# Imports the needed names from app.core.database.
from app.core.database import get_db
# Imports the needed names from app.core.exceptions.
from app.core.exceptions import (
    AccountInactiveException,
    AccountSuspendedException,
    AuthenticationException,
    InvalidTokenException,
)
# Imports the needed names from app.core.jwt.
from app.core.jwt import decode_access_token
# Imports the needed names from app.models.user.
from app.models.user import User


# Stores bearer scheme for the next steps.
bearer_scheme = HTTPBearer(
    auto_error=False,
    scheme_name="JWT Bearer",
    description="Enter the JWT access token.",
)


# Checks hash password.
def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.

    bcrypt accepts at most 72 bytes, so validation is performed before
    hashing instead of silently truncating the value.
    """
    # Stores password bytes for the next steps.
    password_bytes = password.encode("utf-8")

    # Checks whether this condition is true.
    if len(password_bytes) > MAX_PASSWORD_LENGTH:
        # Stops here and reports the problem.
        raise ValueError(
            "Password must not exceed 72 UTF-8 bytes."
        )

    # Stores salt for the next steps.
    salt = bcrypt.gensalt(rounds=12)

    # Returns the completed value to the caller.
    return bcrypt.hashpw(
        password_bytes,
        salt,
    ).decode("utf-8")


# Checks password.
def verify_password(
    plain_password: str,
    password_hash: str,
) -> bool:
    # Tries this work and watches for errors.
    try:
        # Returns the completed value to the caller.
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            password_hash.encode("utf-8"),
        )
    # Handles the error raised by the work above.
    except (ValueError, TypeError):
        # Returns the completed value to the caller.
        return False


# Gets bearer token.
def get_bearer_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    ),
) -> str:
    # Checks whether this condition is true.
    if (
        credentials is None
        or credentials.scheme.lower() != "bearer"
    ):
        # Stops here and reports the problem.
        raise AuthenticationException(
            detail="Authentication credentials were not provided.",
        )

    # Returns the completed value to the caller.
    return credentials.credentials


# Gets current user.
def get_current_user(
    token: str = Depends(get_bearer_token),
    db: Session = Depends(get_db),
) -> User:
    # Stores payload for the next steps.
    payload = decode_access_token(token)

    # Stores user id for the next steps.
    user_id = payload.get("sub")

    # Checks whether this condition is true.
    if not isinstance(user_id, str) or not user_id:
        # Stops here and reports the problem.
        raise InvalidTokenException(
            detail="Token does not contain a valid user identifier.",
        )

    # Tries this work and watches for errors.
    try:
        # Stores parsed user id for the next steps.
        parsed_user_id = UUID(user_id)
    # Handles the error raised by the work above.
    except ValueError as exc:
        # Stops here and reports the problem.
        raise InvalidTokenException(
            detail="Token contains an invalid user identifier.",
        ) from exc

    # Stores user for the next steps.
    user = db.scalar(
        select(User).where(User.id == parsed_user_id)
    )

    # Checks whether this condition is true.
    if user is None:
        # Stops here and reports the problem.
        raise AuthenticationException(
            detail="Authenticated user no longer exists.",
        )

    # Stores token company id for the next steps.
    token_company_id = payload.get("companyId")

    # Checks whether this condition is true.
    if str(user.company_id) != str(token_company_id):
        # Stops here and reports the problem.
        raise AuthenticationException(
            detail="Token company does not match the user account.",
        )

    # Returns the completed value to the caller.
    return user


# Gets current active user.
def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    # Checks whether this condition is true.
    if current_user.status == UserStatus.SUSPENDED:
        # Stops here and reports the problem.
        raise AccountSuspendedException()

    # Checks whether this condition is true.
    if current_user.status != UserStatus.ACTIVE:
        # Stops here and reports the problem.
        raise AccountInactiveException()

    # Returns the completed value to the caller.
    return current_user


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
