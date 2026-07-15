from dataclasses import dataclass
from typing import Annotated
from uuid import UUID

from fastapi import Depends

from app.core.constants import UserRole
from app.core.exceptions import AuthorizationException
from app.dependencies.auth import get_current_active_user
from app.models.user import User


@dataclass(frozen=True, slots=True)
class TenantData:
    company_id: UUID
    user_id: UUID
    role: UserRole
    is_super_admin: bool


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
    if current_user.company_id is None:
        raise AuthorizationException(
            detail=(
                "The authenticated account is not linked "
                "to a company."
            ),
        )

    return current_user.company_id


def get_tenant_context(
    current_user: User = Depends(
        get_current_active_user,
    ),
) -> TenantData:
    try:
        role = (
            current_user.role
            if isinstance(current_user.role, UserRole)
            else UserRole(str(current_user.role))
        )
    except ValueError as exc:
        raise AuthorizationException(
            detail="The authenticated user has an invalid role.",
        ) from exc

    if current_user.company_id is None:
        raise AuthorizationException(
            detail="The user is not associated with a company.",
        )

    return TenantData(
        company_id=current_user.company_id,
        user_id=current_user.id,
        role=role,
        is_super_admin=role == UserRole.SUPER_ADMIN,
    )


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
    if allow_super_admin and tenant.is_super_admin:
        return

    if tenant.company_id != resource_company_id:
        raise AuthorizationException(
            detail=(
                "You cannot access data belonging to "
                "another company."
            ),
        )


def ensure_same_company(
    current_user: User,
    resource_company_id: UUID,
) -> None:
    if current_user.company_id != resource_company_id:
        raise AuthorizationException(
            detail=(
                "Cross-company access is not allowed."
            ),
        )


CurrentCompanyId = Annotated[
    UUID,
    Depends(get_current_company_id),
]

TenantContext = Annotated[
    TenantData,
    Depends(get_tenant_context),
]