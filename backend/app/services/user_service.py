from math import ceil
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.constants import UserRole, UserStatus
from app.core.exceptions import EmailAlreadyExistsException, ResourceNotFoundException
from app.core.security import hash_password
from app.models.user import User
from app.repositories.refresh_token_repository import user_repository
from app.schemas.user import (
    CreateUserRequest,
    UpdateUserStatusRequest,
    UserListResponse,
    UserResponse,
)


class UserService:
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
        parsed_role = UserRole(role) if role else None
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
        return UserListResponse(
            items=[UserResponse.model_validate(user) for user in users],
            page=page,
            page_size=page_size,
            total_items=total,
            total_pages=ceil(total / page_size) if total else 0,
        )

    def create_company_user(
        self,
        db: Session,
        *,
        current_user: User,
        request_data: CreateUserRequest,
    ) -> UserResponse:
        email = str(request_data.email)
        if user_repository.email_exists(db, email):
            raise EmailAlreadyExistsException()
        user = user_repository.create(
            db,
            company_id=current_user.company_id,
            name=request_data.name,
            email=email,
            password_hash=hash_password(request_data.password),
            role=request_data.role,
        )
        db.commit()
        db.refresh(user)
        return UserResponse.model_validate(user)

    def update_user_status(
        self,
        db: Session,
        *,
        current_user: User,
        user_id: str,
        request_data: UpdateUserStatusRequest,
    ) -> UserResponse:
        user = user_repository.get_by_id(
            db,
            UUID(user_id),
            company_id=current_user.company_id,
        )
        if user is None:
            raise ResourceNotFoundException("User")
        user_repository.update_status(db, user, request_data.status)
        db.commit()
        db.refresh(user)
        return UserResponse.model_validate(user)


user_service = UserService()
