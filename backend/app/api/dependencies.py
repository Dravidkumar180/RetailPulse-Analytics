# Teaching guide: This file contains API requests and responses for dependencies.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from collections.abc import Generator
# Imports the needed names from app.utils.request_info.
from app.utils.request_info import (
    get_browser_name,
    get_client_ip,
    get_user_agent,
)

# Imports the needed names from typing.
from typing import Annotated

# Imports the needed names from fastapi.
from fastapi import Depends, Request
# Imports the needed names from sqlalchemy.orm.
from sqlalchemy.orm import Session

# Imports the needed names from app.core.database.
from app.core.database import get_db


# Stores database session for the next steps.
DatabaseSession = Annotated[Session, Depends(get_db)]


# Gets client ip.
def get_client_ip(request: Request) -> str:
    """
    Extract the originating client IP.

    X-Forwarded-For is useful when the API is behind Nginx or another
    trusted reverse proxy. Configure the proxy carefully so clients cannot
    freely spoof this header.
    """
    # Stores forwarded for for the next steps.
    forwarded_for = request.headers.get("x-forwarded-for")

    # Checks whether this condition is true.
    if forwarded_for:
        # Returns the completed value to the caller.
        return forwarded_for.split(",")[0].strip()

    # Checks whether this condition is true.
    if request.client:
        # Returns the completed value to the caller.
        return request.client.host

    # Returns the completed value to the caller.
    return "unknown"


# Gets browser.
def get_browser(request: Request) -> str:
    """Return the browser/user-agent information for audit logging."""
    # Returns the completed value to the caller.
    return request.headers.get("user-agent", "unknown")


# Stores client ip for the next steps.
ClientIp = Annotated[str, Depends(get_client_ip)]
# Stores browser info for the next steps.
BrowserInfo = Annotated[str, Depends(get_browser)]

# Stores  all  for the next steps.
__all__ = [
    "DatabaseSession",
    "ClientIp",
    "BrowserInfo",
]