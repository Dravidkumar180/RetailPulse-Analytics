# Teaching guide: This file contains exceptions application logic.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from typing import Any

# Imports the needed names from fastapi.
from fastapi import FastAPI, Request, status
# Imports the needed names from fastapi.exceptions.
from fastapi.exceptions import RequestValidationError
# Imports the needed names from fastapi.responses.
from fastapi.responses import JSONResponse
# Imports the needed names from sqlalchemy.exc.
from sqlalchemy.exc import IntegrityError, SQLAlchemyError


# Groups application exception behavior.
class ApplicationException(Exception):
    def __init__(
        self,
        *,
        status_code: int,
        detail: str,
        error_code: str,
        headers: dict[str, str] | None = None,
    ) -> None:
        self.status_code = status_code
        self.detail = detail
        self.error_code = error_code
        self.headers = headers or {}

        super().__init__(detail)


# Groups authentication exception behavior.
class AuthenticationException(ApplicationException):
    def __init__(
        self,
        detail: str = "Authentication failed.",
    ) -> None:
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            error_code="AUTHENTICATION_FAILED",
            headers={
                "WWW-Authenticate": "Bearer",
            },
        )


# Groups invalid credentials exception behavior.
class InvalidCredentialsException(AuthenticationException):
    def __init__(self) -> None:
        super().__init__(
            detail="Incorrect email address or password.",
        )
        self.error_code = "INVALID_CREDENTIALS"


# Groups invalid token exception behavior.
class InvalidTokenException(AuthenticationException):
    def __init__(
        self,
        detail: str = "The supplied token is invalid.",
    ) -> None:
        super().__init__(detail=detail)
        self.error_code = "INVALID_TOKEN"


# Groups expired token exception behavior.
class ExpiredTokenException(AuthenticationException):
    def __init__(self) -> None:
        super().__init__(
            detail="The supplied token has expired.",
        )
        self.error_code = "TOKEN_EXPIRED"


# Groups authorization exception behavior.
class AuthorizationException(ApplicationException):
    def __init__(
        self,
        detail: str = (
            "You do not have permission to perform this action."
        ),
    ) -> None:
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="ACCESS_DENIED",
        )


# Groups account inactive exception behavior.
class AccountInactiveException(ApplicationException):
    def __init__(self) -> None:
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is inactive.",
            error_code="ACCOUNT_INACTIVE",
        )


# Groups account suspended exception behavior.
class AccountSuspendedException(ApplicationException):
    def __init__(self) -> None:
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been suspended.",
            error_code="ACCOUNT_SUSPENDED",
        )


# Groups resource not found exception behavior.
class ResourceNotFoundException(ApplicationException):
    def __init__(
        self,
        resource_name: str = "Resource",
    ) -> None:
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource_name} was not found.",
            error_code="RESOURCE_NOT_FOUND",
        )


# Groups conflict exception behavior.
class ConflictException(ApplicationException):
    def __init__(
        self,
        detail: str,
        error_code: str = "RESOURCE_CONFLICT",
    ) -> None:
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
            error_code=error_code,
        )


# Groups company already exists exception behavior.
class CompanyAlreadyExistsException(ConflictException):
    def __init__(self) -> None:
        super().__init__(
            detail=(
                "A company with this name or email already exists."
            ),
            error_code="COMPANY_ALREADY_EXISTS",
        )


# Groups email already exists exception behavior.
class EmailAlreadyExistsException(ConflictException):
    def __init__(self) -> None:
        super().__init__(
            detail=(
                "An account with this email address already exists."
            ),
            error_code="EMAIL_ALREADY_EXISTS",
        )


# Groups invalid password exception behavior.
class InvalidPasswordException(ApplicationException):
    def __init__(
        self,
        detail: str = "The supplied password is invalid.",
    ) -> None:
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            error_code="INVALID_PASSWORD",
        )


# Adds exception handlers.
def register_exception_handlers(
    app: FastAPI,
) -> None:
    # Runs application exception handler logic.
    @app.exception_handler(ApplicationException)
    async def application_exception_handler(
        _: Request,
        exc: ApplicationException,
    ) -> JSONResponse:
        # Returns the completed value to the caller.
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": exc.detail,
                "errorCode": exc.error_code,
            },
            headers=exc.headers,
        )

    # Runs request validation exception handler logic.
    @app.exception_handler(RequestValidationError)
    async def request_validation_exception_handler(
        _: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        # Stores field errors for the next steps.
        field_errors: dict[str, list[str]] = {}

        # Repeats this work for the matching values.
        for error in exc.errors():
            # Stores location for the next steps.
            location = error.get("loc", ())
            # Stores field name for the next steps.
            field_name = ".".join(
                str(part)
                for part in location
                if part not in {"body", "query", "path"}
            )

            # Checks whether this condition is true.
            if not field_name:
                # Stores field name for the next steps.
                field_name = "request"

            field_errors.setdefault(
                field_name,
                [],
            ).append(
                str(error.get("msg", "Invalid value."))
            )

        # Returns the completed value to the caller.
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "detail": "Request validation failed.",
                "errorCode": "VALIDATION_ERROR",
                "errors": field_errors,
            },
        )

    # Runs integrity error handler logic.
    @app.exception_handler(IntegrityError)
    async def integrity_error_handler(
        _: Request,
        __: IntegrityError,
    ) -> JSONResponse:
        # Returns the completed value to the caller.
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "detail": (
                    "The requested operation conflicts with "
                    "existing data."
                ),
                "errorCode": "DATABASE_CONFLICT",
            },
        )

    # Runs database error handler logic.
    @app.exception_handler(SQLAlchemyError)
    async def database_error_handler(
        _: Request,
        __: SQLAlchemyError,
    ) -> JSONResponse:
        # Returns the completed value to the caller.
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "A database operation failed.",
                "errorCode": "DATABASE_ERROR",
            },
        )

    # Runs unexpected exception handler logic.
    @app.exception_handler(Exception)
    async def unexpected_exception_handler(
        _: Request,
        __: Exception,
    ) -> JSONResponse:
        # Returns the completed value to the caller.
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "An unexpected server error occurred.",
                "errorCode": "INTERNAL_SERVER_ERROR",
            },
        )