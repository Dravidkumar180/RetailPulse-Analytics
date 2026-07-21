# Teaching guide: This file contains request context request processing.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from contextvars import ContextVar, Token
# Imports the needed names from time.
from time import perf_counter
# Imports the needed names from uuid.
from uuid import uuid4

# Imports the needed names from starlette.middleware.base.
from starlette.middleware.base import (
    BaseHTTPMiddleware,
    RequestResponseEndpoint,
)
# Imports the needed names from starlette.requests.
from starlette.requests import Request
# Imports the needed names from starlette.responses.
from starlette.responses import Response


# Stores request id context for the next steps.
request_id_context: ContextVar[str | None] = ContextVar(
    "request_id",
    default=None,
)

# Stores client ip context for the next steps.
client_ip_context: ContextVar[str | None] = ContextVar(
    "client_ip",
    default=None,
)

# Stores browser context for the next steps.
browser_context: ContextVar[str | None] = ContextVar(
    "browser",
    default=None,
)


# Gets request id.
def get_request_id() -> str | None:
    # Returns the completed value to the caller.
    return request_id_context.get()


# Gets context client ip.
def get_context_client_ip() -> str | None:
    # Returns the completed value to the caller.
    return client_ip_context.get()


# Gets context browser.
def get_context_browser() -> str | None:
    # Returns the completed value to the caller.
    return browser_context.get()


# Runs extract client ip logic.
def extract_client_ip(request: Request) -> str:
    # Stores forwarded for for the next steps.
    forwarded_for = request.headers.get(
        "x-forwarded-for",
    )

    # Checks whether this condition is true.
    if forwarded_for:
        # Returns the completed value to the caller.
        return forwarded_for.split(",")[0].strip()

    # Stores real ip for the next steps.
    real_ip = request.headers.get("x-real-ip")

    # Checks whether this condition is true.
    if real_ip:
        # Returns the completed value to the caller.
        return real_ip.strip()

    # Checks whether this condition is true.
    if request.client:
        # Returns the completed value to the caller.
        return request.client.host

    # Returns the completed value to the caller.
    return "unknown"


# Groups request context middleware behavior.
class RequestContextMiddleware(BaseHTTPMiddleware):
    # Runs dispatch logic.
    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        # Stores request id for the next steps.
        request_id = (
            request.headers.get("x-request-id")
            or str(uuid4())
        )

        # Stores client ip for the next steps.
        client_ip = extract_client_ip(request)
        # Stores browser for the next steps.
        browser = request.headers.get(
            "user-agent",
            "unknown",
        )

        # Stores request id token for the next steps.
        request_id_token: Token[str | None] = (
            request_id_context.set(request_id)
        )

        # Stores client ip token for the next steps.
        client_ip_token: Token[str | None] = (
            client_ip_context.set(client_ip)
        )

        # Stores browser token for the next steps.
        browser_token: Token[str | None] = (
            browser_context.set(browser)
        )

        request.state.request_id = request_id
        request.state.client_ip = client_ip
        request.state.browser = browser

        # Stores started at for the next steps.
        started_at = perf_counter()

        # Tries this work and watches for errors.
        try:
            # Stores response for the next steps.
            response = await call_next(request)

            response.headers["X-Request-ID"] = request_id

            # Stores elapsed time for the next steps.
            elapsed_time = perf_counter() - started_at

            response.headers["X-Process-Time"] = (
                f"{elapsed_time:.4f}"
            )

            # Returns the completed value to the caller.
            return response
        # Always runs this cleanup step.
        finally:
            request_id_context.reset(
                request_id_token,
            )
            client_ip_context.reset(
                client_ip_token,
            )
            browser_context.reset(
                browser_token,
            )