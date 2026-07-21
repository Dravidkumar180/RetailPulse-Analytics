# Teaching guide: This file contains tenant shared dependencies.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from dataclasses import dataclass
# Imports the needed names from typing.
from typing import Annotated
# Imports the needed names from uuid.
from uuid import UUID

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


# Groups tenant data behavior.
@dataclass(frozen=True, slots=True)
class TenantData:
    company_id: UUID
    user_id: UUID
    role: UserRole
    is_super_admin: bool


# Gets current company id.
def get_current_company_id(
    current_user: User = Depends(
        get_current_active_user,
    ),
) -> UUID:
    """
    Return the company ID of the authenticated user.

    Normal company-specific endpoints should use this value instead
    of accepting companyId from request query parameters.
    """
    # Checks whether this condition is true.
    if current_user.company_id is None:
        # Stops here and reports the problem.
        raise AuthorizationException(
            detail=(
                "The authenticated account is not linked "
                "to a company."
            ),
        )

    # Returns the completed value to the caller.
    return current_user.company_id


# Gets tenant context.
def get_tenant_context(
    current_user: User = Depends(
        get_current_active_user,
    ),
) -> TenantData:
    # Tries this work and watches for errors.
    try:
        # Stores role for the next steps.
        role = (
            current_user.role
            if isinstance(current_user.role, UserRole)
            else UserRole(str(current_user.role))
        )
    # Handles the error raised by the work above.
    except ValueError as exc:
        # Stops here and reports the problem.
        raise AuthorizationException(
            detail="The authenticated user has an invalid role.",
        ) from exc

    # Checks whether this condition is true.
    if current_user.company_id is None:
        # Stops here and reports the problem.
        raise AuthorizationException(
            detail="The user is not associated with a company.",
        )

    # Returns the completed value to the caller.
    return TenantData(
        company_id=current_user.company_id,
        user_id=current_user.id,
        role=role,
        is_super_admin=role == UserRole.SUPER_ADMIN,
    )


# Runs enforce tenant access logic.
def enforce_tenant_access(
    *,
    tenant: TenantData,
    resource_company_id: UUID,
    allow_super_admin: bool = False,
) -> None:
    """
    Verify that a resource belongs to the authenticated tenant.

    Super Admin access is allowed only when an endpoint explicitly
    passes allow_super_admin=True.
    """
    # Checks whether this condition is true.
    if allow_super_admin and tenant.is_super_admin:
        # Returns the completed value to the caller.
        return

    # Checks whether this condition is true.
    if tenant.company_id != resource_company_id:
        # Stops here and reports the problem.
        raise AuthorizationException(
            detail=(
                "You cannot access data belonging to "
                "another company."
            ),
        )


# Runs ensure same company logic.
def ensure_same_company(
    current_user: User,
    resource_company_id: UUID,
) -> None:
    # Checks whether this condition is true.
    if current_user.company_id != resource_company_id:
        # Stops here and reports the problem.
        raise AuthorizationException(
            detail=(
                "Cross-company access is not allowed."
            ),
        )


# Stores current company id for the next steps.
CurrentCompanyId = Annotated[
    UUID,
    Depends(get_current_company_id),
]

# Stores tenant context for the next steps.
TenantContext = Annotated[
    TenantData,
    Depends(get_tenant_context),
]