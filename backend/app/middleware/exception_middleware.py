import logging
from uuid import uuid4

from fastapi import status
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from starlette.middleware.base import (
    BaseHTTPMiddleware,
    RequestResponseEndpoint,
)
from starlette.requests import Request
from starlette.responses import Response

from app.core.config import settings
from app.core.exceptions import ApplicationException


logger = logging.getLogger(__name__)


class ExceptionMiddleware(BaseHTTPMiddleware):
    """
    Final safety net for unexpected middleware-level errors.

    FastAPI exception handlers should continue handling endpoint and
    validation exceptions.
    """

    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        try:
            return await call_next(request)

        except ApplicationException as exc:
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

        except SQLAlchemyError:
            request_id = getattr(
                request.state,
                "request_id",
                str(uuid4()),
            )

            logger.exception(
                "Database error. request_id=%s",
                request_id,
            )

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

        except Exception:
            request_id = getattr(
                request.state,
                "request_id",
                str(uuid4()),
            )

            logger.exception(
                "Unhandled application error. request_id=%s",
                request_id,
            )

            content: dict[str, str] = {
                "detail": (
                    "An unexpected server error occurred."
                ),
                "errorCode": "INTERNAL_SERVER_ERROR",
                "requestId": request_id,
            }

            if settings.DEBUG:
                content["environment"] = (
                    settings.ENVIRONMENT
                )

            return JSONResponse(
                status_code=(
                    status.HTTP_500_INTERNAL_SERVER_ERROR
                ),
                content=content,
            )