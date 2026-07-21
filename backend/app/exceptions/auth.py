# Teaching guide: This file contains auth application logic.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

"""Authentication-related exceptions."""

# Imports the needed names from app.core.exceptions.
from app.core.exceptions import (
    AccountInactiveException,
    AccountSuspendedException,
    AuthenticationException,
    ExpiredTokenException,
    InvalidCredentialsException,
    InvalidPasswordException,
    InvalidTokenException,
)

# Stores  all  for the next steps.
__all__ = [
    "AuthenticationException",
    "InvalidCredentialsException",
    "InvalidTokenException",
    "ExpiredTokenException",
    "InvalidPasswordException",
    "AccountInactiveException",
    "AccountSuspendedException",
]