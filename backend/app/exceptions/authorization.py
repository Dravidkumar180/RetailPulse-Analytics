"""Authorization and tenant-access exceptions."""

from app.core.exceptions import AuthorizationException


class CrossCompanyAccessException(AuthorizationException):
    def __init__(self) -> None:
        super().__init__(
            detail=(
                "You cannot access data belonging to another company."
            ),
        )
        self.error_code = "CROSS_COMPANY_ACCESS_DENIED"


__all__ = [
    "AuthorizationException",
    "CrossCompanyAccessException",
]