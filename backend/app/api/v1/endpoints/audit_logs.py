# Teaching guide: This file contains API requests and responses for audit logs.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from datetime import date
# Imports the needed names from typing.
from typing import Annotated

# Imports the needed names from fastapi.
from fastapi import APIRouter, Query
from sqlalchemy import case, func, select

# Imports the needed names from app.api.dependencies.
from app.api.dependencies import DatabaseSession
# Imports the needed names from app.core.constants.
from app.core.constants import (
    AuditAction,
    DEFAULT_PAGE,
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
)
from app.core.constants import UserRole
# Imports the needed names from app.core.permissions.
from app.core.permissions import AllAuthenticatedRoles
from app.models.audit_log import AuditLog
from app.models.user import User
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
    current_user: AllAuthenticatedRoles,
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
    exclude_authentication: Annotated[
        bool,
        Query(alias="excludeAuthentication"),
    ] = False,
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
        exclude_authentication=exclude_authentication,
    )


@router.get(
    "/authentication-summary",
    summary="Summarize user login and logout activity",
)
def authentication_summary(
    db: DatabaseSession,
    current_user: AllAuthenticatedRoles,
) -> list[dict[str, object]]:
    filters = [
        AuditLog.action.in_(
            [AuditAction.USER_LOGIN, AuditAction.USER_LOGOUT]
        )
    ]
    if current_user.role != UserRole.SUPER_ADMIN:
        filters.append(AuditLog.company_id == current_user.company_id)

    login_count = func.sum(
        case((AuditLog.action == AuditAction.USER_LOGIN, 1), else_=0)
    )
    logout_count = func.sum(
        case((AuditLog.action == AuditAction.USER_LOGOUT, 1), else_=0)
    )
    last_login = func.max(
        case(
            (AuditLog.action == AuditAction.USER_LOGIN, AuditLog.timestamp),
            else_=None,
        )
    )
    last_logout = func.max(
        case(
            (AuditLog.action == AuditAction.USER_LOGOUT, AuditLog.timestamp),
            else_=None,
        )
    )
    rows = db.execute(
        select(
            User.id,
            User.name,
            User.email,
            login_count.label("login_count"),
            logout_count.label("logout_count"),
            last_login.label("last_login"),
            last_logout.label("last_logout"),
        )
        .join(AuditLog, AuditLog.user_id == User.id)
        .where(*filters)
        .group_by(User.id, User.name, User.email)
        .order_by(last_login.desc())
    ).all()

    return [
        {
            "userId": str(row.id),
            "name": row.name,
            "email": row.email,
            "loginCount": int(row.login_count or 0),
            "logoutCount": int(row.logout_count or 0),
            "lastLogin": row.last_login,
            "lastLogout": row.last_logout,
            "state": (
                "SIGNED_IN"
                if row.last_login
                and (not row.last_logout or row.last_login > row.last_logout)
                else "SIGNED_OUT"
            ),
        }
        for row in rows
    ]


@router.get(
    "/{audit_log_id}",
    response_model=AuditLogResponse,
    summary="Get audit log details",
)
# Gets audit log.
def get_audit_log(
    audit_log_id: str,
    db: DatabaseSession,
    current_user: AllAuthenticatedRoles,
) -> AuditLogResponse:
    # Returns the completed value to the caller.
    return audit_log_service.get_audit_log(
        db=db,
        current_user=current_user,
        audit_log_id=audit_log_id,
    )
