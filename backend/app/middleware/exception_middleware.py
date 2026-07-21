# Teaching guide: This file contains exception middleware request processing.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

import logging
# Imports the needed names from uuid.
from uuid import uuid4

# Imports the needed names from fastapi.
from fastapi import status
# Imports the needed names from fastapi.responses.
from fastapi.responses import JSONResponse
# Imports the needed names from sqlalchemy.exc.
from sqlalchemy.exc import SQLAlchemyError
# Imports the needed names from starlette.middleware.base.
from starlette.middleware.base import (
    BaseHTTPMiddleware,
    RequestResponseEndpoint,
)
# Imports the needed names from starlette.requests.
from starlette.requests import Request
# Imports the needed names from starlette.responses.
from starlette.responses import Response

# Imports the needed names from app.core.config.
from app.core.config import settings
# Imports the needed names from app.core.exceptions.
from app.core.exceptions import ApplicationException


# Stores logger for the next steps.
logger = logging.getLogger(__name__)


# Groups exception middleware behavior.
class ExceptionMiddleware(BaseHTTPMiddleware):
    """
    Final safety net for unexpected middleware-level errors.

    FastAPI exception handlers should continue handling endpoint and
    validation exceptions.
    """

    # Runs dispatch logic.
    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        # Tries this work and watches for errors.
        try:
            # Returns the completed value to the caller.
            return await call_next(request)

        # Handles the error raised by the work above.
        except ApplicationException as exc:
            # Returns the completed value to the caller.
            return JSONResponse(
                status_code=exc.status_code,
                content={
                    "detail": exc.detail,
                    "errorCode": exc.error_code,
                    "requestId": getattr(
                        request.state,
                        "request_id",
                        None,
                    ),
                },
                headers=exc.headers,
            )

        # Handles the error raised by the work above.
        except SQLAlchemyError:
            # Stores request id for the next steps.
            request_id = getattr(
                request.state,
                "request_id",
                str(uuid4()),
            )

            logger.exception(
                "Database error. request_id=%s",
                request_id,
            )

            # Returns the completed value to the caller.
            return JSONResponse(
                status_code=(
                    status.HTTP_500_INTERNAL_SERVER_ERROR
                ),
                content={
                    "detail": "A database operation failed.",
                    "errorCode": "DATABASE_ERROR",
                    "requestId": request_id,
                },
            )

        # Handles the error raised by the work above.
        except Exception:
            # Stores request id for the next steps.
            request_id = getattr(
                request.state,
                "request_id",
                str(uuid4()),
            )

            logger.exception(
                "Unhandled application error. request_id=%s",
                request_id,
            )

            # Stores content for the next steps.
            content: dict[str, str] = {
                "detail": (
                    "An unexpected server error occurred."
                ),
                "errorCode": "INTERNAL_SERVER_ERROR",
                "requestId": request_id,
            }

            # Checks whether this condition is true.
            if settings.DEBUG:
                content["environment"] = (
                    settings.ENVIRONMENT
                )

            # Returns the completed value to the caller.
            return JSONResponse(
                status_code=(
                    status.HTTP_500_INTERNAL_SERVER_ERROR
                ),
                content=content,
            )