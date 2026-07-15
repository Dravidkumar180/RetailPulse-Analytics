from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import uuid4

import jwt
from jwt import (
    ExpiredSignatureError,
    InvalidTokenError,
)

from app.core.config import settings
from app.core.constants import (
    ACCESS_TOKEN_TYPE,
    PASSWORD_RESET_TOKEN_TYPE,
    REFRESH_TOKEN_TYPE,
)
from app.core.exceptions import (
    ExpiredTokenException,
    InvalidTokenException,
)


def utc_now() -> datetime:
    return datetime.now(UTC)


def create_token(
    *,
    subject: str,
    token_type: str,
    secret_key: str,
    expires_delta: timedelta,
    additional_claims: dict[str, Any] | None = None,
) -> tuple[str, datetime, str]:
    issued_at = utc_now()
    expires_at = issued_at + expires_delta
    token_id = str(uuid4())

    payload: dict[str, Any] = {
        "sub": subject,
        "type": token_type,
        "jti": token_id,
        "iat": issued_at,
        "exp": expires_at,
    }

    if additional_claims:
        payload.update(additional_claims)

    encoded_token = jwt.encode(
        payload,
        secret_key,
        algorithm=settings.JWT_ALGORITHM,
    )

    return encoded_token, expires_at, token_id


def create_access_token(
    *,
    user_id: str,
    company_id: str | None,
    role: str,
) -> tuple[str, datetime, str]:
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


def create_refresh_token(
    *,
    user_id: str,
    company_id: str | None,
    role: str,
) -> tuple[str, datetime, str]:
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


def create_password_reset_token(
    *,
    user_id: str,
    email: str,
) -> tuple[str, datetime, str]:
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


def decode_token(
    token: str,
    *,
    expected_token_type: str,
) -> dict[str, Any]:
    secret_key = (
        settings.JWT_REFRESH_SECRET_KEY.get_secret_value()
        if expected_token_type == REFRESH_TOKEN_TYPE
        else settings.JWT_SECRET_KEY.get_secret_value()
    )

    try:
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
    except ExpiredSignatureError as exc:
        raise ExpiredTokenException() from exc
    except InvalidTokenError as exc:
        raise InvalidTokenException() from exc

    if payload.get("type") != expected_token_type:
        raise InvalidTokenException(
            detail="Unexpected token type.",
        )

    return payload


def decode_access_token(
    token: str,
) -> dict[str, Any]:
    return decode_token(
        token,
        expected_token_type=ACCESS_TOKEN_TYPE,
    )


def decode_refresh_token(
    token: str,
) -> dict[str, Any]:
    return decode_token(
        token,
        expected_token_type=REFRESH_TOKEN_TYPE,
    )


def decode_password_reset_token(
    token: str,
) -> dict[str, Any]:
    return decode_token(
        token,
        expected_token_type=PASSWORD_RESET_TOKEN_TYPE,
    )