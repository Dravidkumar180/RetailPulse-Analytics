# Teaching guide: This file contains  init  application logic.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

"""Domain-specific application exceptions."""

# Imports the needed names from app.exceptions.auth.
from app.exceptions.auth import (
    AccountInactiveException,
    AccountSuspendedException,
    AuthenticationException,
    ExpiredTokenException,
    InvalidCredentialsException,
    InvalidPasswordException,
    InvalidTokenException,
)
# Imports the needed names from app.exceptions.authorization.
from app.exceptions.authorization import (
    AuthorizationException,
    CrossCompanyAccessException,
)
# Imports the needed names from app.exceptions.company.
from app.exceptions.company import (
    CompanyAlreadyExistsException,
    CompanyNotFoundException,
)
# Imports the needed names from app.exceptions.user.
from app.exceptions.user import (
    EmailAlreadyExistsException,
    UserNotFoundException,
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
    "AuthorizationException",
    "CrossCompanyAccessException",
    "CompanyAlreadyExistsException",
    "CompanyNotFoundException",
    "EmailAlreadyExistsException",
    "UserNotFoundException",
]