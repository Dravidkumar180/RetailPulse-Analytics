from datetime import date
from math import ceil
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.constants import AuditAction, UserRole
from app.core.exceptions import ResourceNotFoundException
from app.models.user import User
from app.repositories import audit_log_repository
from app.schemas.audit_log import AuditLogListResponse, AuditLogResponse


class AuditLogService:
    def create_log(
        self,
        db: Session,
        *,
        company_id: UUID,
        user_id: UUID | None,
        action: AuditAction,
        ip_address: str,
        browser: str,
        details: str | None = None,
    ) -> None:
        audit_log_repository.create(
            db,
            company_id=company_id,
            user_id=user_id,
            action=action,
            ip_address=ip_address,
            browser=browser,
            details=details,
        )

    def list_audit_logs(
        self,
        db: Session,
        *,
        current_user: User,
        page: int,
        page_size: int,
        action: AuditAction | None = None,
        user_id: str | None = None,
        search: str | None = None,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> AuditLogListResponse:
        company_id = None if current_user.role == UserRole.SUPER_ADMIN else current_user.company_id
        parsed_user_id = UUID(user_id) if user_id else None
        items, total = audit_log_repository.list_logs(
            db,
            company_id=company_id,
            page=page,
            page_size=page_size,
            action=action,
            user_id=parsed_user_id,
            search=search,
            start_date=start_date,
            end_date=end_date,
        )
        return AuditLogListResponse(
            items=[AuditLogResponse.model_validate(item) for item in items],
            page=page,
            page_size=page_size,
            total_items=total,
            total_pages=ceil(total / page_size) if total else 0,
        )

    def get_audit_log(
        self,
        db: Session,
        *,
        current_user: User,
        audit_log_id: str,
    ) -> AuditLogResponse:
        company_id = None if current_user.role == UserRole.SUPER_ADMIN else current_user.company_id
        item = audit_log_repository.get_by_id(
            db,
            UUID(audit_log_id),
            company_id=company_id,
        )
        if item is None:
            raise ResourceNotFoundException("Audit log")
        return AuditLogResponse.model_validate(item)


audit_log_service = AuditLogService()
