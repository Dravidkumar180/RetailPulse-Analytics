# Teaching guide: This file contains refresh token repository database access.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from uuid import UUID

# Imports the needed names from sqlalchemy.
from sqlalchemy import func, or_, select
# Imports the needed names from sqlalchemy.orm.
from sqlalchemy.orm import (
    Session,
    joinedload,
)

# Imports the needed names from app.core.constants.
from app.core.constants import UserRole, UserStatus
# Imports the needed names from app.models.user.
from app.models.user import User


# Groups user repository behavior.
class UserRepository:
    # Gets by id.
    def get_by_id(
        self,
        db: Session,
        user_id: UUID,
        *,
        company_id: UUID | None = None,
    ) -> User | None:
        # Stores statement for the next steps.
        statement = (
            select(User)
            .options(joinedload(User.company))
            .where(User.id == user_id)
        )

        # Checks whether this condition is true.
        if company_id is not None:
            # Stores statement for the next steps.
            statement = statement.where(
                User.company_id == company_id,
            )

        # Returns the completed value to the caller.
        return db.scalar(statement)

    # Gets by email.
    def get_by_email(
        self,
        db: Session,
        email: str,
    ) -> User | None:
        # Returns the completed value to the caller.
        return db.scalar(
            select(User)
            .options(joinedload(User.company))
            .where(
                func.lower(User.email)
                == email.strip().lower(),
            )
        )

    # Runs email exists logic.
    def email_exists(
        self,
        db: Session,
        email: str,
        *,
        exclude_user_id: UUID | None = None,
    ) -> bool:
        # Stores statement for the next steps.
        statement = select(User.id).where(
            func.lower(User.email)
            == email.strip().lower(),
        )

        # Checks whether this condition is true.
        if exclude_user_id:
            # Stores statement for the next steps.
            statement = statement.where(
                User.id != exclude_user_id,
            )

        # Returns the completed value to the caller.
        return db.scalar(statement) is not None

    # Adds create.
    def create(
        self,
        db: Session,
        *,
        company_id: UUID,
        name: str,
        email: str,
        password_hash: str,
        role: UserRole,
        status: UserStatus = UserStatus.ACTIVE,
    ) -> User:
        # Stores user for the next steps.
        user = User(
            company_id=company_id,
            name=name.strip(),
            email=email.strip().lower(),
            password_hash=password_hash,
            role=role,
            status=status,
        )

        # Applies this change to the database session.
        db.add(user)
        # Applies this change to the database session.
        db.flush()

        # Returns the completed value to the caller.
        return user

    # Gets company users.
    def list_company_users(
        self,
        db: Session,
        *,
        company_id: UUID,
        page: int,
        page_size: int,
        search: str | None = None,
        role: UserRole | None = None,
        status: UserStatus | None = None,
    ) -> tuple[list[User], int]:
        # Stores filters for the next steps.
        filters = [
            User.company_id == company_id,
        ]

        # Checks whether this condition is true.
        if search:
            # Stores search value for the next steps.
            search_value = f"%{search.strip().lower()}%"

            filters.append(
                or_(
                    func.lower(User.name).like(search_value),
                    func.lower(User.email).like(search_value),
                )
            )

        # Checks whether this condition is true.
        if role:
            filters.append(User.role == role)

        # Checks whether this condition is true.
        if status:
            filters.append(User.status == status)

        # Stores count statement for the next steps.
        count_statement = select(
            func.count(User.id)
        ).where(*filters)

        # Stores total items for the next steps.
        total_items = int(
            db.scalar(count_statement)
            or 0
        )

        # Stores statement for the next steps.
        statement = (
            select(User)
            .where(*filters)
            .order_by(User.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )

        # Stores users for the next steps.
        users = list(
            db.scalars(statement).all()
        )

        # Returns the completed value to the caller.
        return users, total_items

    # Saves status.
    def update_status(
        self,
        db: Session,
        user: User,
        status: UserStatus,
    ) -> User:
        user.status = status
        # Applies this change to the database session.
        db.flush()

        # Returns the completed value to the caller.
        return user

    # Saves name.
    def update_name(
        self,
        db: Session,
        user: User,
        name: str,
    ) -> User:
        user.name = name.strip()
        # Applies this change to the database session.
        db.flush()

        # Returns the completed value to the caller.
        return user

    # Saves password hash.
    def update_password_hash(
        self,
        db: Session,
        user: User,
        password_hash: str,
    ) -> User:
        user.password_hash = password_hash
        # Applies this change to the database session.
        db.flush()

        # Returns the completed value to the caller.
        return user

    # Saves last login.
    def update_last_login(
        self,
        db: Session,
        user: User,
    ) -> User:
        # Imports the needed names from datetime.
        from datetime import UTC, datetime

        user.last_login = datetime.now(UTC)
        # Applies this change to the database session.
        db.flush()

        # Returns the completed value to the caller.
        return user


# Stores user repository for the next steps.
user_repository = UserRepository()