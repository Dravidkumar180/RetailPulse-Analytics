from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import Field, model_validator
from app.schemas.common import CamelCaseModel


class CategoryWrite(CamelCaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=1000)
    status: str = Field(pattern="^(ACTIVE|INACTIVE)$")

class CategoryResponse(CategoryWrite):
    id: UUID
    company_id: UUID
    product_count: int = 0
    created_at: datetime
    updated_at: datetime

class CategoryList(CamelCaseModel):
    items: list[CategoryResponse]
    total: int

class ProductWrite(CamelCaseModel):
    name: str = Field(min_length=1, max_length=160)
    sku: str = Field(min_length=1, max_length=80)
    category_id: UUID
    brand: str | None = Field(default=None, max_length=120)
    description: str | None = Field(default=None, max_length=2000)
    unit_price: Decimal = Field(gt=0)
    cost_price: Decimal = Field(ge=0)
    stock_quantity: int = Field(ge=0)
    unit_of_measure: str = Field(min_length=1, max_length=40)
    status: str = Field(pattern="^(ACTIVE|INACTIVE|OUT_OF_STOCK)$")

    @model_validator(mode="after")
    def validate_prices(self):
        if self.cost_price > self.unit_price:
            raise ValueError("Cost price cannot exceed unit price.")
        return self

class ProductResponse(ProductWrite):
    id: UUID
    company_id: UUID
    category_name: str
    created_at: datetime
    updated_at: datetime

class ProductList(CamelCaseModel):
    items: list[ProductResponse]
    total: int
    total_products: int
    active_products: int
    inactive_products: int
    total_categories: int
