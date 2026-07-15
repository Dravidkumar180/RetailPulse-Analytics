from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.refresh_token_repository import (
    user_repository,
)
from app.schemas.profile import (
    UpdateProfileRequest,
    UserProfileResponse,
)


class ProfileService:
    def get_current_profile(
        self,
        db: Session,
        *,
        current_user: User,
    ) -> UserProfileResponse:
        user = user_repository.get_by_id(
            db,
            current_user.id,
            company_id=current_user.company_id,
        )

        if user is None:
            from app.core.exceptions import (
                ResourceNotFoundException,
            )

            raise ResourceNotFoundException(
                "User profile",
            )

        return UserProfileResponse.model_validate(
            user
        )

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

        db.commit()
        db.refresh(current_user)

        user = user_repository.get_by_id(
            db,
            current_user.id,
            company_id=current_user.company_id,
        )

        return UserProfileResponse.model_validate(
            user
        )


profile_service = ProfileService()
