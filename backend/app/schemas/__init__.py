# Teaching guide: This file contains  init  data validation.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from datetime import datetime
# Imports the needed names from typing.
from typing import TypeAlias
# Imports the needed names from uuid.
from uuid import UUID

# Imports the needed names from pydantic.
from pydantic import EmailStr

# Imports the needed names from app.core.constants.
from app.core.constants import AuditAction
# Imports the needed names from app.schemas.common.
from app.schemas.common import (
    CamelCaseModel,
    PaginationResponse,
)


# Stores audit action value for the next steps.
AuditActionValue: TypeAlias = AuditAction


# Groups audit log company response behavior.
class AuditLogCompanyResponse(CamelCaseModel):
    id: UUID
    name: str


# Groups audit log user response behavior.
class AuditLogUserResponse(CamelCaseModel):
    id: UUID
    name: str
    email: EmailStr


# Groups audit log response behavior.
class AuditLogResponse(CamelCaseModel):
    id: UUID
    company: AuditLogCompanyResponse
    user: AuditLogUserResponse | None
    action: AuditAction
    ip_address: str
    browser: str
    timestamp: datetime


# Groups audit log list response behavior.
class AuditLogListResponse(PaginationResponse):
    items: list[AuditLogResponse]