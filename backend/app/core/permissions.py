# Teaching guide: This file contains permissions application logic.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from collections.abc import Callable
# Imports the needed names from typing.
from typing import Annotated

# Imports the needed names from fastapi.
from fastapi import Depends

# Imports the needed names from app.core.constants.
from app.core.constants import UserRole
# Imports the needed names from app.core.exceptions.
from app.core.exceptions import AuthorizationException
# Imports the needed names from app.core.security.
from app.core.security import get_current_active_user
# Imports the needed names from app.models.user.
from app.models.user import User


# Runs require roles logic.
def require_roles(
    *allowed_roles: UserRole,
) -> Callable[..., User]:
    # Stores allowed role values for the next steps.
    allowed_role_values = {
        role.value
        for role in allowed_roles
    }

    # Runs role dependency logic.
    def role_dependency(
        current_user: User = Depends(
            get_current_active_user
        ),
    ) -> User:
        # Stores current role for the next steps.
        current_role = (
            current_user.role.value
            if isinstance(current_user.role, UserRole)
            else str(current_user.role)
        )

        # Checks whether this condition is true.
        if current_role not in allowed_role_values:
            # Stops here and reports the problem.
            raise AuthorizationException(
                detail=(
                    "Your account role does not have permission "
                    "to perform this action."
                ),
            )

        # Returns the completed value to the caller.
        return current_user

    # Returns the completed value to the caller.
    return role_dependency


# Stores super admin only for the next steps.
SuperAdminOnly = Annotated[
    User,
    Depends(
        require_roles(
            UserRole.SUPER_ADMIN,
        )
    ),
]

# Stores company admin or super admin for the next steps.
CompanyAdminOrSuperAdmin = Annotated[
    User,
    Depends(
        require_roles(
            UserRole.SUPER_ADMIN,
            UserRole.COMPANY_ADMIN,
        )
    ),
]

# Stores analyst or higher for the next steps.
AnalystOrHigher = Annotated[
    User,
    Depends(
        require_roles(
            UserRole.SUPER_ADMIN,
            UserRole.COMPANY_ADMIN,
            UserRole.ANALYST,
        )
    ),
]

# Stores all authenticated roles for the next steps.
AllAuthenticatedRoles = Annotated[
    User,
    Depends(
        require_roles(
            UserRole.SUPER_ADMIN,
            UserRole.COMPANY_ADMIN,
            UserRole.ANALYST,
            UserRole.VIEWER,
        )
    ),
]


# Runs enforce same company logic.
def enforce_same_company(
    *,
    current_user: User,
    resource_company_id: str,
) -> None:
    """
    Prevent access to a resource belonging to another company.

    Super Admin cross-company access should be allowed only through
    intentionally designed administrative endpoints.
    """
    # Checks whether this condition is true.
    if current_user.role == UserRole.SUPER_ADMIN:
        # Returns the completed value to the caller.
        return

    # Checks whether this condition is true.
    if str(current_user.company_id) != str(resource_company_id):
        # Stops here and reports the problem.
        raise AuthorizationException(
            detail=(
                "You cannot access data belonging to another company."
            ),
        )