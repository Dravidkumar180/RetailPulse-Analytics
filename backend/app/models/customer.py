from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Index, Numeric, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.company import Company


class Customer(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "customers"
    __table_args__ = (
        UniqueConstraint("companyId", "customerId", name="uq_customer_company_code"),
        UniqueConstraint("companyId", "email", name="uq_customer_company_email"),
        UniqueConstraint("companyId", "phone", name="uq_customer_company_phone"),
        Index("ix_customer_company_name", "companyId", "fullName"),
    )
    company_id: Mapped[UUID] = mapped_column("companyId", PostgreSQLUUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id: Mapped[str] = mapped_column("customerId", String(30), nullable=False)
    full_name: Mapped[str] = mapped_column("fullName", String(160), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(30), nullable=False)
    gender: Mapped[str | None] = mapped_column(String(30))
    date_of_birth: Mapped[date | None] = mapped_column("dateOfBirth", Date)
    address: Mapped[str | None] = mapped_column(Text)
    city: Mapped[str | None] = mapped_column(String(100))
    state: Mapped[str | None] = mapped_column(String(100))
    country: Mapped[str | None] = mapped_column(String(100))
    customer_type: Mapped[str] = mapped_column("customerType", String(20), nullable=False)
    preferred_sales_channel: Mapped[str | None] = mapped_column("preferredSalesChannel", String(30))
    status: Mapped[str] = mapped_column(String(10), nullable=False, default="ACTIVE")
    company: Mapped["Company"] = relationship(back_populates="customers")
    summary: Mapped["CustomerPurchaseSummary"] = relationship(back_populates="customer", cascade="all, delete-orphan", uselist=False)
    timeline: Mapped[list["CustomerTimeline"]] = relationship(back_populates="customer", cascade="all, delete-orphan")


class CustomerPurchaseSummary(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "customer_purchase_summary"
    customer_id: Mapped[UUID] = mapped_column("customerId", PostgreSQLUUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), unique=True, nullable=False)
    total_orders: Mapped[int] = mapped_column("totalOrders", default=0)
    total_revenue: Mapped[Decimal] = mapped_column("totalRevenue", Numeric(14, 2), default=0)
    total_products_purchased: Mapped[int] = mapped_column("totalProductsPurchased", default=0)
    average_order_value: Mapped[Decimal] = mapped_column("averageOrderValue", Numeric(14, 2), default=0)
    purchase_frequency: Mapped[Decimal] = mapped_column("purchaseFrequency", Numeric(8, 2), default=0)
    first_purchase_date: Mapped[datetime | None] = mapped_column("firstPurchaseDate", DateTime(timezone=True))
    last_purchase_date: Mapped[datetime | None] = mapped_column("lastPurchaseDate", DateTime(timezone=True))
    favorite_product_id: Mapped[UUID | None] = mapped_column("favoriteProductId", PostgreSQLUUID(as_uuid=True), nullable=True)
    favorite_category_id: Mapped[UUID | None] = mapped_column("favoriteCategoryId", PostgreSQLUUID(as_uuid=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    customer: Mapped[Customer] = relationship(back_populates="summary")


class CustomerTimeline(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "customer_timeline"
    customer_id: Mapped[UUID] = mapped_column("customerId", PostgreSQLUUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    event: Mapped[str] = mapped_column(String(80), nullable=False)
    details: Mapped[str | None] = mapped_column(Text)
    occurred_at: Mapped[datetime] = mapped_column("occurredAt", DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    customer: Mapped[Customer] = relationship(back_populates="timeline")


class CustomerNotification(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "customer_notifications"
    company_id: Mapped[UUID] = mapped_column("companyId", PostgreSQLUUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id: Mapped[UUID] = mapped_column("customerId", PostgreSQLUUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column("isRead", Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=True), default=datetime.utcnow, nullable=False)
