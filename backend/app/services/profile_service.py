# Teaching guide: This file contains profile service business logic.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from sqlalchemy.orm import Session

# Imports the needed names from app.models.user.
from app.models.user import User
# Imports the needed names from app.repositories.refresh_token_repository.
from app.repositories.refresh_token_repository import (
    user_repository,
)
# Imports the needed names from app.schemas.profile.
from app.schemas.profile import (
    UpdateProfileRequest,
    UserProfileResponse,
)


# Groups profile service behavior.
class ProfileService:
    # Gets current profile.
    def get_current_profile(
        self,
        db: Session,
        *,
        current_user: User,
    ) -> UserProfileResponse:
        # Stores user for the next steps.
        user = user_repository.get_by_id(
            db,
            current_user.id,
            company_id=current_user.company_id,
        )

        # Checks whether this condition is true.
        if user is None:
            # Imports the needed names from app.core.exceptions.
            from app.core.exceptions import (
                ResourceNotFoundException,
            )

            # Stops here and reports the problem.
            raise ResourceNotFoundException(
                "User profile",
            )

        # Returns the completed value to the caller.
        return UserProfileResponse.model_validate(
            user
        )

    # Saves current profile.
    def update_current_profile(
        self,
        db: Session,
        *,
        current_user: User,
        request_data: UpdateProfileRequest,
    ) -> UserProfileResponse:
        user_repository.update_name(
            db,
            current_user,
            request_data.name,
        )

        # Applies this change to the database session.
        db.commit()
        # Applies this change to the database session.
        db.refresh(current_user)

        # Stores user for the next steps.
        user = user_repository.get_by_id(
            db,
            current_user.id,
            company_id=current_user.company_id,
        )

        # Returns the completed value to the caller.
        return UserProfileResponse.model_validate(
            user
        )


# Stores profile service for the next steps.
profile_service = ProfileService()
