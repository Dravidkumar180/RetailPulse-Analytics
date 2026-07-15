from contextvars import ContextVar, Token
from time import perf_counter
from uuid import uuid4

from starlette.middleware.base import (
    BaseHTTPMiddleware,
    RequestResponseEndpoint,
)
from starlette.requests import Request
from starlette.responses import Response


request_id_context: ContextVar[str | None] = ContextVar(
    "request_id",
    default=None,
)

client_ip_context: ContextVar[str | None] = ContextVar(
    "client_ip",
    default=None,
)

browser_context: ContextVar[str | None] = ContextVar(
    "browser",
    default=None,
)


def get_request_id() -> str | None:
    return request_id_context.get()


def get_context_client_ip() -> str | None:
    return client_ip_context.get()


def get_context_browser() -> str | None:
    return browser_context.get()


def extract_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get(
        "x-forwarded-for",
    )

    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    real_ip = request.headers.get("x-real-ip")

    if real_ip:
        return real_ip.strip()

    if request.client:
        return request.client.host

    return "unknown"


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        request_id = (
            request.headers.get("x-request-id")
            or str(uuid4())
        )

        client_ip = extract_client_ip(request)
        browser = request.headers.get(
            "user-agent",
            "unknown",
        )

        request_id_token: Token[str | None] = (
            request_id_context.set(request_id)
        )

        client_ip_token: Token[str | None] = (
            client_ip_context.set(client_ip)
        )

        browser_token: Token[str | None] = (
            browser_context.set(browser)
        )

        request.state.request_id = request_id
        request.state.client_ip = client_ip
        request.state.browser = browser

        started_at = perf_counter()

        try:
            response = await call_next(request)

            response.headers["X-Request-ID"] = request_id

            elapsed_time = perf_counter() - started_at

            response.headers["X-Process-Time"] = (
                f"{elapsed_time:.4f}"
            )

            return response
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