# Teaching guide: This file contains base database tables.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from datetime import UTC, datetime
# Imports the needed names from uuid.
from uuid import UUID, uuid4

# Imports the needed names from sqlalchemy.
from sqlalchemy import DateTime, MetaData
# Imports the needed names from sqlalchemy.dialects.postgresql.
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
# Imports the needed names from sqlalchemy.orm.
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


# Stores naming convention for the next steps.
NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


# Groups base behavior.
class Base(DeclarativeBase):
    # Stores metadata for the next steps.
    metadata = MetaData(naming_convention=NAMING_CONVENTION)


# Groups uuidprimary key mixin behavior.
class UUIDPrimaryKeyMixin:
    # Stores id for the next steps.
    id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )


# Groups timestamp mixin behavior.
class TimestampMixin:
    # Stores created at for the next steps.
    created_at: Mapped[datetime] = mapped_column(
        "createdAt",
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
    )

    # Stores updated at for the next steps.
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt",
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )