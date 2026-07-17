from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Numeric, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.catalog import Category, Product
    from app.models.company import Company
    from app.models.user import User


class Sale(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "sales"
    __table_args__ = (
        UniqueConstraint("companyId", "invoiceNumber", name="uq_sales_company_invoice"),
        Index("ix_sales_company_date", "companyId", "saleDate"),
    )

    company_id: Mapped[UUID] = mapped_column("companyId", PostgreSQLUUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    invoice_number: Mapped[str] = mapped_column("invoiceNumber", String(40), nullable=False)
    customer_name: Mapped[str] = mapped_column("customerName", String(160), nullable=False)
    sale_date: Mapped[datetime] = mapped_column("saleDate", DateTime(timezone=True), nullable=False)
    sales_channel: Mapped[str] = mapped_column("salesChannel", String(30), nullable=False)
    payment_method: Mapped[str] = mapped_column("paymentMethod", String(30), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column("totalAmount", Numeric(14, 2), nullable=False)
    created_by_id: Mapped[UUID] = mapped_column("createdBy", PostgreSQLUUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    company: Mapped["Company"] = relationship(back_populates="sales")
    created_by: Mapped["User"] = relationship(back_populates="sales_created")
    items: Mapped[list["SaleItem"]] = relationship(back_populates="sale", cascade="all, delete-orphan", passive_deletes=True)


class SaleItem(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "sale_items"
    __table_args__ = (
        CheckConstraint('"quantity" > 0', name="sale_item_quantity_positive"),
        CheckConstraint('"unitPrice" >= 0', name="sale_item_unit_price_nonnegative"),
        CheckConstraint('"discount" >= 0', name="sale_item_discount_nonnegative"),
        CheckConstraint('"tax" >= 0', name="sale_item_tax_nonnegative"),
    )
    sale_id: Mapped[UUID] = mapped_column("saleId", PostgreSQLUUID(as_uuid=True), ForeignKey("sales.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[UUID] = mapped_column("productId", PostgreSQLUUID(as_uuid=True), ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    category_id: Mapped[UUID] = mapped_column("categoryId", PostgreSQLUUID(as_uuid=True), ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False)
    quantity: Mapped[int] = mapped_column(nullable=False)
    unit_price: Mapped[Decimal] = mapped_column("unitPrice", Numeric(12, 2), nullable=False)
    discount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    tax: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    total: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    sale: Mapped[Sale] = relationship(back_populates="items")
    product: Mapped["Product"] = relationship(back_populates="sale_items")
    category: Mapped["Category"] = relationship()
