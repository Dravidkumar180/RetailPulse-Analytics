from datetime import date, time
from typing import Literal
from uuid import UUID
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    EmailStr,
    model_validator,
    field_validator,
)

ReportType = Literal[
    "sales", "inventory", "customer", "product_performance", "stock_movement"
]


class ReportFilters(BaseModel):
    model_config = ConfigDict(extra="forbid")
    start_date: date | None = None
    end_date: date | None = None
    product_id: UUID | None = None
    category_id: UUID | None = None
    brand: str | None = Field(default=None, max_length=120)
    customer_id: UUID | None = None
    sales_status: Literal["PAID", "PENDING", "FAILED"] | None = None
    stock_status: Literal["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"] | None = None
    user_id: UUID | None = None

    @model_validator(mode="after")
    def dates(self):
        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValueError("Start date must be on or before end date")
        return self


class GenerateReport(BaseModel):
    model_config = ConfigDict(extra="forbid")
    report_type: ReportType
    filters: ReportFilters = Field(default_factory=ReportFilters)
    format: Literal["CSV", "PDF"] = "CSV"

    @model_validator(mode="after")
    def relevant(self):
        f = self.filters
        if self.report_type in ("inventory", "stock_movement") and (
            f.customer_id or f.sales_status
        ):
            raise ValueError(
                "Customer and sales status filters apply to sales-based reports only"
            )
        if self.report_type != "inventory" and f.stock_status:
            raise ValueError("Stock status applies to inventory only")
        if self.report_type == "inventory" and f.user_id:
            raise ValueError("User filter is not applicable to current inventory")
        return self


class ScheduleInput(GenerateReport):
    name: str = Field(min_length=1, max_length=160)
    frequency: Literal["Daily", "Weekly", "Monthly"]
    execution_time: time
    timezone: str = "Asia/Kolkata"
    weekday: int = Field(default=0, ge=0, le=6)
    month_day: int = Field(default=1, ge=1, le=28)
    recipients: list[EmailStr] = Field(min_length=1, max_length=20)
    active: bool = True
    period: Literal["fixed", "previous_period"] = "previous_period"

    @field_validator("timezone")
    @classmethod
    def timezone_valid(cls, value):
        try:
            ZoneInfo(value)
        except (ZoneInfoNotFoundError, ValueError):
            raise ValueError("Unknown timezone")
        return value

    @field_validator("name")
    @classmethod
    def name_valid(cls, value):
        if not value.strip():
            raise ValueError("Schedule name is required")
        return value.strip()
