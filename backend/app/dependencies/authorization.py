# Teaching guide: This file contains authorization shared dependencies.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from collections.abc import Callable
# Imports the needed names from enum.
from enum import StrEnum
# Imports the needed names from typing.
from typing import Annotated

# Imports the needed names from fastapi.
from fastapi import Depends

# Imports the needed names from app.core.constants.
from app.core.constants import UserRole
# Imports the needed names from app.core.exceptions.
from app.core.exceptions import AuthorizationException
# Imports the needed names from app.dependencies.auth.
from app.dependencies.auth import get_current_active_user
# Imports the needed names from app.models.user.
from app.models.user import User


# Groups permission behavior.
class Permission(StrEnum):
    # Stores view dashboard for the next steps.
    VIEW_DASHBOARD = "VIEW_DASHBOARD"
    # Stores view profile for the next steps.
    VIEW_PROFILE = "VIEW_PROFILE"

    # Stores view products for the next steps.
    VIEW_PRODUCTS = "VIEW_PRODUCTS"
    # Stores manage products for the next steps.
    MANAGE_PRODUCTS = "MANAGE_PRODUCTS"

    # Stores view sales for the next steps.
    VIEW_SALES = "VIEW_SALES"
    # Stores manage sales for the next steps.
    MANAGE_SALES = "MANAGE_SALES"

    # Stores view analytics for the next steps.
    VIEW_ANALYTICS = "VIEW_ANALYTICS"
    # Stores create analytics for the next steps.
    CREATE_ANALYTICS = "CREATE_ANALYTICS"

    # Stores view reports for the next steps.
    VIEW_REPORTS = "VIEW_REPORTS"

    # Stores manage users for the next steps.
    MANAGE_USERS = "MANAGE_USERS"
    # Stores view audit logs for the next steps.
    VIEW_AUDIT_LOGS = "VIEW_AUDIT_LOGS"
    # Stores manage companies for the next steps.
    MANAGE_COMPANIES = "MANAGE_COMPANIES"
    # Stores manage settings for the next steps.
    MANAGE_SETTINGS = "MANAGE_SETTINGS"


# Stores role permissions for the next steps.
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


# Runs normalize role logic.
def normalize_role(role: UserRole | str) -> UserRole:
    # Checks whether this condition is true.
    if isinstance(role, UserRole):
        # Returns the completed value to the caller.
        return role

    # Tries this work and watches for errors.
    try:
        # Returns the completed value to the caller.
        return UserRole(str(role))
    # Handles the error raised by the work above.
    except ValueError as exc:
        # Stops here and reports the problem.
        raise AuthorizationException(
            detail="The user account has an invalid role.",
        ) from exc


# Runs require roles logic.
def require_roles(
    *allowed_roles: UserRole,
) -> Callable[..., User]:
    # Stores allowed role set for the next steps.
    allowed_role_set = set(allowed_roles)

    # Runs dependency logic.
    def dependency(
        current_user: User = Depends(
            get_current_active_user,
        ),
    ) -> User:
        # Stores current role for the next steps.
        current_role = normalize_role(
            current_user.role,
        )

        # Checks whether this condition is true.
        if current_role not in allowed_role_set:
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
    return dependency


# Runs require permissions logic.
def require_permissions(
    *required_permissions: Permission,
    require_all: bool = True,
) -> Callable[..., User]:
    # Stores required permission set for the next steps.
    required_permission_set = set(required_permissions)

    # Runs dependency logic.
    def dependency(
        current_user: User = Depends(
            get_current_active_user,
        ),
    ) -> User:
        # Stores current role for the next steps.
        current_role = normalize_role(
            current_user.role,
        )

        # Stores granted permissions for the next steps.
        granted_permissions = ROLE_PERMISSIONS.get(
            current_role,
            set(),
        )

        # Checks whether this condition is true.
        if require_all:
            # Stores is allowed for the next steps.
            is_allowed = required_permission_set.issubset(
                granted_permissions,
            )
        # Runs when the earlier conditions are false.
        else:
            # Stores is allowed for the next steps.
            is_allowed = bool(
                required_permission_set
                & granted_permissions
            )

        # Checks whether this condition is true.
        if not is_allowed:
            # Stops here and reports the problem.
            raise AuthorizationException(
                detail=(
                    "Your account does not have the required "
                    "permission for this action."
                ),
            )

        # Returns the completed value to the caller.
        return current_user

    # Returns the completed value to the caller.
    return dependency


# Stores super admin only for the next steps.
SuperAdminOnly = Annotated[
    User,
    Depends(
        require_roles(
            UserRole.SUPER_ADMIN,
        ),
    ),
]

# Stores company admin or super admin for the next steps.
CompanyAdminOrSuperAdmin = Annotated[
    User,
    Depends(
        require_roles(
            UserRole.SUPER_ADMIN,
            UserRole.COMPANY_ADMIN,
        ),
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
        ),
    ),
]

# Stores audit log viewer for the next steps.
AuditLogViewer = Annotated[
    User,
    Depends(
        require_permissions(
            Permission.VIEW_AUDIT_LOGS,
        ),
    ),
]

# Stores user manager for the next steps.
UserManager = Annotated[
    User,
    Depends(
        require_permissions(
            Permission.MANAGE_USERS,
        ),
    ),
]