# Teaching guide: This file contains sales data validation.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from datetime import datetime
# Imports the needed names from decimal.
from decimal import Decimal
# Imports the needed names from uuid.
from uuid import UUID

# Imports the needed names from pydantic.
from pydantic import Field, model_validator

# Imports the needed names from app.schemas.common.
from app.schemas.common import CamelCaseModel

# Stores sales channels for the next steps.
SALES_CHANNELS = "^(RETAIL_STORE|ONLINE_STORE|MARKETPLACE)$"
# Stores payment methods for the next steps.
PAYMENT_METHODS = "^(CASH|CARD|UPI|BANK_TRANSFER)$"

# Groups sale item write behavior.
class SaleItemWrite(CamelCaseModel):
    product_id: UUID
    # Stores quantity for the next steps.
    quantity: int = Field(gt=0)
    # Stores unit price for the next steps.
    unit_price: Decimal = Field(ge=0)
    # Stores discount for the next steps.
    discount: Decimal = Field(default=Decimal("0"), ge=0)
    # Stores tax for the next steps.
    tax: Decimal = Field(default=Decimal("0"), ge=0)

    # Checks pricing.
    @model_validator(mode="after")
    def validate_pricing(self):
        # Checks whether this condition is true.
        if self.discount > self.quantity * self.unit_price:
            # Stops here and reports the problem.
            raise ValueError("Discount cannot exceed the product value.")
        # Returns the completed value to the caller.
        return self

# Groups sale write behavior.
class SaleWrite(CamelCaseModel):
    # Stores customer name for the next steps.
    customer_name: str = Field(min_length=1, max_length=160)
    sale_date: datetime
    # Stores sales channel for the next steps.
    sales_channel: str = Field(pattern=SALES_CHANNELS)
    # Stores payment method for the next steps.
    payment_method: str = Field(pattern=PAYMENT_METHODS)
    # Stores items for the next steps.
    items: list[SaleItemWrite] = Field(min_length=1)

    # Checks items.
    @model_validator(mode="after")
    def validate_items(self):
        # Stores ids for the next steps.
        ids = [item.product_id for item in self.items]
        # Checks whether this condition is true.
        if len(ids) != len(set(ids)):
            # Stops here and reports the problem.
            raise ValueError("A product can be added only once to a sale.")
        # Returns the completed value to the caller.
        return self

# Groups sale item response behavior.
class SaleItemResponse(CamelCaseModel):
    id: UUID
    product_id: UUID
    product_name: str
    category_id: UUID
    category_name: str
    quantity: int
    unit_price: Decimal
    discount: Decimal
    tax: Decimal
    total: Decimal
    remaining_stock: int

# Groups sale response behavior.
class SaleResponse(CamelCaseModel):
    id: UUID
    invoice_number: str
    customer_name: str
    sale_date: datetime
    sales_channel: str
    payment_method: str
    total_amount: Decimal
    created_by_name: str
    items: list[SaleItemResponse]
    created_at: datetime
    updated_at: datetime
    # Stores inventory alerts for the next steps.
    inventory_alerts: list[str] = Field(default_factory=list)

# Groups sale list behavior.
class SaleList(CamelCaseModel):
    items: list[SaleResponse]
    total: int

# Groups sales summary behavior.
class SalesSummary(CamelCaseModel):
    total_sales: int
    total_revenue: Decimal
    total_orders: int
    average_order_value: Decimal
