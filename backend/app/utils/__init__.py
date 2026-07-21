# Teaching guide: This file contains  init  helper logic.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

"""Shared utility functions."""

# Imports the needed names from app.utils.datetime_utils.
from app.utils.datetime_utils import (
    ensure_utc,
    is_expired,
    utc_now,
)
# Imports the needed names from app.utils.password.
from app.utils.password import (
    generate_temporary_password,
    hash_password,
    validate_password_strength,
    verify_password,
)
# Imports the needed names from app.utils.request_info.
from app.utils.request_info import (
    RequestInformation,
    get_browser_name,
    get_client_ip,
    get_request_information,
)
# Imports the needed names from app.utils.tokens.
from app.utils.tokens import (
    generate_secure_token,
    hash_token,
)
# Imports the needed names from app.utils.validators.
from app.utils.validators import (
    normalize_email,
    normalize_phone_number,
    validate_company_name,
)

# Stores  all  for the next steps.
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