from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import EmailStr, Field
from app.schemas.common import CamelCaseModel


class CustomerWrite(CamelCaseModel):
    full_name: str = Field(min_length=2, max_length=160)
    email: EmailStr
    phone: str = Field(min_length=7, max_length=30)
    gender: str | None = None
    date_of_birth: date | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    customer_type: str = Field(pattern="^(RETAIL|WHOLESALE|CORPORATE)$")
    preferred_sales_channel: str | None = None
    status: str = Field(default="ACTIVE", pattern="^(ACTIVE|INACTIVE)$")


class PurchaseSummary(CamelCaseModel):
    total_orders: int = 0
    total_revenue: Decimal = Decimal("0")
    total_products_purchased: int = 0
    average_order_value: Decimal = Decimal("0")
    purchase_frequency: Decimal = Decimal("0")
    first_purchase_date: datetime | None = None
    last_purchase_date: datetime | None = None
    favorite_product: str | None = None
    favorite_category: str | None = None


class TimelineItem(CamelCaseModel):
    id: UUID
    event: str
    details: str | None = None
    occurred_at: datetime


class CustomerTransaction(CamelCaseModel):
    id: UUID
    invoice_number: str
    sale_date: datetime
    total_amount: Decimal
    payment_method: str
    sales_channel: str


class PurchasedProduct(CamelCaseModel):
    product_name: str
    quantity: int
    purchase_count: int


class CustomerResponse(CustomerWrite):
    id: UUID
    customer_id: str
    segment: str
    created_at: datetime
    updated_at: datetime
    summary: PurchaseSummary
    timeline: list[TimelineItem] = []
    recent_transactions: list[CustomerTransaction] = []
    most_purchased_products: list[PurchasedProduct] = []


class CustomerList(CamelCaseModel):
    items: list[CustomerResponse]
    total: int
