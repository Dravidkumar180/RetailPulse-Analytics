# Teaching guide: This file contains company application logic.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

"""Company-related exceptions."""

# Imports the needed names from app.core.exceptions.
from app.core.exceptions import (
    CompanyAlreadyExistsException,
    ResourceNotFoundException,
)


# Groups company not found exception behavior.
class CompanyNotFoundException(ResourceNotFoundException):
    def __init__(self) -> None:
        super().__init__("Company")
        self.error_code = "COMPANY_NOT_FOUND"


# Stores  all  for the next steps.
__all__ = [
    "CompanyAlreadyExistsException",
    "CompanyNotFoundException",
]