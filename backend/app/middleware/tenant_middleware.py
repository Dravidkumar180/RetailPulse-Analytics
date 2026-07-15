from uuid import UUID

from starlette.middleware.base import (
    BaseHTTPMiddleware,
    RequestResponseEndpoint,
)
from starlette.requests import Request
from starlette.responses import Response

from app.core.constants import ACCESS_TOKEN_TYPE
from app.core.jwt import decode_access_token


PUBLIC_PATH_PREFIXES = (
    "/",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/api/v1/health",
    "/api/v1/auth/login",
    "/api/v1/auth/register-company",
    "/api/v1/auth/forgot-password",
    "/api/v1/auth/reset-password",
    "/api/v1/auth/refresh",
)


class TenantMiddleware(BaseHTTPMiddleware):
    """
    Extract tenant information from a valid access token.

    This middleware provides request context only. It does not replace
    endpoint authentication or repository-level company filtering.
    """

    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        request.state.company_id = None
        request.state.user_id = None
        request.state.user_role = None

        authorization_header = request.headers.get(
            "authorization",
        )

        if authorization_header:
            scheme, _, token = authorization_header.partition(
                " ",
            )

            if (
                scheme.lower() == "bearer"
                and token
            ):
                try:
                    payload = decode_access_token(
                        token,
                    )

                    company_id = payload.get("companyId")
                    user_id = payload.get("sub")
                    role = payload.get("role")

                    if company_id:
                        request.state.company_id = UUID(
                            str(company_id),
                        )

                    if user_id:
                        request.state.user_id = UUID(
                            str(user_id),
                        )

                    request.state.user_role = role
                except Exception:
                    # Authentication dependencies return the proper
                    # HTTP error for invalid or expired tokens.
                    pass

        return await call_next(request)