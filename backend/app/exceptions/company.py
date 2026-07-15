"""Company-related exceptions."""

from app.core.exceptions import (
    CompanyAlreadyExistsException,
    ResourceNotFoundException,
)


class CompanyNotFoundException(ResourceNotFoundException):
    def __init__(self) -> None:
        super().__init__("Company")
        self.error_code = "COMPANY_NOT_FOUND"


__all__ = [
    "CompanyAlreadyExistsException",
    "CompanyNotFoundException",
]