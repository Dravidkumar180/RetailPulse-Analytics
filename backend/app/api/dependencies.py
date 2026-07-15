from collections.abc import Generator
from app.utils.request_info import (
    get_browser_name,
    get_client_ip,
    get_user_agent,
)

from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.core.database import get_db


DatabaseSession = Annotated[Session, Depends(get_db)]


def get_client_ip(request: Request) -> str:
    """
    Extract the originating client IP.

    X-Forwarded-For is useful when the API is behind Nginx or another
    trusted reverse proxy. Configure the proxy carefully so clients cannot
    freely spoof this header.
    """
    forwarded_for = request.headers.get("x-forwarded-for")

    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    if request.client:
        return request.client.host

    return "unknown"


def get_browser(request: Request) -> str:
    """Return the browser/user-agent information for audit logging."""
    return request.headers.get("user-agent", "unknown")


ClientIp = Annotated[str, Depends(get_client_ip)]
BrowserInfo = Annotated[str, Depends(get_browser)]

__all__ = [
    "DatabaseSession",
    "ClientIp",
    "BrowserInfo",
]