# Teaching guide: This file contains API requests and responses for users.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from typing import Annotated

# Imports the needed names from fastapi.
from fastapi import APIRouter, Query, status

# Imports the needed names from app.api.dependencies.
from app.api.dependencies import DatabaseSession
# Imports the needed names from app.core.constants.
from app.core.constants import (
    DEFAULT_PAGE,
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
)
# Imports the needed names from app.core.permissions.
from app.core.permissions import CompanyAdminOrSuperAdmin
# Imports the needed names from app.models.user.
from app.models.user import User
# Imports the needed names from app.schemas.user.
from app.schemas.user import (
    CreateUserRequest,
    UpdateUserStatusRequest,
    UserListResponse,
    UserResponse,
)
# Imports the needed names from app.services.user_service.
from app.services.user_service import user_service


# Stores router for the next steps.
router = APIRouter()


@router.get(
    "",
    response_model=UserListResponse,
    summary="List company users",
)
# Gets users.
def list_users(
    db: DatabaseSession,
    current_user: CompanyAdminOrSuperAdmin,
    page: Annotated[
        int,
        Query(ge=1),
    ] = DEFAULT_PAGE,
    page_size: Annotated[
        int,
        Query(alias="pageSize", ge=1, le=MAX_PAGE_SIZE),
    ] = DEFAULT_PAGE_SIZE,
    search: Annotated[str | None, Query(max_length=255)] = None,
    role: Annotated[str | None, Query()] = None,
    account_status: Annotated[
        str | None,
        Query(alias="status"),
    ] = None,
) -> UserListResponse:
    """
    Company Admin receives users from only their company.

    Super Admin behavior can be expanded later to support an explicit,
    authorized company filter.
    """
    # Returns the completed value to the caller.
    return user_service.list_company_users(
        db=db,
        current_user=current_user,
        page=page,
        page_size=page_size,
        search=search,
        role=role,
        account_status=account_status,
    )


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create company user",
)
# Adds user.
def create_user(
    request_data: CreateUserRequest,
    db: DatabaseSession,
    current_user: CompanyAdminOrSuperAdmin,
) -> UserResponse:
    # Returns the completed value to the caller.
    return user_service.create_company_user(
        db=db,
        current_user=current_user,
        request_data=request_data,
    )


@router.patch(
    "/{user_id}/status",
    response_model=UserResponse,
    summary="Update user account status",
)
# Saves user status.
def update_user_status(
    user_id: str,
    request_data: UpdateUserStatusRequest,
    db: DatabaseSession,
    current_user: CompanyAdminOrSuperAdmin,
) -> UserResponse:
    # Returns the completed value to the caller.
    return user_service.update_user_status(
        db=db,
        current_user=current_user,
        user_id=user_id,
        request_data=request_data,
    )