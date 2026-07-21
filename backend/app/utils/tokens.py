# Teaching guide: This file contains tokens helper logic.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

import hashlib
# Imports hmac for use below.
import hmac
# Imports secrets for use below.
import secrets
# Imports the needed names from typing.
from typing import Any

# Imports the needed names from app.core.jwt.
from app.core.jwt import (
    create_access_token,
    create_password_reset_token,
    create_refresh_token,
    decode_access_token,
    decode_password_reset_token,
    decode_refresh_token,
)


# Runs generate secure token logic.
def generate_secure_token(
    length: int = 48,
) -> str:
    # Checks whether this condition is true.
    if length < 16:
        # Stops here and reports the problem.
        raise ValueError(
            "Secure token length must be at least 16 bytes.",
        )

    # Returns the completed value to the caller.
    return secrets.token_urlsafe(length)


# Checks hash token.
def hash_token(token: str) -> str:
    # Returns the completed value to the caller.
    return hashlib.sha256(
        token.encode("utf-8"),
    ).hexdigest()


# Runs compare token hash logic.
def compare_token_hash(
    raw_token: str,
    stored_hash: str,
) -> bool:
    # Stores calculated hash for the next steps.
    calculated_hash = hash_token(raw_token)

    # Returns the completed value to the caller.
    return hmac.compare_digest(
        calculated_hash,
        stored_hash,
    )


# Gets access token payload.
def get_access_token_payload(
    token: str,
) -> dict[str, Any]:
    # Returns the completed value to the caller.
    return decode_access_token(token)


# Gets refresh token payload.
def get_refresh_token_payload(
    token: str,
) -> dict[str, Any]:
    # Returns the completed value to the caller.
    return decode_refresh_token(token)


# Gets password reset payload.
def get_password_reset_payload(
    token: str,
) -> dict[str, Any]:
    # Returns the completed value to the caller.
    return decode_password_reset_token(token)


# Stores  all  for the next steps.
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