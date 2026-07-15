from datetime import UTC, datetime

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db


router = APIRouter()


@router.get(
    "",
    summary="Application health check",
)
def health_check() -> dict[str, str]:
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
def database_health_check(
    db: Session = Depends(get_db),
) -> dict[str, str]:
    db.execute(text("SELECT 1"))

    return {
        "status": "healthy",
        "database": "connected",
    }