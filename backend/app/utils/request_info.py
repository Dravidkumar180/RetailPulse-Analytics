from dataclasses import dataclass

from fastapi import Request


@dataclass(frozen=True, slots=True)
class RequestInformation:
    ip_address: str
    browser: str
    user_agent: str
    request_id: str | None


def get_client_ip(
    request: Request,
) -> str:
    state_ip = getattr(
        request.state,
        "client_ip",
        None,
    )

    if state_ip:
        return str(state_ip)

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


def get_user_agent(
    request: Request,
) -> str:
    return request.headers.get(
        "user-agent",
        "unknown",
    )


def get_browser_name(
    user_agent: str,
) -> str:
    normalized_agent = user_agent.lower()

    if "edg/" in normalized_agent:
        return "Microsoft Edge"

    if (
        "chrome/" in normalized_agent
        and "chromium" not in normalized_agent
    ):
        return "Google Chrome"

    if "firefox/" in normalized_agent:
        return "Mozilla Firefox"

    if (
        "safari/" in normalized_agent
        and "chrome/" not in normalized_agent
    ):
        return "Safari"

    if "opera/" in normalized_agent or "opr/" in normalized_agent:
        return "Opera"

    if "postmanruntime/" in normalized_agent:
        return "Postman"

    if "swagger" in normalized_agent:
        return "Swagger UI"

    return "Unknown Browser"


def get_request_information(
    request: Request,
) -> RequestInformation:
    user_agent = get_user_agent(request)

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