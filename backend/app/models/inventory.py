# =========================================================
# Inventory database models
# =========================================================

# Datetime is used for movement and notification timestamps.
from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

# These imports are required only by static type checkers. Keeping them out of
# runtime avoids circular imports between inventory, catalog, company and user.
if TYPE_CHECKING:
    from app.models.catalog import Product
    from app.models.company import Company
    from app.models.user import User


# =========================================================
# Current inventory table
# =========================================================


class Inventory(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Store the current stock position for one product in one company."""

    # The table name matches the inventory table required by the module.
    __tablename__ = "inventory"
    # Constraints protect tenant uniqueness and prevent negative quantities.
    __table_args__ = (
        UniqueConstraint("companyId", "productId", name="uq_inventory_company_product"),
        CheckConstraint('"currentStock" >= 0', name="inventory_current_nonnegative"),
        CheckConstraint('"reservedStock" >= 0', name="inventory_reserved_nonnegative"),
        CheckConstraint(
            '"availableStock" >= 0', name="inventory_available_nonnegative"
        ),
        CheckConstraint('"reorderLevel" >= 0', name="inventory_reorder_nonnegative"),
        Index("ix_inventory_company_status", "companyId", "stockStatus"),
    )

    # Company ID is the tenant boundary used by every inventory query.
    company_id: Mapped[UUID] = mapped_column(
        "companyId",
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Each product can have exactly one inventory row per company.
    product_id: Mapped[UUID] = mapped_column(
        "productId",
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Current stock contains all physical units recorded for the product.
    current_stock: Mapped[int] = mapped_column(
        "currentStock", nullable=False, default=0
    )
    # Reserved units are unavailable for new sales or stock removals.
    reserved_stock: Mapped[int] = mapped_column(
        "reservedStock", nullable=False, default=0
    )
    # Available stock is current stock minus reserved stock.
    available_stock: Mapped[int] = mapped_column(
        "availableStock", nullable=False, default=0
    )
    # Reorder level controls when the product becomes LOW_STOCK.
    reorder_level: Mapped[int] = mapped_column(
        "reorderLevel", nullable=False, default=5
    )
    # Status is derived as IN_STOCK, LOW_STOCK or OUT_OF_STOCK.
    stock_status: Mapped[str] = mapped_column(
        "stockStatus", String(20), nullable=False, default="OUT_OF_STOCK"
    )

    # Relationships expose company, product and complete movement history.
    company: Mapped["Company"] = relationship()
    product: Mapped["Product"] = relationship()
    movements: Mapped[list["InventoryMovement"]] = relationship(
        back_populates="inventory", cascade="all, delete-orphan", passive_deletes=True
    )


# =========================================================
# Inventory movement history table
# =========================================================


class InventoryMovement(UUIDPrimaryKeyMixin, Base):
    """Keep an immutable history entry for every stock quantity change."""

    __tablename__ = "inventory_movements"
    __table_args__ = (
        Index("ix_inventory_movements_inventory_created", "inventoryId", "createdAt"),
    )

    # The parent inventory row identifies both product and company.
    inventory_id: Mapped[UUID] = mapped_column(
        "inventoryId",
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("inventory.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Movement type records sale, addition, removal or manual adjustment.
    movement_type: Mapped[str] = mapped_column(
        "movementType", String(30), nullable=False
    )
    # Signed change is positive for stock in and negative for stock out.
    quantity_changed: Mapped[int] = mapped_column("quantityChanged", nullable=False)
    previous_quantity: Mapped[int] = mapped_column("previousQuantity", nullable=False)
    updated_quantity: Mapped[int] = mapped_column("updatedQuantity", nullable=False)
    # Every adjustment requires a reason; remarks provide optional detail.
    reason: Mapped[str] = mapped_column(String(250), nullable=False)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    # The user reference makes each movement attributable and auditable.
    performed_by_id: Mapped[UUID] = mapped_column(
        "performedBy",
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        "createdAt",
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now().astimezone(),
    )

    inventory: Mapped[Inventory] = relationship(back_populates="movements")
    performed_by: Mapped["User"] = relationship()


# =========================================================
# Inventory notification table
# =========================================================


class InventoryNotification(UUIDPrimaryKeyMixin, Base):
    """Store company-visible stock alerts displayed by the navbar bell."""

    __tablename__ = "inventory_notifications"
    __table_args__ = (
        Index("ix_inventory_notifications_company_created", "companyId", "createdAt"),
    )

    # Notifications are always isolated by company.
    company_id: Mapped[UUID] = mapped_column(
        "companyId",
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[UUID] = mapped_column(
        "productId",
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    message: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt",
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now().astimezone(),
    )

    product: Mapped["Product"] = relationship()
