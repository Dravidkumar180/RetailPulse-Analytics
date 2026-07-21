# Teaching guide: This file contains user application logic.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

"""User-related exceptions."""

# Imports the needed names from app.core.exceptions.
from app.core.exceptions import (
    EmailAlreadyExistsException,
    ResourceNotFoundException,
)


# Groups user not found exception behavior.
class UserNotFoundException(ResourceNotFoundException):
    def __init__(self) -> None:
        super().__init__("User")
        self.error_code = "USER_NOT_FOUND"


# Stores  all  for the next steps.
__all__ = [
    "EmailAlreadyExistsException",
    "UserNotFoundException",
]