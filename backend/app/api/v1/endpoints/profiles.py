# Teaching guide: This file contains API requests and responses for profiles.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from fastapi import APIRouter

# Imports the needed names from app.api.dependencies.
from app.api.dependencies import DatabaseSession
# Imports the needed names from app.core.security.
from app.core.security import CurrentActiveUser
# Imports the needed names from app.schemas.profile.
from app.schemas.profile import (
    UpdateProfileRequest,
    UserProfileResponse,
)
# Imports the needed names from app.services.profile_service.
from app.services.profile_service import profile_service


# Stores router for the next steps.
router = APIRouter()


@router.get(
    "/me",
    response_model=UserProfileResponse,
    summary="Get authenticated user's profile",
)
# Gets current profile.
def get_current_profile(
    db: DatabaseSession,
    current_user: CurrentActiveUser,
) -> UserProfileResponse:
    # Returns the completed value to the caller.
    return profile_service.get_current_profile(
        db=db,
        current_user=current_user,
    )


@router.patch(
    "/me",
    response_model=UserProfileResponse,
    summary="Update authenticated user's profile",
)
# Saves current profile.
def update_current_profile(
    request_data: UpdateProfileRequest,
    db: DatabaseSession,
    current_user: CurrentActiveUser,
) -> UserProfileResponse:
    # Returns the completed value to the caller.
    return profile_service.update_current_profile(
        db=db,
        current_user=current_user,
        request_data=request_data,
    )