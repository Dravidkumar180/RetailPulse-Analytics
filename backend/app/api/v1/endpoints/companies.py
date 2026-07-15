from fastapi import APIRouter, status

from app.api.dependencies import DatabaseSession
from app.core.permissions import CompanyAdminOrSuperAdmin
from app.core.security import CurrentActiveUser
from app.schemas.company import (
    CompanyDashboardSummary,
    CompanyResponse,
    UpdateCompanyRequest,
)
from app.services.company_service import company_service


router = APIRouter()


@router.get(
    "/me",
    response_model=CompanyResponse,
    summary="Get authenticated user's company",
)
def get_current_company(
    db: DatabaseSession,
    current_user: CurrentActiveUser,
) -> CompanyResponse:
    return company_service.get_company_for_user(
        db=db,
        current_user=current_user,
    )


@router.patch(
    "/me",
    response_model=CompanyResponse,
    summary="Update authenticated user's company",
)
def update_current_company(
    request_data: UpdateCompanyRequest,
    db: DatabaseSession,
    current_user: CompanyAdminOrSuperAdmin,
) -> CompanyResponse:
    return company_service.update_company(
        db=db,
        current_user=current_user,
        request_data=request_data,
    )


@router.get(
    "/me/dashboard-summary",
    response_model=CompanyDashboardSummary,
    summary="Get company dashboard summary",
)
def get_company_dashboard_summary(
    db: DatabaseSession,
    current_user: CurrentActiveUser,
) -> CompanyDashboardSummary:
    """
    All totals must be filtered using current_user.company_id.

    Never accept company_id directly from a normal tenant user for this
    endpoint because that would allow tenant ID manipulation.
    """
    return company_service.get_dashboard_summary(
        db=db,
        current_user=current_user,
    )