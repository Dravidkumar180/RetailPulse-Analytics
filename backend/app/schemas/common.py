# Teaching guide: This file contains common data validation.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from typing import Generic, TypeVar

# Imports the needed names from pydantic.
from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


# Stores t for the next steps.
T = TypeVar("T")


# Groups camel case model behavior.
class CamelCaseModel(BaseModel):
    # Stores model config for the next steps.
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        alias_generator=lambda value: "".join(
            word.capitalize() if index else word
            for index, word in enumerate(value.split("_"))
        ),
    )


# Groups message response behavior.
class MessageResponse(CamelCaseModel):
    message: str


# Groups pagination response behavior.
class PaginationResponse(CamelCaseModel):
    # Stores page for the next steps.
    page: int = Field(ge=1)
    # Stores page size for the next steps.
    page_size: int = Field(ge=1)
    # Stores total items for the next steps.
    total_items: int = Field(ge=0)
    # Stores total pages for the next steps.
    total_pages: int = Field(ge=0)