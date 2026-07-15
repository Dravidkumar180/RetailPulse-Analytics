from datetime import datetime
from uuid import UUID

from pydantic import EmailStr, Field, field_validator, model_validator

from app.schemas.common import CamelCaseModel


class CompanyRegistrationRequest(CamelCaseModel):
    company_name: str = Field(min_length=2, max_length=150)
    industry: str = Field(min_length=2, max_length=100)
    company_email: EmailStr
    company_address: str = Field(min_length=5, max_length=500)
    company_phone_number: str = Field(min_length=7, max_length=30)
    owner_name: str = Field(min_length=2, max_length=100)
    owner_email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    confirm_password: str = Field(min_length=8, max_length=72)

    @field_validator("company_name", "industry", "company_address", "company_phone_number", "owner_name")
    @classmethod
    def clean_text(cls, value: str) -> str:
        return value.strip()

    @model_validator(mode="after")
    def validate_passwords(self) -> "CompanyRegistrationRequest":
        if self.password != self.confirm_password:
            raise ValueError("Password and confirm password must match.")
        return self


class CompanyRegistrationResponse(CamelCaseModel):
    message: str
    company_id: UUID
    admin_user_id: UUID


class CompanyResponse(CamelCaseModel):
    id: UUID
    name: str
    industry: str
    email: EmailStr
    address: str
    phone: str
    created_at: datetime
    updated_at: datetime | None = None


class CompanySummaryResponse(CamelCaseModel):
    id: UUID
    name: str
    industry: str
    email: EmailStr


class UpdateCompanyRequest(CamelCaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=150)
    industry: str | None = Field(default=None, min_length=2, max_length=100)
    email: EmailStr | None = None
    address: str | None = Field(default=None, min_length=5, max_length=500)
    phone: str | None = Field(default=None, min_length=7, max_length=30)


class CompanyDashboardSummary(CamelCaseModel):
    company_id: UUID
    total_users: int = 0
    total_products: int = 0
    total_sales: int = 0
    total_reports: int = 0
