from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import Field, model_validator

from app.schemas.common import CamelCaseModel

SALES_CHANNELS = "^(RETAIL_STORE|ONLINE_STORE|MARKETPLACE)$"
PAYMENT_METHODS = "^(CASH|CARD|UPI|BANK_TRANSFER)$"

class SaleItemWrite(CamelCaseModel):
    product_id: UUID
    quantity: int = Field(gt=0)
    unit_price: Decimal = Field(ge=0)
    discount: Decimal = Field(default=Decimal("0"), ge=0)
    tax: Decimal = Field(default=Decimal("0"), ge=0)

    @model_validator(mode="after")
    def validate_pricing(self):
        if self.discount > self.quantity * self.unit_price:
            raise ValueError("Discount cannot exceed the product value.")
        return self

class SaleWrite(CamelCaseModel):
    customer_name: str = Field(min_length=1, max_length=160)
    sale_date: datetime
    sales_channel: str = Field(pattern=SALES_CHANNELS)
    payment_method: str = Field(pattern=PAYMENT_METHODS)
    items: list[SaleItemWrite] = Field(min_length=1)

    @model_validator(mode="after")
    def validate_items(self):
        ids = [item.product_id for item in self.items]
        if len(ids) != len(set(ids)):
            raise ValueError("A product can be added only once to a sale.")
        return self

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
    inventory_alerts: list[str] = Field(default_factory=list)

class SaleList(CamelCaseModel):
    items: list[SaleResponse]
    total: int

class SalesSummary(CamelCaseModel):
    total_sales: int
    total_revenue: Decimal
    total_orders: int
    average_order_value: Decimal
