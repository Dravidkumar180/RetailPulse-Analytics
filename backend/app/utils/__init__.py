"""Shared utility functions."""

from app.utils.datetime_utils import (
    ensure_utc,
    is_expired,
    utc_now,
)
from app.utils.password import (
    generate_temporary_password,
    hash_password,
    validate_password_strength,
    verify_password,
)
from app.utils.request_info import (
    RequestInformation,
    get_browser_name,
    get_client_ip,
    get_request_information,
)
from app.utils.tokens import (
    generate_secure_token,
    hash_token,
)
from app.utils.validators import (
    normalize_email,
    normalize_phone_number,
    validate_company_name,
)

__all__ = [
    "utc_now",
    "ensure_utc",
    "is_expired",
    "hash_password",
    "verify_password",
    "validate_password_strength",
    "generate_temporary_password",
    "generate_secure_token",
    "hash_token",
    "RequestInformation",
    "get_client_ip",
    "get_browser_name",
    "get_request_information",
    "normalize_email",
    "normalize_phone_number",
    "validate_company_name",
]