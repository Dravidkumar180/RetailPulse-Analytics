# Teaching guide: This file contains  init  shared dependencies.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

"""Reusable FastAPI dependencies."""

# Imports the needed names from app.dependencies.auth.
from app.dependencies.auth import (
    CurrentActiveUser,
    CurrentUser,
    get_access_token,
    get_current_active_user,
    get_current_user,
)
# Imports the needed names from app.dependencies.authorization.
from app.dependencies.authorization import (
    AnalystOrHigher,
    CompanyAdminOrSuperAdmin,
    SuperAdminOnly,
    require_permissions,
    require_roles,
)
# Imports the needed names from app.dependencies.database.
from app.dependencies.database import DatabaseSession
# Imports the needed names from app.dependencies.tenant.
from app.dependencies.tenant import (
    CurrentCompanyId,
    TenantContext,
    get_current_company_id,
    get_tenant_context,
)

# Stores  all  for the next steps.
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