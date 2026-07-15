from datetime import datetime
from typing import TypeAlias
from uuid import UUID

from pydantic import EmailStr

from app.core.constants import AuditAction
from app.schemas.common import (
    CamelCaseModel,
    PaginationResponse,
)


AuditActionValue: TypeAlias = AuditAction


class AuditLogCompanyResponse(CamelCaseModel):
    id: UUID
    name: str


class AuditLogUserResponse(CamelCaseModel):
    id: UUID
    name: str
    email: EmailStr


class AuditLogResponse(CamelCaseModel):
    id: UUID
    company: AuditLogCompanyResponse
    user: AuditLogUserResponse | None
    action: AuditAction
    ip_address: str
    browser: str
    timestamp: datetime


class AuditLogListResponse(PaginationResponse):
    items: list[AuditLogResponse]