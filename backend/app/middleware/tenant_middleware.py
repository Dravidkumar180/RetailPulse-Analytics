# Teaching guide: This file contains tenant middleware request processing.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from uuid import UUID

# Imports the needed names from starlette.middleware.base.
from starlette.middleware.base import (
    BaseHTTPMiddleware,
    RequestResponseEndpoint,
)
# Imports the needed names from starlette.requests.
from starlette.requests import Request
# Imports the needed names from starlette.responses.
from starlette.responses import Response

# Imports the needed names from app.core.constants.
from app.core.constants import ACCESS_TOKEN_TYPE
# Imports the needed names from app.core.jwt.
from app.core.jwt import decode_access_token


# Stores public path prefixes for the next steps.
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


# Groups tenant middleware behavior.
class TenantMiddleware(BaseHTTPMiddleware):
    """
    Extract tenant information from a valid access token.

    This middleware provides request context only. It does not replace
    endpoint authentication or repository-level company filtering.
    """

    # Runs dispatch logic.
    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        request.state.company_id = None
        request.state.user_id = None
        request.state.user_role = None

        # Stores authorization header for the next steps.
        authorization_header = request.headers.get(
            "authorization",
        )

        # Checks whether this condition is true.
        if authorization_header:
            scheme, _, token = authorization_header.partition(
                " ",
            )

            # Checks whether this condition is true.
            if (
                scheme.lower() == "bearer"
                and token
            ):
                # Tries this work and watches for errors.
                try:
                    # Stores payload for the next steps.
                    payload = decode_access_token(
                        token,
                    )

                    # Stores company id for the next steps.
                    company_id = payload.get("companyId")
                    # Stores user id for the next steps.
                    user_id = payload.get("sub")
                    # Stores role for the next steps.
                    role = payload.get("role")

                    # Checks whether this condition is true.
                    if company_id:
                        request.state.company_id = UUID(
                            str(company_id),
                        )

                    # Checks whether this condition is true.
                    if user_id:
                        request.state.user_id = UUID(
                            str(user_id),
                        )

                    request.state.user_role = role
                # Handles the error raised by the work above.
                except Exception:
                    # Authentication dependencies return the proper
                    # HTTP error for invalid or expired tokens.
                    pass

        # Returns the completed value to the caller.
        return await call_next(request)