"""Domain-specific application exceptions."""

from app.exceptions.auth import (
    AccountInactiveException,
    AccountSuspendedException,
    AuthenticationException,
    ExpiredTokenException,
    InvalidCredentialsException,
    InvalidPasswordException,
    InvalidTokenException,
)
from app.exceptions.authorization import (
    AuthorizationException,
    CrossCompanyAccessException,
)
from app.exceptions.company import (
    CompanyAlreadyExistsException,
    CompanyNotFoundException,
)
from app.exceptions.user import (
    EmailAlreadyExistsException,
    UserNotFoundException,
)

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