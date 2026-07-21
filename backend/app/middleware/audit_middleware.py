# Teaching guide: This file contains audit middleware request processing.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from collections.abc import Mapping
# Imports the needed names from time.
from time import perf_counter
# Imports the needed names from typing.
from typing import Final

# Imports the needed names from starlette.middleware.base.
from starlette.middleware.base import (
    BaseHTTPMiddleware,
    RequestResponseEndpoint,
)
# Imports the needed names from starlette.requests.
from starlette.requests import Request
# Imports the needed names from starlette.responses.
from starlette.responses import Response


# Stores audited paths for the next steps.
AUDITED_PATHS: Final[Mapping[tuple[str, str], str]] = {
    (
        "POST",
        "/api/v1/auth/register-company",
    ): "COMPANY_REGISTERED",
    (
        "POST",
        "/api/v1/auth/login",
    ): "USER_LOGIN",
    (
        "POST",
        "/api/v1/auth/logout",
    ): "USER_LOGOUT",
    (
        "POST",
        "/api/v1/auth/change-password",
    ): "PASSWORD_CHANGED",
}


# Groups audit middleware behavior.
class AuditMiddleware(BaseHTTPMiddleware):
    """
    Attach audit metadata to the request.

    Authentication services already create the actual database audit
    entries because they know the final company and user IDs.

    This middleware deliberately avoids inserting audit rows itself,
    which prevents duplicate logs.
    """

    # Runs dispatch logic.
    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        # Stores request key for the next steps.
        request_key = (
            request.method.upper(),
            request.url.path.rstrip("/") or "/",
        )

        # Stores audit action for the next steps.
        audit_action = AUDITED_PATHS.get(
            request_key,
        )

        request.state.audit_action = audit_action
        request.state.audit_started_at = perf_counter()

        # Stores response for the next steps.
        response = await call_next(request)

        request.state.audit_succeeded = (
            200 <= response.status_code < 400
        )

        response.headers["X-Audit-Tracked"] = (
            "true" if audit_action else "false"
        )

        # Returns the completed value to the caller.
        return response