from collections.abc import Callable
from typing import Annotated

from fastapi import Depends

from app.core.constants import UserRole
from app.core.exceptions import AuthorizationException
from app.core.security import get_current_active_user
from app.models.user import User


def require_roles(
    *allowed_roles: UserRole,
) -> Callable[..., User]:
    allowed_role_values = {
        role.value
        for role in allowed_roles
    }

    def role_dependency(
        current_user: User = Depends(
            get_current_active_user
        ),
    ) -> User:
        current_role = (
            current_user.role.value
            if isinstance(current_user.role, UserRole)
            else str(current_user.role)
        )

        if current_role not in allowed_role_values:
            raise AuthorizationException(
                detail=(
                    "Your account role does not have permission "
                    "to perform this action."
                ),
            )

        return current_user

    return role_dependency


SuperAdminOnly = Annotated[
    User,
    Depends(
        require_roles(
            UserRole.SUPER_ADMIN,
        )
    ),
]

CompanyAdminOrSuperAdmin = Annotated[
    User,
    Depends(
        require_roles(
            UserRole.SUPER_ADMIN,
            UserRole.COMPANY_ADMIN,
        )
    ),
]

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
    if current_user.role == UserRole.SUPER_ADMIN:
        return

    if str(current_user.company_id) != str(resource_company_id):
        raise AuthorizationException(
            detail=(
                "You cannot access data belonging to another company."
            ),
        )