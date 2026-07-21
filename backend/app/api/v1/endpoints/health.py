# Teaching guide: This file contains API requests and responses for health.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from datetime import UTC, datetime

# Imports the needed names from fastapi.
from fastapi import APIRouter, Depends
# Imports the needed names from sqlalchemy.
from sqlalchemy import text
# Imports the needed names from sqlalchemy.orm.
from sqlalchemy.orm import Session

# Imports the needed names from app.core.config.
from app.core.config import settings
# Imports the needed names from app.core.database.
from app.core.database import get_db


# Stores router for the next steps.
router = APIRouter()


@router.get(
    "",
    summary="Application health check",
)
# Runs health check logic.
def health_check() -> dict[str, str]:
    # Returns the completed value to the caller.
    return {
        "status": "healthy",
        "application": settings.APP_NAME,
        "version": settings.API_VERSION,
        "timestamp": datetime.now(UTC).isoformat(),
    }


@router.get(
    "/database",
    summary="Database health check",
)
# Runs database health check logic.
def database_health_check(
    db: Session = Depends(get_db),
) -> dict[str, str]:
    db.execute(text("SELECT 1"))

    # Returns the completed value to the caller.
    return {
        "status": "healthy",
        "database": "connected",
    }