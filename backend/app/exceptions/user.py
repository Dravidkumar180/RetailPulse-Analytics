"""User-related exceptions."""

from app.core.exceptions import (
    EmailAlreadyExistsException,
    ResourceNotFoundException,
)


class UserNotFoundException(ResourceNotFoundException):
    def __init__(self) -> None:
        super().__init__("User")
        self.error_code = "USER_NOT_FOUND"


__all__ = [
    "EmailAlreadyExistsException",
    "UserNotFoundException",
]