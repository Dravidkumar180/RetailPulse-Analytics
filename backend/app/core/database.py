# Teaching guide: This file contains database application logic.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from collections.abc import Generator

# Imports the needed names from sqlalchemy.
from sqlalchemy import create_engine, inspect, text
# Imports the needed names from sqlalchemy.orm.
from sqlalchemy.orm import (
    Session,
    sessionmaker,
)

# Imports the needed names from app.core.config.
from app.core.config import settings
# Imports the needed names from app.models.base.
from app.models.base import Base


# Stores engine for the next steps.
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

# Stores session local for the next steps.
SessionLocal = sessionmaker(
    bind=engine,
    class_=Session,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)


# Gets db.
def get_db() -> Generator[Session, None, None]:
    """
    Provide one SQLAlchemy Session per request.

    Transactions should normally be committed by the service responsible
    # Repeats this work for the matching values.
    for the business operation.
    """
    # Stores db for the next steps.
    db = SessionLocal()

    # Tries this work and watches for errors.
    try:
        yield db
    # Handles the error raised by the work above.
    except Exception:
        # Applies this change to the database session.
        db.rollback()
        # Stops here and reports the problem.
        raise
    # Always runs this cleanup step.
    finally:
        db.close()


# Checks database connection.
def check_database_connection() -> None:
    """Raise an error during startup when PostgreSQL is unavailable."""
    # Opens this resource safely for the current block.
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))


# Runs initialize development database logic.
def initialize_development_database() -> None:
    """Create local SQLite tables when PostgreSQL is unavailable in development."""
    # Checks whether this condition is true.
    if settings.DATABASE_URL.startswith("sqlite"):
        Base.metadata.create_all(bind=engine)
        # SQLite's create_all does not add columns to existing local tables.
        # Keep the development database compatible with additive migrations.
        existing_columns = {
            column["name"]
            for column in inspect(engine).get_columns("audit_logs")
        }
        # Checks whether this condition is true.
        if "details" not in existing_columns:
            # Opens this resource safely for the current block.
            with engine.begin() as connection:
                connection.execute(
                    text("ALTER TABLE audit_logs ADD COLUMN details TEXT")
                )
