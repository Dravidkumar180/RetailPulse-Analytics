# Teaching guide: This file contains API requests and responses for companies.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from fastapi import APIRouter, status

# Imports the needed names from app.api.dependencies.
from app.api.dependencies import DatabaseSession
# Imports the needed names from app.core.permissions.
from app.core.permissions import CompanyAdminOrSuperAdmin
# Imports the needed names from app.core.security.
from app.core.security import CurrentActiveUser
# Imports the needed names from app.schemas.company.
from app.schemas.company import (
    CompanyDashboardSummary,
    CompanyResponse,
    UpdateCompanyRequest,
)
# Imports the needed names from app.services.company_service.
from app.services.company_service import company_service


# Stores router for the next steps.
router = APIRouter()


@router.get(
    "/me",
    response_model=CompanyResponse,
    summary="Get authenticated user's company",
)
# Gets current company.
def get_current_company(
    db: DatabaseSession,
    current_user: CurrentActiveUser,
) -> CompanyResponse:
    # Returns the completed value to the caller.
    return company_service.get_company_for_user(
        db=db,
        current_user=current_user,
    )


@router.patch(
    "/me",
    response_model=CompanyResponse,
    summary="Update authenticated user's company",
)
# Saves current company.
def update_current_company(
    request_data: UpdateCompanyRequest,
    db: DatabaseSession,
    current_user: CompanyAdminOrSuperAdmin,
) -> CompanyResponse:
    # Returns the completed value to the caller.
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
# Gets company dashboard summary.
def get_company_dashboard_summary(
    db: DatabaseSession,
    current_user: CurrentActiveUser,
) -> CompanyDashboardSummary:
    """
    All totals must be filtered using current_user.company_id.

    Never accept company_id directly from a normal tenant user for this
    endpoint because that would allow tenant ID manipulation.
    """
    # Returns the completed value to the caller.
    return company_service.get_dashboard_summary(
        db=db,
        current_user=current_user,
    )