# Teaching guide: This file contains main application logic.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from contextlib import asynccontextmanager
# Imports the needed names from typing.
from typing import AsyncIterator

# Imports the needed names from fastapi.
from fastapi import FastAPI
# Imports the needed names from fastapi.middleware.cors.
from fastapi.middleware.cors import CORSMiddleware

# Imports the needed names from app.api.v1.api_router.
from app.api.v1.api_router import api_router
# Imports the needed names from app.core.config.
from app.core.config import settings
# Imports the needed names from app.core.database.
from app.core.database import (
    check_database_connection,
    initialize_development_database,
)
# Imports the needed names from app.core.exceptions.
from app.core.exceptions import register_exception_handlers
# Imports the needed names from app.middleware.
from app.middleware import (
    AuditMiddleware,
    ExceptionMiddleware,
    RequestContextMiddleware,
    TenantMiddleware,
)


# Runs lifespan logic.
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


# Stores app for the next steps.
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
# Runs root logic.
def root() -> dict[str, str]:
    # Returns the completed value to the caller.
    return {
        "application": settings.APP_NAME,
        "message": "RetailPulse Analytics API is running.",
        "documentation": "/docs",
    }
