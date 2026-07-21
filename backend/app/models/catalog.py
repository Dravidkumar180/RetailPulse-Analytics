# Teaching guide: This file contains catalog database tables.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from decimal import Decimal
# Imports the needed names from typing.
from typing import TYPE_CHECKING
# Imports the needed names from uuid.
from uuid import UUID

# Imports the needed names from sqlalchemy.
from sqlalchemy import CheckConstraint, ForeignKey, Index, Numeric, String, Text, UniqueConstraint
# Imports the needed names from sqlalchemy.dialects.postgresql.
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
# Imports the needed names from sqlalchemy.orm.
from sqlalchemy.orm import Mapped, mapped_column, relationship

# Imports the needed names from app.models.base.
from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

# Checks whether this condition is true.
if TYPE_CHECKING:
    # Imports the needed names from app.models.company.
    from app.models.company import Company
    # Imports the needed names from app.models.sales.
    from app.models.sales import SaleItem


# Groups category behavior.
class Category(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    # Stores  tablename  for the next steps.
    __tablename__ = "categories"
    # Stores  table args  for the next steps.
    __table_args__ = (UniqueConstraint("companyId", "name", name="uq_categories_company_name"),)

    # Stores company id for the next steps.
    company_id: Mapped[UUID] = mapped_column("companyId", PostgreSQLUUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    # Stores name for the next steps.
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    # Stores description for the next steps.
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Stores status for the next steps.
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="ACTIVE")
    # Stores company for the next steps.
    company: Mapped["Company"] = relationship(back_populates="categories")
    # Stores products for the next steps.
    products: Mapped[list["Product"]] = relationship(back_populates="category", passive_deletes=True)


# Groups product behavior.
class Product(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    # Stores  tablename  for the next steps.
    __tablename__ = "products"
    # Stores  table args  for the next steps.
    __table_args__ = (
        UniqueConstraint("companyId", "sku", name="uq_products_company_sku"),
        UniqueConstraint("companyId", "categoryId", "name", name="uq_products_company_category_name"),
        CheckConstraint('"unitPrice" > 0', name="product_unit_price_positive"),
        CheckConstraint('"costPrice" >= 0 AND "costPrice" <= "unitPrice"', name="product_cost_valid"),
        CheckConstraint('"stockQuantity" >= 0', name="product_stock_nonnegative"),
        Index("ix_products_company_status", "companyId", "status"),
    )

    # Stores company id for the next steps.
    company_id: Mapped[UUID] = mapped_column("companyId", PostgreSQLUUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    # Stores category id for the next steps.
    category_id: Mapped[UUID] = mapped_column("categoryId", PostgreSQLUUID(as_uuid=True), ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False, index=True)
    # Stores name for the next steps.
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    # Stores sku for the next steps.
    sku: Mapped[str] = mapped_column(String(80), nullable=False)
    # Stores brand for the next steps.
    brand: Mapped[str | None] = mapped_column(String(120), nullable=True)
    # Stores description for the next steps.
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Stores unit price for the next steps.
    unit_price: Mapped[Decimal] = mapped_column("unitPrice", Numeric(12, 2), nullable=False)
    # Stores cost price for the next steps.
    cost_price: Mapped[Decimal] = mapped_column("costPrice", Numeric(12, 2), nullable=False)
    # Stores stock quantity for the next steps.
    stock_quantity: Mapped[int] = mapped_column("stockQuantity", nullable=False, default=0)
    # Stores unit of measure for the next steps.
    unit_of_measure: Mapped[str] = mapped_column("unitOfMeasure", String(40), nullable=False)
    # Stores status for the next steps.
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="ACTIVE")
    # Stores company for the next steps.
    company: Mapped["Company"] = relationship(back_populates="products")
    # Stores category for the next steps.
    category: Mapped[Category] = relationship(back_populates="products")
    # Stores sale items for the next steps.
    sale_items: Mapped[list["SaleItem"]] = relationship(back_populates="product")
