from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import (
    Session,
    sessionmaker,
)

from app.core.config import settings
from app.models.base import Base


engine = create_engine(
    settings.DATABASE_URL,
    connect_args=(
        {"check_same_thread": False}
        if settings.DATABASE_URL.startswith("sqlite")
        else {}
    ),
    pool_pre_ping=True,
    pool_recycle=1800,
    echo=settings.DEBUG,
)

SessionLocal = sessionmaker(
    bind=engine,
    class_=Session,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)


def get_db() -> Generator[Session, None, None]:
    """
    Provide one SQLAlchemy Session per request.

    Transactions should normally be committed by the service responsible
    for the business operation.
    """
    db = SessionLocal()

    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def check_database_connection() -> None:
    """Raise an error during startup when PostgreSQL is unavailable."""
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))


def initialize_development_database() -> None:
    """Create local SQLite tables when PostgreSQL is unavailable in development."""
    if settings.DATABASE_URL.startswith("sqlite"):
        Base.metadata.create_all(bind=engine)
