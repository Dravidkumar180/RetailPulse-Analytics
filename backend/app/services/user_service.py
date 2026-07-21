# Teaching guide: This file contains user service business logic.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from math import ceil
# Imports the needed names from uuid.
from uuid import UUID

# Imports the needed names from sqlalchemy.orm.
from sqlalchemy.orm import Session

# Imports the needed names from app.core.constants.
from app.core.constants import UserRole, UserStatus
# Imports the needed names from app.core.exceptions.
from app.core.exceptions import EmailAlreadyExistsException, ResourceNotFoundException
# Imports the needed names from app.core.security.
from app.core.security import hash_password
# Imports the needed names from app.models.user.
from app.models.user import User
# Imports the needed names from app.repositories.refresh_token_repository.
from app.repositories.refresh_token_repository import user_repository
# Imports the needed names from app.schemas.user.
from app.schemas.user import (
    CreateUserRequest,
    UpdateUserStatusRequest,
    UserListResponse,
    UserResponse,
)


# Groups user service behavior.
class UserService:
    # Gets company users.
    def list_company_users(
        self,
        db: Session,
        *,
        current_user: User,
        page: int,
        page_size: int,
        search: str | None = None,
        role: str | None = None,
        account_status: str | None = None,
    ) -> UserListResponse:
        # Stores parsed role for the next steps.
        parsed_role = UserRole(role) if role else None
        # Stores parsed status for the next steps.
        parsed_status = UserStatus(account_status) if account_status else None
        users, total = user_repository.list_company_users(
            db,
            company_id=current_user.company_id,
            page=page,
            page_size=page_size,
            search=search,
            role=parsed_role,
            status=parsed_status,
        )
        # Returns the completed value to the caller.
        return UserListResponse(
            items=[UserResponse.model_validate(user) for user in users],
            page=page,
            page_size=page_size,
            total_items=total,
            total_pages=ceil(total / page_size) if total else 0,
        )

    # Adds company user.
    def create_company_user(
        self,
        db: Session,
        *,
        current_user: User,
        request_data: CreateUserRequest,
    ) -> UserResponse:
        # Stores email for the next steps.
        email = str(request_data.email)
        # Checks whether this condition is true.
        if user_repository.email_exists(db, email):
            # Stops here and reports the problem.
            raise EmailAlreadyExistsException()
        # Stores user for the next steps.
        user = user_repository.create(
            db,
            company_id=current_user.company_id,
            name=request_data.name,
            email=email,
            password_hash=hash_password(request_data.password),
            role=request_data.role,
        )
        # Applies this change to the database session.
        db.commit()
        # Applies this change to the database session.
        db.refresh(user)
        # Returns the completed value to the caller.
        return UserResponse.model_validate(user)

    # Saves user status.
    def update_user_status(
        self,
        db: Session,
        *,
        current_user: User,
        user_id: str,
        request_data: UpdateUserStatusRequest,
    ) -> UserResponse:
        # Stores user for the next steps.
        user = user_repository.get_by_id(
            db,
            UUID(user_id),
            company_id=current_user.company_id,
        )
        # Checks whether this condition is true.
        if user is None:
            # Stops here and reports the problem.
            raise ResourceNotFoundException("User")
        user_repository.update_status(db, user, request_data.status)
        # Applies this change to the database session.
        db.commit()
        # Applies this change to the database session.
        db.refresh(user)
        # Returns the completed value to the caller.
        return UserResponse.model_validate(user)


# Stores user service for the next steps.
user_service = UserService()
