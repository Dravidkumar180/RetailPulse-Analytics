from typing import TYPE_CHECKING

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import (
    Base,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
)

if TYPE_CHECKING:
    from app.models.audit_log import AuditLog
    from app.models.user import User
    from app.models.catalog import Category, Product


class Company(
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    Base,
):
    __tablename__ = "companies"

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        unique=True,
        index=True,
    )

    industry: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
        index=True,
    )

    address: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    phone: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    users: Mapped[list["User"]] = relationship(
        back_populates="company",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    audit_logs: Mapped[list["AuditLog"]] = relationship(
        back_populates="company",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    categories: Mapped[list["Category"]] = relationship(
        back_populates="company", cascade="all, delete-orphan", passive_deletes=True,
    )
    products: Mapped[list["Product"]] = relationship(
        back_populates="company", cascade="all, delete-orphan", passive_deletes=True,
    )

    def __repr__(self) -> str:
        return (
            f"<Company id={self.id} "
            f"name={self.name!r}>"
        )
