from collections.abc import Mapping
from time import perf_counter
from typing import Final

from starlette.middleware.base import (
    BaseHTTPMiddleware,
    RequestResponseEndpoint,
)
from starlette.requests import Request
from starlette.responses import Response


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


class AuditMiddleware(BaseHTTPMiddleware):
    """
    Attach audit metadata to the request.

    Authentication services already create the actual database audit
    entries because they know the final company and user IDs.

    This middleware deliberately avoids inserting audit rows itself,
    which prevents duplicate logs.
    """

    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        request_key = (
            request.method.upper(),
            request.url.path.rstrip("/") or "/",
        )

        audit_action = AUDITED_PATHS.get(
            request_key,
        )

        request.state.audit_action = audit_action
        request.state.audit_started_at = perf_counter()

        response = await call_next(request)

        request.state.audit_succeeded = (
            200 <= response.status_code < 400
        )

        response.headers["X-Audit-Tracked"] = (
            "true" if audit_action else "false"
        )

        return response