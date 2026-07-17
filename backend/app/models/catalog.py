from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import CheckConstraint, ForeignKey, Index, Numeric, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.sales import SaleItem


class Category(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "categories"
    __table_args__ = (UniqueConstraint("companyId", "name", name="uq_categories_company_name"),)

    company_id: Mapped[UUID] = mapped_column("companyId", PostgreSQLUUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="ACTIVE")
    company: Mapped["Company"] = relationship(back_populates="categories")
    products: Mapped[list["Product"]] = relationship(back_populates="category", passive_deletes=True)


class Product(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "products"
    __table_args__ = (
        UniqueConstraint("companyId", "sku", name="uq_products_company_sku"),
        UniqueConstraint("companyId", "categoryId", "name", name="uq_products_company_category_name"),
        CheckConstraint('"unitPrice" > 0', name="product_unit_price_positive"),
        CheckConstraint('"costPrice" >= 0 AND "costPrice" <= "unitPrice"', name="product_cost_valid"),
        CheckConstraint('"stockQuantity" >= 0', name="product_stock_nonnegative"),
        Index("ix_products_company_status", "companyId", "status"),
    )

    company_id: Mapped[UUID] = mapped_column("companyId", PostgreSQLUUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id: Mapped[UUID] = mapped_column("categoryId", PostgreSQLUUID(as_uuid=True), ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    sku: Mapped[str] = mapped_column(String(80), nullable=False)
    brand: Mapped[str | None] = mapped_column(String(120), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    unit_price: Mapped[Decimal] = mapped_column("unitPrice", Numeric(12, 2), nullable=False)
    cost_price: Mapped[Decimal] = mapped_column("costPrice", Numeric(12, 2), nullable=False)
    stock_quantity: Mapped[int] = mapped_column("stockQuantity", nullable=False, default=0)
    unit_of_measure: Mapped[str] = mapped_column("unitOfMeasure", String(40), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="ACTIVE")
    company: Mapped["Company"] = relationship(back_populates="products")
    category: Mapped[Category] = relationship(back_populates="products")
    sale_items: Mapped[list["SaleItem"]] = relationship(back_populates="product")
