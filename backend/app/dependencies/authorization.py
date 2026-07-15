from collections.abc import Callable
from enum import StrEnum
from typing import Annotated

from fastapi import Depends

from app.core.constants import UserRole
from app.core.exceptions import AuthorizationException
from app.dependencies.auth import get_current_active_user
from app.models.user import User


class Permission(StrEnum):
    VIEW_DASHBOARD = "VIEW_DASHBOARD"
    VIEW_PROFILE = "VIEW_PROFILE"

    VIEW_PRODUCTS = "VIEW_PRODUCTS"
    MANAGE_PRODUCTS = "MANAGE_PRODUCTS"

    VIEW_SALES = "VIEW_SALES"
    MANAGE_SALES = "MANAGE_SALES"

    VIEW_ANALYTICS = "VIEW_ANALYTICS"
    CREATE_ANALYTICS = "CREATE_ANALYTICS"

    VIEW_REPORTS = "VIEW_REPORTS"

    MANAGE_USERS = "MANAGE_USERS"
    VIEW_AUDIT_LOGS = "VIEW_AUDIT_LOGS"
    MANAGE_COMPANIES = "MANAGE_COMPANIES"
    MANAGE_SETTINGS = "MANAGE_SETTINGS"


ROLE_PERMISSIONS: dict[UserRole, set[Permission]] = {
    UserRole.SUPER_ADMIN: {
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_PROFILE,
        Permission.VIEW_PRODUCTS,
        Permission.MANAGE_PRODUCTS,
        Permission.VIEW_SALES,
        Permission.MANAGE_SALES,
        Permission.VIEW_ANALYTICS,
        Permission.CREATE_ANALYTICS,
        Permission.VIEW_REPORTS,
        Permission.MANAGE_USERS,
        Permission.VIEW_AUDIT_LOGS,
        Permission.MANAGE_COMPANIES,
        Permission.MANAGE_SETTINGS,
    },
    UserRole.COMPANY_ADMIN: {
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_PROFILE,
        Permission.VIEW_PRODUCTS,
        Permission.MANAGE_PRODUCTS,
        Permission.VIEW_SALES,
        Permission.MANAGE_SALES,
        Permission.VIEW_ANALYTICS,
        Permission.CREATE_ANALYTICS,
        Permission.VIEW_REPORTS,
        Permission.MANAGE_USERS,
        Permission.VIEW_AUDIT_LOGS,
        Permission.MANAGE_SETTINGS,
    },
    UserRole.ANALYST: {
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_PROFILE,
        Permission.VIEW_PRODUCTS,
        Permission.VIEW_SALES,
        Permission.VIEW_ANALYTICS,
        Permission.CREATE_ANALYTICS,
        Permission.VIEW_REPORTS,
    },
    UserRole.VIEWER: {
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_PROFILE,
        Permission.VIEW_PRODUCTS,
        Permission.VIEW_SALES,
        Permission.VIEW_ANALYTICS,
        Permission.VIEW_REPORTS,
    },
}


def normalize_role(role: UserRole | str) -> UserRole:
    if isinstance(role, UserRole):
        return role

    try:
        return UserRole(str(role))
    except ValueError as exc:
        raise AuthorizationException(
            detail="The user account has an invalid role.",
        ) from exc


def require_roles(
    *allowed_roles: UserRole,
) -> Callable[..., User]:
    allowed_role_set = set(allowed_roles)

    def dependency(
        current_user: User = Depends(
            get_current_active_user,
        ),
    ) -> User:
        current_role = normalize_role(
            current_user.role,
        )

        if current_role not in allowed_role_set:
            raise AuthorizationException(
                detail=(
                    "Your account role does not have permission "
                    "to perform this action."
                ),
            )

        return current_user

    return dependency


def require_permissions(
    *required_permissions: Permission,
    require_all: bool = True,
) -> Callable[..., User]:
    required_permission_set = set(required_permissions)

    def dependency(
        current_user: User = Depends(
            get_current_active_user,
        ),
    ) -> User:
        current_role = normalize_role(
            current_user.role,
        )

        granted_permissions = ROLE_PERMISSIONS.get(
            current_role,
            set(),
        )

        if require_all:
            is_allowed = required_permission_set.issubset(
                granted_permissions,
            )
        else:
            is_allowed = bool(
                required_permission_set
                & granted_permissions
            )

        if not is_allowed:
            raise AuthorizationException(
                detail=(
                    "Your account does not have the required "
                    "permission for this action."
                ),
            )

        return current_user

    return dependency


SuperAdminOnly = Annotated[
    User,
    Depends(
        require_roles(
            UserRole.SUPER_ADMIN,
        ),
    ),
]

CompanyAdminOrSuperAdmin = Annotated[
    User,
    Depends(
        require_roles(
            UserRole.SUPER_ADMIN,
            UserRole.COMPANY_ADMIN,
        ),
    ),
]

AnalystOrHigher = Annotated[
    User,
    Depends(
        require_roles(
            UserRole.SUPER_ADMIN,
            UserRole.COMPANY_ADMIN,
            UserRole.ANALYST,
        ),
    ),
]

AuditLogViewer = Annotated[
    User,
    Depends(
        require_permissions(
            Permission.VIEW_AUDIT_LOGS,
        ),
    ),
]

UserManager = Annotated[
    User,
    Depends(
        require_permissions(
            Permission.MANAGE_USERS,
        ),
    ),
]