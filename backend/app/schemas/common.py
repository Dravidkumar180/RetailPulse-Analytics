from typing import Generic, TypeVar

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


T = TypeVar("T")


class CamelCaseModel(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        alias_generator=lambda value: "".join(
            word.capitalize() if index else word
            for index, word in enumerate(value.split("_"))
        ),
    )


class MessageResponse(CamelCaseModel):
    message: str


class PaginationResponse(CamelCaseModel):
    page: int = Field(ge=1)
    page_size: int = Field(ge=1)
    total_items: int = Field(ge=0)
    total_pages: int = Field(ge=0)