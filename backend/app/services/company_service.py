from sqlalchemy.orm import Session

from app.core.constants import (
    AuditAction,
    UserRole,
    UserStatus,
)
from app.core.exceptions import (
    CompanyAlreadyExistsException,
    EmailAlreadyExistsException,
    ResourceNotFoundException,
)
from app.core.security import hash_password
from app.models.user import User
from app.repositories.company_repository import (
    company_repository,
)
from app.repositories.refresh_token_repository import (
    user_repository,
)
from app.schemas.company import (
    CompanyDashboardSummary,
    CompanyRegistrationRequest,
    CompanyRegistrationResponse,
    CompanyResponse,
    UpdateCompanyRequest,
)
from app.services.audit_log_service import (
    audit_log_service,
)


class CompanyService:
    def register_company(
        self,
        db: Session,
        *,
        request_data: CompanyRegistrationRequest,
        ip_address: str,
        browser: str,
    ) -> CompanyRegistrationResponse:
        existing_company = (
            company_repository.get_by_name_or_email(
                db,
                name=request_data.company_name,
                email=str(request_data.company_email),
            )
        )

        if existing_company:
            raise CompanyAlreadyExistsException()

        if user_repository.email_exists(
            db,
            str(request_data.owner_email),
        ):
            raise EmailAlreadyExistsException()

        try:
            company = company_repository.create(
                db,
                name=request_data.company_name,
                industry=request_data.industry,
                email=str(request_data.company_email),
                address=request_data.company_address,
                phone=request_data.company_phone_number,
            )

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

            db.commit()

            return CompanyRegistrationResponse(
                message=(
                    "Company registered successfully."
                ),
                company_id=company.id,
                admin_user_id=admin_user.id,
            )
        except Exception:
            db.rollback()
            raise

    def get_company_for_user(
        self,
        db: Session,
        *,
        current_user: User,
    ) -> CompanyResponse:
        company = company_repository.get_by_id(
            db,
            current_user.company_id,
        )

        if company is None:
            raise ResourceNotFoundException(
                "Company",
            )

        return CompanyResponse.model_validate(
            company
        )

    def update_company(
        self,
        db: Session,
        *,
        current_user: User,
        request_data: UpdateCompanyRequest,
    ) -> CompanyResponse:
        company = company_repository.get_by_id(
            db,
            current_user.company_id,
        )

        if company is None:
            raise ResourceNotFoundException(
                "Company",
            )

        if request_data.email:
            existing = company_repository.get_by_email(
                db,
                str(request_data.email),
            )

            if (
                existing is not None
                and existing.id != company.id
            ):
                raise CompanyAlreadyExistsException()

        if request_data.name:
            existing = company_repository.get_by_name(
                db,
                request_data.name,
            )

            if (
                existing is not None
                and existing.id != company.id
            ):
                raise CompanyAlreadyExistsException()

        values = request_data.model_dump(
            exclude_unset=True,
            exclude_none=True,
        )

        if "email" in values:
            values["email"] = str(
                values["email"]
            ).lower()

        company_repository.update(
            db,
            company,
            values=values,
        )

        db.commit()
        db.refresh(company)

        return CompanyResponse.model_validate(
            company
        )

    def get_dashboard_summary(
        self,
        db: Session,
        *,
        current_user: User,
    ) -> CompanyDashboardSummary:
        total_users = company_repository.count_users(
            db,
            current_user.company_id,
        )

        return CompanyDashboardSummary(
            company_id=current_user.company_id,
            total_users=total_users,
            total_products=0,
            total_sales=0,
            total_reports=0,
        )


company_service = CompanyService()
