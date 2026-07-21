# Teaching guide: This file contains company database tables.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from typing import TYPE_CHECKING

# Imports the needed names from sqlalchemy.
from sqlalchemy import String, Text
# Imports the needed names from sqlalchemy.orm.
from sqlalchemy.orm import Mapped, mapped_column, relationship

# Imports the needed names from app.models.base.
from app.models.base import (
    Base,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
)

# Checks whether this condition is true.
if TYPE_CHECKING:
    # Imports the needed names from app.models.audit_log.
    from app.models.audit_log import AuditLog
    # Imports the needed names from app.models.user.
    from app.models.user import User
    # Imports the needed names from app.models.catalog.
    from app.models.catalog import Category, Product
    # Imports the needed names from app.models.sales.
    from app.models.sales import Sale


# Groups company behavior.
class Company(
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    Base,
):
    # Stores  tablename  for the next steps.
    __tablename__ = "companies"

    # Stores name for the next steps.
    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        unique=True,
        index=True,
    )

    # Stores industry for the next steps.
    industry: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    # Stores email for the next steps.
    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
        index=True,
    )

    # Stores address for the next steps.
    address: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # Stores phone for the next steps.
    phone: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    # Stores users for the next steps.
    users: Mapped[list["User"]] = relationship(
        back_populates="company",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    # Stores audit logs for the next steps.
    audit_logs: Mapped[list["AuditLog"]] = relationship(
        back_populates="company",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    # Stores categories for the next steps.
    categories: Mapped[list["Category"]] = relationship(
        back_populates="company", cascade="all, delete-orphan", passive_deletes=True,
    )
    # Stores products for the next steps.
    products: Mapped[list["Product"]] = relationship(
        back_populates="company", cascade="all, delete-orphan", passive_deletes=True,
    )
    # Stores sales for the next steps.
    sales: Mapped[list["Sale"]] = relationship(
        back_populates="company", cascade="all, delete-orphan", passive_deletes=True,
    )

    def __repr__(self) -> str:
        # Returns the completed value to the caller.
        return (
            f"<Company id={self.id} "
            f"name={self.name!r}>"
        )
