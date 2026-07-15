from typing import Annotated

from fastapi import APIRouter, Query, status

from app.api.dependencies import DatabaseSession
from app.core.constants import (
    DEFAULT_PAGE,
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
)
from app.core.permissions import CompanyAdminOrSuperAdmin
from app.models.user import User
from app.schemas.user import (
    CreateUserRequest,
    UpdateUserStatusRequest,
    UserListResponse,
    UserResponse,
)
from app.services.user_service import user_service


router = APIRouter()


@router.get(
    "",
    response_model=UserListResponse,
    summary="List company users",
)
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
def create_user(
    request_data: CreateUserRequest,
    db: DatabaseSession,
    current_user: CompanyAdminOrSuperAdmin,
) -> UserResponse:
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
def update_user_status(
    user_id: str,
    request_data: UpdateUserStatusRequest,
    db: DatabaseSession,
    current_user: CompanyAdminOrSuperAdmin,
) -> UserResponse:
    return user_service.update_user_status(
        db=db,
        current_user=current_user,
        user_id=user_id,
        request_data=request_data,
    )