# Teaching guide: This file contains audit log service business logic.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from datetime import date
# Imports the needed names from math.
from math import ceil
# Imports the needed names from uuid.
from uuid import UUID

# Imports the needed names from sqlalchemy.orm.
from sqlalchemy.orm import Session

# Imports the needed names from app.core.constants.
from app.core.constants import AuditAction, UserRole
# Imports the needed names from app.core.exceptions.
from app.core.exceptions import ResourceNotFoundException
# Imports the needed names from app.models.user.
from app.models.user import User
# Imports the needed names from app.repositories.
from app.repositories import audit_log_repository
# Imports the needed names from app.schemas.audit_log.
from app.schemas.audit_log import AuditLogListResponse, AuditLogResponse


# Groups audit log service behavior.
class AuditLogService:
    # Adds log.
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

    # Gets audit logs.
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
        # Stores company id for the next steps.
        company_id = None if current_user.role == UserRole.SUPER_ADMIN else current_user.company_id
        # Stores parsed user id for the next steps.
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
        # Returns the completed value to the caller.
        return AuditLogListResponse(
            items=[AuditLogResponse.model_validate(item) for item in items],
            page=page,
            page_size=page_size,
            total_items=total,
            total_pages=ceil(total / page_size) if total else 0,
        )

    # Gets audit log.
    def get_audit_log(
        self,
        db: Session,
        *,
        current_user: User,
        audit_log_id: str,
    ) -> AuditLogResponse:
        # Stores company id for the next steps.
        company_id = None if current_user.role == UserRole.SUPER_ADMIN else current_user.company_id
        # Stores item for the next steps.
        item = audit_log_repository.get_by_id(
            db,
            UUID(audit_log_id),
            company_id=company_id,
        )
        # Checks whether this condition is true.
        if item is None:
            # Stops here and reports the problem.
            raise ResourceNotFoundException("Audit log")
        # Returns the completed value to the caller.
        return AuditLogResponse.model_validate(item)


# Stores audit log service for the next steps.
audit_log_service = AuditLogService()
