# Teaching guide: This file contains API requests and responses for audit logs.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from datetime import date
# Imports the needed names from typing.
from typing import Annotated

# Imports the needed names from fastapi.
from fastapi import APIRouter, Query

# Imports the needed names from app.api.dependencies.
from app.api.dependencies import DatabaseSession
# Imports the needed names from app.core.constants.
from app.core.constants import (
    DEFAULT_PAGE,
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
)
# Imports the needed names from app.core.permissions.
from app.core.permissions import CompanyAdminOrSuperAdmin
# Imports the needed names from app.schemas.audit_log.
from app.schemas.audit_log import (
    AuditActionValue,
    AuditLogListResponse,
    AuditLogResponse,
)
# Imports the needed names from app.services.audit_log_service.
from app.services.audit_log_service import audit_log_service


# Stores router for the next steps.
router = APIRouter()


@router.get(
    "",
    response_model=AuditLogListResponse,
    summary="List audit logs",
)
# Gets audit logs.
def list_audit_logs(
    db: DatabaseSession,
    current_user: CompanyAdminOrSuperAdmin,
    page: Annotated[
        int,
        Query(ge=1),
    ] = DEFAULT_PAGE,
    page_size: Annotated[
        int,
        Query(alias="pageSize", ge=1, le=MAX_PAGE_SIZE),
    ] = DEFAULT_PAGE_SIZE,
    action: Annotated[AuditActionValue | None, Query()] = None,
    user_id: Annotated[
        str | None,
        Query(alias="userId"),
    ] = None,
    search: Annotated[str | None, Query(max_length=255)] = None,
    start_date: Annotated[
        date | None,
        Query(alias="startDate"),
    ] = None,
    end_date: Annotated[
        date | None,
        Query(alias="endDate"),
    ] = None,
) -> AuditLogListResponse:
    """
    Company Admin receives audit entries from only their company.

    The company scope must be applied in the repository query itself,
    not after loading records.
    """
    # Returns the completed value to the caller.
    return audit_log_service.list_audit_logs(
        db=db,
        current_user=current_user,
        page=page,
        page_size=page_size,
        action=action,
        user_id=user_id,
        search=search,
        start_date=start_date,
        end_date=end_date,
    )


@router.get(
    "/{audit_log_id}",
    response_model=AuditLogResponse,
    summary="Get audit log details",
)
# Gets audit log.
def get_audit_log(
    audit_log_id: str,
    db: DatabaseSession,
    current_user: CompanyAdminOrSuperAdmin,
) -> AuditLogResponse:
    # Returns the completed value to the caller.
    return audit_log_service.get_audit_log(
        db=db,
        current_user=current_user,
        audit_log_id=audit_log_id,
    )