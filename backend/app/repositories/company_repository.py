from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.company import Company
from app.models.user import User


class CompanyRepository:
    def get_by_id(
        self,
        db: Session,
        company_id: UUID,
    ) -> Company | None:
        return db.scalar(
            select(Company).where(
                Company.id == company_id,
            )
        )

    def get_by_email(
        self,
        db: Session,
        email: str,
    ) -> Company | None:
        return db.scalar(
            select(Company).where(
                func.lower(Company.email)
                == email.strip().lower(),
            )
        )

    def get_by_name(
        self,
        db: Session,
        name: str,
    ) -> Company | None:
        return db.scalar(
            select(Company).where(
                func.lower(Company.name)
                == name.strip().lower(),
            )
        )

    def get_by_name_or_email(
        self,
        db: Session,
        *,
        name: str,
        email: str,
    ) -> Company | None:
        return db.scalar(
            select(Company).where(
                or_(
                    func.lower(Company.name)
                    == name.strip().lower(),
                    func.lower(Company.email)
                    == email.strip().lower(),
                )
            )
        )

    def create(
        self,
        db: Session,
        *,
        name: str,
        industry: str,
        email: str,
        address: str,
        phone: str,
    ) -> Company:
        company = Company(
            name=name.strip(),
            industry=industry.strip(),
            email=email.strip().lower(),
            address=address.strip(),
            phone=phone.strip(),
        )

        db.add(company)
        db.flush()

        return company

    def update(
        self,
        db: Session,
        company: Company,
        *,
        values: dict[str, object],
    ) -> Company:
        for field_name, value in values.items():
            if value is not None:
                setattr(company, field_name, value)

        db.flush()

        return company

    def count_users(
        self,
        db: Session,
        company_id: UUID,
    ) -> int:
        return int(
            db.scalar(
                select(func.count(User.id)).where(
                    User.company_id == company_id,
                )
            )
            or 0
        )


company_repository = CompanyRepository()