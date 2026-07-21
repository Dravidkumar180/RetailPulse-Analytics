# Teaching guide: This file contains catalog data validation.
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


# Groups category write behavior.
class CategoryWrite(CamelCaseModel):
    # Stores name for the next steps.
    name: str = Field(min_length=1, max_length=120)
    # Stores description for the next steps.
    description: str | None = Field(default=None, max_length=1000)
    # Stores status for the next steps.
    status: str = Field(pattern="^(ACTIVE|INACTIVE)$")

# Groups category response behavior.
class CategoryResponse(CategoryWrite):
    id: UUID
    company_id: UUID
    # Stores product count for the next steps.
    product_count: int = 0
    created_at: datetime
    updated_at: datetime

# Groups category list behavior.
class CategoryList(CamelCaseModel):
    items: list[CategoryResponse]
    total: int

# Groups product write behavior.
class ProductWrite(CamelCaseModel):
    # Stores name for the next steps.
    name: str = Field(min_length=1, max_length=160)
    # Stores sku for the next steps.
    sku: str = Field(min_length=1, max_length=80)
    category_id: UUID
    # Stores brand for the next steps.
    brand: str | None = Field(default=None, max_length=120)
    # Stores description for the next steps.
    description: str | None = Field(default=None, max_length=2000)
    # Stores unit price for the next steps.
    unit_price: Decimal = Field(gt=0)
    # Stores cost price for the next steps.
    cost_price: Decimal = Field(ge=0)
    # Stores stock quantity for the next steps.
    stock_quantity: int = Field(ge=0)
    # Stores unit of measure for the next steps.
    unit_of_measure: str = Field(min_length=1, max_length=40)
    # Stores status for the next steps.
    status: str = Field(pattern="^(ACTIVE|INACTIVE|OUT_OF_STOCK)$")

    # Checks prices.
    @model_validator(mode="after")
    def validate_prices(self):
        # Checks whether this condition is true.
        if self.cost_price > self.unit_price:
            # Stops here and reports the problem.
            raise ValueError("Cost price cannot exceed unit price.")
        # Returns the completed value to the caller.
        return self

# Groups product response behavior.
class ProductResponse(ProductWrite):
    id: UUID
    company_id: UUID
    category_name: str
    created_at: datetime
    updated_at: datetime

# Groups product list behavior.
class ProductList(CamelCaseModel):
    items: list[ProductResponse]
    total: int
    total_products: int
    active_products: int
    inactive_products: int
    total_categories: int
