# Teaching guide: This file contains request info helper logic.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from dataclasses import dataclass

# Imports the needed names from fastapi.
from fastapi import Request


# Groups request information behavior.
@dataclass(frozen=True, slots=True)
class RequestInformation:
    ip_address: str
    browser: str
    user_agent: str
    request_id: str | None


# Gets client ip.
def get_client_ip(
    request: Request,
) -> str:
    # Stores state ip for the next steps.
    state_ip = getattr(
        request.state,
        "client_ip",
        None,
    )

    # Checks whether this condition is true.
    if state_ip:
        # Returns the completed value to the caller.
        return str(state_ip)

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


# Gets user agent.
def get_user_agent(
    request: Request,
) -> str:
    # Returns the completed value to the caller.
    return request.headers.get(
        "user-agent",
        "unknown",
    )


# Gets browser name.
def get_browser_name(
    user_agent: str,
) -> str:
    # Stores normalized agent for the next steps.
    normalized_agent = user_agent.lower()

    # Checks whether this condition is true.
    if "edg/" in normalized_agent:
        # Returns the completed value to the caller.
        return "Microsoft Edge"

    # Checks whether this condition is true.
    if (
        "chrome/" in normalized_agent
        and "chromium" not in normalized_agent
    ):
        # Returns the completed value to the caller.
        return "Google Chrome"

    # Checks whether this condition is true.
    if "firefox/" in normalized_agent:
        # Returns the completed value to the caller.
        return "Mozilla Firefox"

    # Checks whether this condition is true.
    if (
        "safari/" in normalized_agent
        and "chrome/" not in normalized_agent
    ):
        # Returns the completed value to the caller.
        return "Safari"

    # Checks whether this condition is true.
    if "opera/" in normalized_agent or "opr/" in normalized_agent:
        # Returns the completed value to the caller.
        return "Opera"

    # Checks whether this condition is true.
    if "postmanruntime/" in normalized_agent:
        # Returns the completed value to the caller.
        return "Postman"

    # Checks whether this condition is true.
    if "swagger" in normalized_agent:
        # Returns the completed value to the caller.
        return "Swagger UI"

    # Returns the completed value to the caller.
    return "Unknown Browser"


# Gets request information.
def get_request_information(
    request: Request,
) -> RequestInformation:
    # Stores user agent for the next steps.
    user_agent = get_user_agent(request)

    # Returns the completed value to the caller.
    return RequestInformation(
        ip_address=get_client_ip(request),
        browser=get_browser_name(user_agent),
        user_agent=user_agent[:500],
        request_id=getattr(
            request.state,
            "request_id",
            None,
        ),
    )