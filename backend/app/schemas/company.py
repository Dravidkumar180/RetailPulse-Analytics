# Teaching guide: This file contains company data validation.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from datetime import datetime
# Imports the needed names from uuid.
from uuid import UUID

# Imports the needed names from pydantic.
from pydantic import EmailStr, Field, field_validator, model_validator

# Imports the needed names from app.schemas.common.
from app.schemas.common import CamelCaseModel


# Groups company registration request behavior.
class CompanyRegistrationRequest(CamelCaseModel):
    # Stores company name for the next steps.
    company_name: str = Field(min_length=2, max_length=150)
    # Stores industry for the next steps.
    industry: str = Field(min_length=2, max_length=100)
    company_email: EmailStr
    # Stores company address for the next steps.
    company_address: str = Field(min_length=5, max_length=500)
    # Stores company phone number for the next steps.
    company_phone_number: str = Field(min_length=7, max_length=30)
    # Stores owner name for the next steps.
    owner_name: str = Field(min_length=2, max_length=100)
    owner_email: EmailStr
    # Stores password for the next steps.
    password: str = Field(min_length=8, max_length=72)
    # Stores confirm password for the next steps.
    confirm_password: str = Field(min_length=8, max_length=72)

    # Runs clean text logic.
    @field_validator("company_name", "industry", "company_address", "company_phone_number", "owner_name")
    @classmethod
    def clean_text(cls, value: str) -> str:
        # Returns the completed value to the caller.
        return value.strip()

    # Checks passwords.
    @model_validator(mode="after")
    def validate_passwords(self) -> "CompanyRegistrationRequest":
        # Checks whether this condition is true.
        if self.password != self.confirm_password:
            # Stops here and reports the problem.
            raise ValueError("Password and confirm password must match.")
        # Returns the completed value to the caller.
        return self


# Groups company registration response behavior.
class CompanyRegistrationResponse(CamelCaseModel):
    message: str
    company_id: UUID
    admin_user_id: UUID


# Groups company response behavior.
class CompanyResponse(CamelCaseModel):
    id: UUID
    name: str
    industry: str
    email: EmailStr
    address: str
    phone: str
    created_at: datetime
    # Stores updated at for the next steps.
    updated_at: datetime | None = None


# Groups company summary response behavior.
class CompanySummaryResponse(CamelCaseModel):
    id: UUID
    name: str
    industry: str
    email: EmailStr


# Groups update company request behavior.
class UpdateCompanyRequest(CamelCaseModel):
    # Stores name for the next steps.
    name: str | None = Field(default=None, min_length=2, max_length=150)
    # Stores industry for the next steps.
    industry: str | None = Field(default=None, min_length=2, max_length=100)
    # Stores email for the next steps.
    email: EmailStr | None = None
    # Stores address for the next steps.
    address: str | None = Field(default=None, min_length=5, max_length=500)
    # Stores phone for the next steps.
    phone: str | None = Field(default=None, min_length=7, max_length=30)


# Groups company dashboard summary behavior.
class CompanyDashboardSummary(CamelCaseModel):
    company_id: UUID
    # Stores total users for the next steps.
    total_users: int = 0
    # Stores total products for the next steps.
    total_products: int = 0
    # Stores total sales for the next steps.
    total_sales: int = 0
    # Stores total reports for the next steps.
    total_reports: int = 0
