from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.orm import (
    Session,
    joinedload,
)

from app.core.constants import UserRole, UserStatus
from app.models.user import User


class UserRepository:
    def get_by_id(
        self,
        db: Session,
        user_id: UUID,
        *,
        company_id: UUID | None = None,
    ) -> User | None:
        statement = (
            select(User)
            .options(joinedload(User.company))
            .where(User.id == user_id)
        )

        if company_id is not None:
            statement = statement.where(
                User.company_id == company_id,
            )

        return db.scalar(statement)

    def get_by_email(
        self,
        db: Session,
        email: str,
    ) -> User | None:
        return db.scalar(
            select(User)
            .options(joinedload(User.company))
            .where(
                func.lower(User.email)
                == email.strip().lower(),
            )
        )

    def email_exists(
        self,
        db: Session,
        email: str,
        *,
        exclude_user_id: UUID | None = None,
    ) -> bool:
        statement = select(User.id).where(
            func.lower(User.email)
            == email.strip().lower(),
        )

        if exclude_user_id:
            statement = statement.where(
                User.id != exclude_user_id,
            )

        return db.scalar(statement) is not None

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
        user = User(
            company_id=company_id,
            name=name.strip(),
            email=email.strip().lower(),
            password_hash=password_hash,
            role=role,
            status=status,
        )

        db.add(user)
        db.flush()

        return user

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
        filters = [
            User.company_id == company_id,
        ]

        if search:
            search_value = f"%{search.strip().lower()}%"

            filters.append(
                or_(
                    func.lower(User.name).like(search_value),
                    func.lower(User.email).like(search_value),
                )
            )

        if role:
            filters.append(User.role == role)

        if status:
            filters.append(User.status == status)

        count_statement = select(
            func.count(User.id)
        ).where(*filters)

        total_items = int(
            db.scalar(count_statement)
            or 0
        )

        statement = (
            select(User)
            .where(*filters)
            .order_by(User.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )

        users = list(
            db.scalars(statement).all()
        )

        return users, total_items

    def update_status(
        self,
        db: Session,
        user: User,
        status: UserStatus,
    ) -> User:
        user.status = status
        db.flush()

        return user

    def update_name(
        self,
        db: Session,
        user: User,
        name: str,
    ) -> User:
        user.name = name.strip()
        db.flush()

        return user

    def update_password_hash(
        self,
        db: Session,
        user: User,
        password_hash: str,
    ) -> User:
        user.password_hash = password_hash
        db.flush()

        return user

    def update_last_login(
        self,
        db: Session,
        user: User,
    ) -> User:
        from datetime import UTC, datetime

        user.last_login = datetime.now(UTC)
        db.flush()

        return user


user_repository = UserRepository()