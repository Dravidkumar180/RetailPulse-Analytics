# Teaching guide: This file contains  init  request processing.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

"""Application middleware."""

# Imports the needed names from app.middleware.audit_middleware.
from app.middleware.audit_middleware import AuditMiddleware
# Imports the needed names from app.middleware.exception_middleware.
from app.middleware.exception_middleware import ExceptionMiddleware
# Imports the needed names from app.middleware.request_context.
from app.middleware.request_context import RequestContextMiddleware
# Imports the needed names from app.middleware.tenant_middleware.
from app.middleware.tenant_middleware import TenantMiddleware

# Stores  all  for the next steps.
__all__ = [
    "RequestContextMiddleware",
    "TenantMiddleware",
    "AuditMiddleware",
    "ExceptionMiddleware",
]