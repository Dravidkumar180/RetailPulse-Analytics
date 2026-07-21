# Teaching guide: This file contains authorization application logic.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

"""Authorization and tenant-access exceptions."""

# Imports the needed names from app.core.exceptions.
from app.core.exceptions import AuthorizationException


# Groups cross company access exception behavior.
class CrossCompanyAccessException(AuthorizationException):
    def __init__(self) -> None:
        super().__init__(
            detail=(
                "You cannot access data belonging to another company."
            ),
        )
        self.error_code = "CROSS_COMPANY_ACCESS_DENIED"


# Stores  all  for the next steps.
__all__ = [
    "AuthorizationException",
    "CrossCompanyAccessException",
]