# Teaching guide: This file contains sales database tables.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from datetime import datetime
# Imports the needed names from decimal.
from decimal import Decimal
# Imports the needed names from typing.
from typing import TYPE_CHECKING
# Imports the needed names from uuid.
from uuid import UUID

# Imports the needed names from sqlalchemy.
from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Numeric, String, UniqueConstraint
# Imports the needed names from sqlalchemy.dialects.postgresql.
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
# Imports the needed names from sqlalchemy.orm.
from sqlalchemy.orm import Mapped, mapped_column, relationship

# Imports the needed names from app.models.base.
from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

# Checks whether this condition is true.
if TYPE_CHECKING:
    # Imports the needed names from app.models.catalog.
    from app.models.catalog import Category, Product
    # Imports the needed names from app.models.company.
    from app.models.company import Company
    # Imports the needed names from app.models.user.
    from app.models.user import User


# Groups sale behavior.
class Sale(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    # Stores  tablename  for the next steps.
    __tablename__ = "sales"
    # Stores  table args  for the next steps.
    __table_args__ = (
        UniqueConstraint("companyId", "invoiceNumber", name="uq_sales_company_invoice"),
        Index("ix_sales_company_date", "companyId", "saleDate"),
    )

    # Stores company id for the next steps.
    company_id: Mapped[UUID] = mapped_column("companyId", PostgreSQLUUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    # Stores invoice number for the next steps.
    invoice_number: Mapped[str] = mapped_column("invoiceNumber", String(40), nullable=False)
    # Stores customer name for the next steps.
    customer_name: Mapped[str] = mapped_column("customerName", String(160), nullable=False)
    # Stores sale date for the next steps.
    sale_date: Mapped[datetime] = mapped_column("saleDate", DateTime(timezone=True), nullable=False)
    # Stores sales channel for the next steps.
    sales_channel: Mapped[str] = mapped_column("salesChannel", String(30), nullable=False)
    # Stores payment method for the next steps.
    payment_method: Mapped[str] = mapped_column("paymentMethod", String(30), nullable=False)
    # Stores total amount for the next steps.
    total_amount: Mapped[Decimal] = mapped_column("totalAmount", Numeric(14, 2), nullable=False)
    # Stores created by id for the next steps.
    created_by_id: Mapped[UUID] = mapped_column("createdBy", PostgreSQLUUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    # Stores company for the next steps.
    company: Mapped["Company"] = relationship(back_populates="sales")
    # Stores created by for the next steps.
    created_by: Mapped["User"] = relationship(back_populates="sales_created")
    # Stores items for the next steps.
    items: Mapped[list["SaleItem"]] = relationship(back_populates="sale", cascade="all, delete-orphan", passive_deletes=True)


# Groups sale item behavior.
class SaleItem(UUIDPrimaryKeyMixin, Base):
    # Stores  tablename  for the next steps.
    __tablename__ = "sale_items"
    # Stores  table args  for the next steps.
    __table_args__ = (
        CheckConstraint('"quantity" > 0', name="sale_item_quantity_positive"),
        CheckConstraint('"unitPrice" >= 0', name="sale_item_unit_price_nonnegative"),
        CheckConstraint('"discount" >= 0', name="sale_item_discount_nonnegative"),
        CheckConstraint('"tax" >= 0', name="sale_item_tax_nonnegative"),
    )
    # Stores sale id for the next steps.
    sale_id: Mapped[UUID] = mapped_column("saleId", PostgreSQLUUID(as_uuid=True), ForeignKey("sales.id", ondelete="CASCADE"), nullable=False, index=True)
    # Stores product id for the next steps.
    product_id: Mapped[UUID] = mapped_column("productId", PostgreSQLUUID(as_uuid=True), ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    # Stores category id for the next steps.
    category_id: Mapped[UUID] = mapped_column("categoryId", PostgreSQLUUID(as_uuid=True), ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False)
    # Stores quantity for the next steps.
    quantity: Mapped[int] = mapped_column(nullable=False)
    # Stores unit price for the next steps.
    unit_price: Mapped[Decimal] = mapped_column("unitPrice", Numeric(12, 2), nullable=False)
    # Stores discount for the next steps.
    discount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    # Stores tax for the next steps.
    tax: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    # Stores total for the next steps.
    total: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    # Stores sale for the next steps.
    sale: Mapped[Sale] = relationship(back_populates="items")
    # Stores product for the next steps.
    product: Mapped["Product"] = relationship(back_populates="sale_items")
    # Stores category for the next steps.
    category: Mapped["Category"] = relationship()
