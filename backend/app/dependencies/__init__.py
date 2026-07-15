"""Reusable FastAPI dependencies."""

from app.dependencies.auth import (
    CurrentActiveUser,
    CurrentUser,
    get_access_token,
    get_current_active_user,
    get_current_user,
)
from app.dependencies.authorization import (
    AnalystOrHigher,
    CompanyAdminOrSuperAdmin,
    SuperAdminOnly,
    require_permissions,
    require_roles,
)
from app.dependencies.database import DatabaseSession
from app.dependencies.tenant import (
    CurrentCompanyId,
    TenantContext,
    get_current_company_id,
    get_tenant_context,
)

__all__ = [
    "DatabaseSession",
    "CurrentUser",
    "CurrentActiveUser",
    "SuperAdminOnly",
    "CompanyAdminOrSuperAdmin",
    "AnalystOrHigher",
    "CurrentCompanyId",
    "TenantContext",
    "get_access_token",
    "get_current_user",
    "get_current_active_user",
    "get_current_company_id",
    "get_tenant_context",
    "require_roles",
    "require_permissions",
]