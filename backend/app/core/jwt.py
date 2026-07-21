# Teaching guide: This file contains jwt application logic.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from datetime import UTC, datetime, timedelta
# Imports the needed names from typing.
from typing import Any
# Imports the needed names from uuid.
from uuid import uuid4

# Imports jwt for use below.
import jwt
# Imports the needed names from jwt.
from jwt import (
    ExpiredSignatureError,
    InvalidTokenError,
)

# Imports the needed names from app.core.config.
from app.core.config import settings
# Imports the needed names from app.core.constants.
from app.core.constants import (
    ACCESS_TOKEN_TYPE,
    PASSWORD_RESET_TOKEN_TYPE,
    REFRESH_TOKEN_TYPE,
)
# Imports the needed names from app.core.exceptions.
from app.core.exceptions import (
    ExpiredTokenException,
    InvalidTokenException,
)


# Runs utc now logic.
def utc_now() -> datetime:
    # Returns the completed value to the caller.
    return datetime.now(UTC)


# Adds token.
def create_token(
    *,
    subject: str,
    token_type: str,
    secret_key: str,
    expires_delta: timedelta,
    additional_claims: dict[str, Any] | None = None,
) -> tuple[str, datetime, str]:
    # Stores issued at for the next steps.
    issued_at = utc_now()
    # Stores expires at for the next steps.
    expires_at = issued_at + expires_delta
    # Stores token id for the next steps.
    token_id = str(uuid4())

    # Stores payload for the next steps.
    payload: dict[str, Any] = {
        "sub": subject,
        "type": token_type,
        "jti": token_id,
        "iat": issued_at,
        "exp": expires_at,
    }

    # Checks whether this condition is true.
    if additional_claims:
        payload.update(additional_claims)

    # Stores encoded token for the next steps.
    encoded_token = jwt.encode(
        payload,
        secret_key,
        algorithm=settings.JWT_ALGORITHM,
    )

    # Returns the completed value to the caller.
    return encoded_token, expires_at, token_id


# Adds access token.
def create_access_token(
    *,
    user_id: str,
    company_id: str | None,
    role: str,
) -> tuple[str, datetime, str]:
    # Returns the completed value to the caller.
    return create_token(
        subject=user_id,
        token_type=ACCESS_TOKEN_TYPE,
        secret_key=settings.JWT_SECRET_KEY.get_secret_value(),
        expires_delta=timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        ),
        additional_claims={
            "userId": user_id,
            "companyId": company_id,
            "role": role,
        },
    )


# Adds refresh token.
def create_refresh_token(
    *,
    user_id: str,
    company_id: str | None,
    role: str,
) -> tuple[str, datetime, str]:
    # Returns the completed value to the caller.
    return create_token(
        subject=user_id,
        token_type=REFRESH_TOKEN_TYPE,
        secret_key=settings.JWT_REFRESH_SECRET_KEY.get_secret_value(),
        expires_delta=timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS,
        ),
        additional_claims={
            "userId": user_id,
            "companyId": company_id,
            "role": role,
        },
    )


# Adds password reset token.
def create_password_reset_token(
    *,
    user_id: str,
    email: str,
) -> tuple[str, datetime, str]:
    # Returns the completed value to the caller.
    return create_token(
        subject=user_id,
        token_type=PASSWORD_RESET_TOKEN_TYPE,
        secret_key=settings.JWT_SECRET_KEY.get_secret_value(),
        expires_delta=timedelta(
            minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES,
        ),
        additional_claims={
            "email": email,
        },
    )


# Runs decode token logic.
def decode_token(
    token: str,
    *,
    expected_token_type: str,
) -> dict[str, Any]:
    # Stores secret key for the next steps.
    secret_key = (
        settings.JWT_REFRESH_SECRET_KEY.get_secret_value()
        if expected_token_type == REFRESH_TOKEN_TYPE
        else settings.JWT_SECRET_KEY.get_secret_value()
    )

    # Tries this work and watches for errors.
    try:
        # Stores payload for the next steps.
        payload = jwt.decode(
            token,
            secret_key,
            algorithms=[settings.JWT_ALGORITHM],
            options={
                "require": [
                    "sub",
                    "type",
                    "jti",
                    "iat",
                    "exp",
                ],
            },
        )
    # Handles the error raised by the work above.
    except ExpiredSignatureError as exc:
        # Stops here and reports the problem.
        raise ExpiredTokenException() from exc
    # Handles the error raised by the work above.
    except InvalidTokenError as exc:
        # Stops here and reports the problem.
        raise InvalidTokenException() from exc

    # Checks whether this condition is true.
    if payload.get("type") != expected_token_type:
        # Stops here and reports the problem.
        raise InvalidTokenException(
            detail="Unexpected token type.",
        )

    # Returns the completed value to the caller.
    return payload


# Runs decode access token logic.
def decode_access_token(
    token: str,
) -> dict[str, Any]:
    # Returns the completed value to the caller.
    return decode_token(
        token,
        expected_token_type=ACCESS_TOKEN_TYPE,
    )


# Runs decode refresh token logic.
def decode_refresh_token(
    token: str,
) -> dict[str, Any]:
    # Returns the completed value to the caller.
    return decode_token(
        token,
        expected_token_type=REFRESH_TOKEN_TYPE,
    )


# Runs decode password reset token logic.
def decode_password_reset_token(
    token: str,
) -> dict[str, Any]:
    # Returns the completed value to the caller.
    return decode_token(
        token,
        expected_token_type=PASSWORD_RESET_TOKEN_TYPE,
    )