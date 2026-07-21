# Teaching guide: This file contains company repository database access.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from uuid import UUID

# Imports the needed names from sqlalchemy.
from sqlalchemy import func, or_, select
# Imports the needed names from sqlalchemy.orm.
from sqlalchemy.orm import Session

# Imports the needed names from app.models.company.
from app.models.company import Company
# Imports the needed names from app.models.user.
from app.models.user import User


# Groups company repository behavior.
class CompanyRepository:
    # Gets by id.
    def get_by_id(
        self,
        db: Session,
        company_id: UUID,
    ) -> Company | None:
        # Returns the completed value to the caller.
        return db.scalar(
            select(Company).where(
                Company.id == company_id,
            )
        )

    # Gets by email.
    def get_by_email(
        self,
        db: Session,
        email: str,
    ) -> Company | None:
        # Returns the completed value to the caller.
        return db.scalar(
            select(Company).where(
                func.lower(Company.email)
                == email.strip().lower(),
            )
        )

    # Gets by name.
    def get_by_name(
        self,
        db: Session,
        name: str,
    ) -> Company | None:
        # Returns the completed value to the caller.
        return db.scalar(
            select(Company).where(
                func.lower(Company.name)
                == name.strip().lower(),
            )
        )

    # Gets by name or email.
    def get_by_name_or_email(
        self,
        db: Session,
        *,
        name: str,
        email: str,
    ) -> Company | None:
        # Returns the completed value to the caller.
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

    # Adds create.
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
        # Stores company for the next steps.
        company = Company(
            name=name.strip(),
            industry=industry.strip(),
            email=email.strip().lower(),
            address=address.strip(),
            phone=phone.strip(),
        )

        # Applies this change to the database session.
        db.add(company)
        # Applies this change to the database session.
        db.flush()

        # Returns the completed value to the caller.
        return company

    # Saves update.
    def update(
        self,
        db: Session,
        company: Company,
        *,
        values: dict[str, object],
    ) -> Company:
        # Repeats this work for the matching values.
        for field_name, value in values.items():
            # Checks whether this condition is true.
            if value is not None:
                setattr(company, field_name, value)

        # Applies this change to the database session.
        db.flush()

        # Returns the completed value to the caller.
        return company

    # Runs count users logic.
    def count_users(
        self,
        db: Session,
        company_id: UUID,
    ) -> int:
        # Returns the completed value to the caller.
        return int(
            db.scalar(
                select(func.count(User.id)).where(
                    User.company_id == company_id,
                )
            )
            or 0
        )


# Stores company repository for the next steps.
company_repository = CompanyRepository()