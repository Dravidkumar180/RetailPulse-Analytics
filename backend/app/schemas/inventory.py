# =========================================================
# Inventory API request and response schemas
# =========================================================

from datetime import datetime
from uuid import UUID

from pydantic import Field, model_validator

from app.schemas.common import CamelCaseModel

# =========================================================
# Inventory overview responses
# =========================================================


class InventoryItem(CamelCaseModel):
    """Return all columns displayed by the Inventory Overview table."""

    id: UUID
    product_id: UUID
    product_name: str
    sku: str
    category_id: UUID
    category_name: str
    brand: str | None
    current_stock: int
    reserved_stock: int
    available_stock: int
    reorder_level: int
    stock_status: str
    updated_at: datetime


class InventorySummary(CamelCaseModel):
    """Return dashboard cards and chart-ready grouped values."""

    total_products: int
    total_inventory_quantity: int
    low_stock_products: int
    out_of_stock_products: int
    inventory_by_category: list[dict[str, object]]
    stock_status_distribution: list[dict[str, object]]


class InventoryList(CamelCaseModel):
    """Return filtered inventory plus filter options and company totals."""

    items: list[InventoryItem]
    total: int
    summary: InventorySummary
    categories: list[dict[str, object]]
    brands: list[str]


# =========================================================
# Stock adjustment validation
# =========================================================


class StockAdjustment(CamelCaseModel):
    """Validate an add, remove or manual stock adjustment request."""

    product_id: UUID
    adjustment_type: str
    # Quantity must always be greater than zero.
    quantity: int = Field(gt=0)
    # A meaningful adjustment reason is mandatory.
    reason: str = Field(min_length=2, max_length=250)
    remarks: str | None = Field(default=None, max_length=1000)
    # Reorder levels may be zero but can never be negative.
    reorder_level: int | None = Field(default=None, ge=0)

    # Reject unknown movement types before business logic is executed.
    @model_validator(mode="after")
    def validate_type(self):
        if self.adjustment_type not in {
            "STOCK_ADDITION",
            "STOCK_REMOVAL",
            "MANUAL_ADJUSTMENT",
        }:
            raise ValueError("Invalid adjustment type.")
        return self


# =========================================================
# Movement and notification responses
# =========================================================


class MovementResponse(CamelCaseModel):
    """Return a complete, user-readable stock movement history row."""

    id: UUID
    product_id: UUID
    product_name: str
    movement_type: str
    previous_quantity: int
    updated_quantity: int
    quantity_changed: int
    reason: str
    remarks: str | None
    performed_by: str
    created_at: datetime


class NotificationResponse(CamelCaseModel):
    """Return one inventory alert for the Company Admin notification bell."""

    id: UUID
    title: str
    message: str
    product_id: UUID
    created_at: datetime
