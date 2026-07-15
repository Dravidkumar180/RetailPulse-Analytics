from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api_router import api_router
from app.core.config import settings
from app.core.database import (
    check_database_connection,
    initialize_development_database,
)
from app.core.exceptions import register_exception_handlers
from app.middleware import (
    AuditMiddleware,
    ExceptionMiddleware,
    RequestContextMiddleware,
    TenantMiddleware,
)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """
    Run application startup and shutdown tasks.

    Database tables should be created and updated through Alembic.
    This startup check only verifies that PostgreSQL is reachable.
    """
    initialize_development_database()
    check_database_connection()

    yield


app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "RetailPulse Analytics API with secure authentication, "
        "role-based authorization and multi-company tenant isolation."
    ),
    version=settings.API_VERSION,
    debug=settings.DEBUG,
    docs_url="/docs" if settings.ENABLE_DOCS else None,
    redoc_url="/redoc" if settings.ENABLE_DOCS else None,
    openapi_url="/openapi.json" if settings.ENABLE_DOCS else None,
    lifespan=lifespan,
)


# ---------------------------------------------------------
# Application middleware
# ---------------------------------------------------------

app.add_middleware(
    ExceptionMiddleware,
)

app.add_middleware(
    RequestContextMiddleware,
)

app.add_middleware(
    TenantMiddleware,
)

app.add_middleware(
    AuditMiddleware,
)


# ---------------------------------------------------------
# CORS middleware
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# Exception handlers
# ---------------------------------------------------------

register_exception_handlers(app)


# ---------------------------------------------------------
# API routes
# ---------------------------------------------------------

app.include_router(
    api_router,
    prefix=settings.API_V1_PREFIX,
)


# ---------------------------------------------------------
# Root endpoint
# ---------------------------------------------------------

@app.get(
    "/",
    tags=["Root"],
    summary="API root",
)
def root() -> dict[str, str]:
    return {
        "application": settings.APP_NAME,
        "message": "RetailPulse Analytics API is running.",
        "documentation": "/docs",
    }
