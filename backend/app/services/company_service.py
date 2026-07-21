# Teaching guide: This file contains company service business logic.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from sqlalchemy.orm import Session

# Imports the needed names from app.core.constants.
from app.core.constants import (
    AuditAction,
    UserRole,
    UserStatus,
)
# Imports the needed names from app.core.exceptions.
from app.core.exceptions import (
    CompanyAlreadyExistsException,
    EmailAlreadyExistsException,
    ResourceNotFoundException,
)
# Imports the needed names from app.core.security.
from app.core.security import hash_password
# Imports the needed names from app.models.user.
from app.models.user import User
# Imports the needed names from app.repositories.company_repository.
from app.repositories.company_repository import (
    company_repository,
)
# Imports the needed names from app.repositories.refresh_token_repository.
from app.repositories.refresh_token_repository import (
    user_repository,
)
# Imports the needed names from app.schemas.company.
from app.schemas.company import (
    CompanyDashboardSummary,
    CompanyRegistrationRequest,
    CompanyRegistrationResponse,
    CompanyResponse,
    UpdateCompanyRequest,
)
# Imports the needed names from app.services.audit_log_service.
from app.services.audit_log_service import (
    audit_log_service,
)


# Groups company service behavior.
class CompanyService:
    # Adds company.
    def register_company(
        self,
        db: Session,
        *,
        request_data: CompanyRegistrationRequest,
        ip_address: str,
        browser: str,
    ) -> CompanyRegistrationResponse:
        # Stores existing company for the next steps.
        existing_company = (
            company_repository.get_by_name_or_email(
                db,
                name=request_data.company_name,
                email=str(request_data.company_email),
            )
        )

        # Checks whether this condition is true.
        if existing_company:
            # Stops here and reports the problem.
            raise CompanyAlreadyExistsException()

        # Checks whether this condition is true.
        if user_repository.email_exists(
            db,
            str(request_data.owner_email),
        ):
            # Stops here and reports the problem.
            raise EmailAlreadyExistsException()

        # Tries this work and watches for errors.
        try:
            # Stores company for the next steps.
            company = company_repository.create(
                db,
                name=request_data.company_name,
                industry=request_data.industry,
                email=str(request_data.company_email),
                address=request_data.company_address,
                phone=request_data.company_phone_number,
            )

            # Stores admin user for the next steps.
            admin_user = user_repository.create(
                db,
                company_id=company.id,
                name=request_data.owner_name,
                email=str(request_data.owner_email),
                password_hash=hash_password(
                    request_data.password
                ),
                role=UserRole.COMPANY_ADMIN,
                status=UserStatus.ACTIVE,
            )

            audit_log_service.create_log(
                db,
                company_id=company.id,
                user_id=admin_user.id,
                action=AuditAction.COMPANY_REGISTERED,
                ip_address=ip_address,
                browser=browser,
            )

            # Applies this change to the database session.
            db.commit()

            # Returns the completed value to the caller.
            return CompanyRegistrationResponse(
                message=(
                    "Company registered successfully."
                ),
                company_id=company.id,
                admin_user_id=admin_user.id,
            )
        # Handles the error raised by the work above.
        except Exception:
            # Applies this change to the database session.
            db.rollback()
            # Stops here and reports the problem.
            raise

    # Gets company for user.
    def get_company_for_user(
        self,
        db: Session,
        *,
        current_user: User,
    ) -> CompanyResponse:
        # Stores company for the next steps.
        company = company_repository.get_by_id(
            db,
            current_user.company_id,
        )

        # Checks whether this condition is true.
        if company is None:
            # Stops here and reports the problem.
            raise ResourceNotFoundException(
                "Company",
            )

        # Returns the completed value to the caller.
        return CompanyResponse.model_validate(
            company
        )

    # Saves company.
    def update_company(
        self,
        db: Session,
        *,
        current_user: User,
        request_data: UpdateCompanyRequest,
    ) -> CompanyResponse:
        # Stores company for the next steps.
        company = company_repository.get_by_id(
            db,
            current_user.company_id,
        )

        # Checks whether this condition is true.
        if company is None:
            # Stops here and reports the problem.
            raise ResourceNotFoundException(
                "Company",
            )

        # Checks whether this condition is true.
        if request_data.email:
            # Stores existing for the next steps.
            existing = company_repository.get_by_email(
                db,
                str(request_data.email),
            )

            # Checks whether this condition is true.
            if (
                existing is not None
                and existing.id != company.id
            ):
                # Stops here and reports the problem.
                raise CompanyAlreadyExistsException()

        # Checks whether this condition is true.
        if request_data.name:
            # Stores existing for the next steps.
            existing = company_repository.get_by_name(
                db,
                request_data.name,
            )

            # Checks whether this condition is true.
            if (
                existing is not None
                and existing.id != company.id
            ):
                # Stops here and reports the problem.
                raise CompanyAlreadyExistsException()

        # Stores values for the next steps.
        values = request_data.model_dump(
            exclude_unset=True,
            exclude_none=True,
        )

        # Checks whether this condition is true.
        if "email" in values:
            values["email"] = str(
                values["email"]
            ).lower()

        company_repository.update(
            db,
            company,
            values=values,
        )

        # Applies this change to the database session.
        db.commit()
        # Applies this change to the database session.
        db.refresh(company)

        # Returns the completed value to the caller.
        return CompanyResponse.model_validate(
            company
        )

    # Gets dashboard summary.
    def get_dashboard_summary(
        self,
        db: Session,
        *,
        current_user: User,
    ) -> CompanyDashboardSummary:
        # Stores total users for the next steps.
        total_users = company_repository.count_users(
            db,
            current_user.company_id,
        )

        # Returns the completed value to the caller.
        return CompanyDashboardSummary(
            company_id=current_user.company_id,
            total_users=total_users,
            total_products=0,
            total_sales=0,
            total_reports=0,
        )


# Stores company service for the next steps.
company_service = CompanyService()
