from fastapi import APIRouter

from app.api.dependencies import DatabaseSession
from app.core.security import CurrentActiveUser
from app.schemas.profile import (
    UpdateProfileRequest,
    UserProfileResponse,
)
from app.services.profile_service import profile_service


router = APIRouter()


@router.get(
    "/me",
    response_model=UserProfileResponse,
    summary="Get authenticated user's profile",
)
def get_current_profile(
    db: DatabaseSession,
    current_user: CurrentActiveUser,
) -> UserProfileResponse:
    return profile_service.get_current_profile(
        db=db,
        current_user=current_user,
    )


@router.patch(
    "/me",
    response_model=UserProfileResponse,
    summary="Update authenticated user's profile",
)
def update_current_profile(
    request_data: UpdateProfileRequest,
    db: DatabaseSession,
    current_user: CurrentActiveUser,
) -> UserProfileResponse:
    return profile_service.update_current_profile(
        db=db,
        current_user=current_user,
        request_data=request_data,
    )