from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, SQLAlchemyError


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


class InvalidCredentialsException(AuthenticationException):
    def __init__(self) -> None:
        super().__init__(
            detail="Incorrect email address or password.",
        )
        self.error_code = "INVALID_CREDENTIALS"


class InvalidTokenException(AuthenticationException):
    def __init__(
        self,
        detail: str = "The supplied token is invalid.",
    ) -> None:
        super().__init__(detail=detail)
        self.error_code = "INVALID_TOKEN"


class ExpiredTokenException(AuthenticationException):
    def __init__(self) -> None:
        super().__init__(
            detail="The supplied token has expired.",
        )
        self.error_code = "TOKEN_EXPIRED"


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


class AccountInactiveException(ApplicationException):
    def __init__(self) -> None:
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is inactive.",
            error_code="ACCOUNT_INACTIVE",
        )


class AccountSuspendedException(ApplicationException):
    def __init__(self) -> None:
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been suspended.",
            error_code="ACCOUNT_SUSPENDED",
        )


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


class CompanyAlreadyExistsException(ConflictException):
    def __init__(self) -> None:
        super().__init__(
            detail=(
                "A company with this name or email already exists."
            ),
            error_code="COMPANY_ALREADY_EXISTS",
        )


class EmailAlreadyExistsException(ConflictException):
    def __init__(self) -> None:
        super().__init__(
            detail=(
                "An account with this email address already exists."
            ),
            error_code="EMAIL_ALREADY_EXISTS",
        )


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


def register_exception_handlers(
    app: FastAPI,
) -> None:
    @app.exception_handler(ApplicationException)
    async def application_exception_handler(
        _: Request,
        exc: ApplicationException,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": exc.detail,
                "errorCode": exc.error_code,
            },
            headers=exc.headers,
        )

    @app.exception_handler(RequestValidationError)
    async def request_validation_exception_handler(
        _: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        field_errors: dict[str, list[str]] = {}

        for error in exc.errors():
            location = error.get("loc", ())
            field_name = ".".join(
                str(part)
                for part in location
                if part not in {"body", "query", "path"}
            )

            if not field_name:
                field_name = "request"

            field_errors.setdefault(
                field_name,
                [],
            ).append(
                str(error.get("msg", "Invalid value."))
            )

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "detail": "Request validation failed.",
                "errorCode": "VALIDATION_ERROR",
                "errors": field_errors,
            },
        )

    @app.exception_handler(IntegrityError)
    async def integrity_error_handler(
        _: Request,
        __: IntegrityError,
    ) -> JSONResponse:
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

    @app.exception_handler(SQLAlchemyError)
    async def database_error_handler(
        _: Request,
        __: SQLAlchemyError,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "A database operation failed.",
                "errorCode": "DATABASE_ERROR",
            },
        )

    @app.exception_handler(Exception)
    async def unexpected_exception_handler(
        _: Request,
        __: Exception,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "An unexpected server error occurred.",
                "errorCode": "INTERNAL_SERVER_ERROR",
            },
        )