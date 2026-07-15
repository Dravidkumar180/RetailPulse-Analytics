import hashlib
import hmac
import secrets
from typing import Any

from app.core.jwt import (
    create_access_token,
    create_password_reset_token,
    create_refresh_token,
    decode_access_token,
    decode_password_reset_token,
    decode_refresh_token,
)


def generate_secure_token(
    length: int = 48,
) -> str:
    if length < 16:
        raise ValueError(
            "Secure token length must be at least 16 bytes.",
        )

    return secrets.token_urlsafe(length)


def hash_token(token: str) -> str:
    return hashlib.sha256(
        token.encode("utf-8"),
    ).hexdigest()


def compare_token_hash(
    raw_token: str,
    stored_hash: str,
) -> bool:
    calculated_hash = hash_token(raw_token)

    return hmac.compare_digest(
        calculated_hash,
        stored_hash,
    )


def get_access_token_payload(
    token: str,
) -> dict[str, Any]:
    return decode_access_token(token)


def get_refresh_token_payload(
    token: str,
) -> dict[str, Any]:
    return decode_refresh_token(token)


def get_password_reset_payload(
    token: str,
) -> dict[str, Any]:
    return decode_password_reset_token(token)


__all__ = [
    "create_access_token",
    "create_refresh_token",
    "create_password_reset_token",
    "get_access_token_payload",
    "get_refresh_token_payload",
    "get_password_reset_payload",
    "generate_secure_token",
    "hash_token",
    "compare_token_hash",
]