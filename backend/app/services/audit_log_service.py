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
from app.models.activity_notification import ActivityNotification
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
        before_values: dict | None = None,
        after_values: dict | None = None,
    ) -> None:
        audit_log_repository.create(
            db,
            company_id=company_id,
            user_id=user_id,
            action=action,
            ip_address=ip_address,
            browser=browser,
            details=details,
            before_values=before_values,
            after_values=after_values,
        )
        notification = self._notification_for(action, details)
        if notification:
            title, path = notification
            db.add(ActivityNotification(
                company_id=company_id,
                actor_id=user_id,
                action=action.value,
                title=title,
                message=(details or title)[:1000],
                path=path,
            ))

    @staticmethod
    def _notification_for(action: AuditAction, details: str | None) -> tuple[str, str] | None:
        """Map successful state-changing audit events to a useful UI destination."""
        mappings: dict[AuditAction, tuple[str, str]] = {
            AuditAction.CATEGORY_CREATED: ("Category created", "/categories"),
            AuditAction.CATEGORY_UPDATED: ("Category updated", "/categories"),
            AuditAction.CATEGORY_DELETED: ("Category deleted", "/categories"),
            AuditAction.PRODUCT_CREATED: ("Product created", "/products"),
            AuditAction.PRODUCT_UPDATED: ("Product updated", "/products"),
            AuditAction.PRODUCT_DELETED: ("Product deleted", "/products"),
            AuditAction.PRODUCT_ACTIVATED: ("Product activated", "/products"),
            AuditAction.PRODUCT_DEACTIVATED: ("Product deactivated", "/products"),
            AuditAction.SALE_CREATED: ("Sale created", "/sales"),
            AuditAction.SALE_UPDATED: ("Sale updated", "/sales"),
            AuditAction.SALE_DELETED: ("Sale deleted", "/sales"),
            AuditAction.CUSTOMER_UPDATED: ("Customer updated", "/customers"),
            AuditAction.CUSTOMER_DELETED: ("Customer deleted", "/customers"),
            AuditAction.CUSTOMER_ACTIVATED: ("Customer activated", "/customers"),
            AuditAction.CUSTOMER_DEACTIVATED: ("Customer deactivated", "/customers"),
            AuditAction.FORECAST_GENERATED: ("Forecast generated", "/demand-forecasting"),
            AuditAction.FORECAST_REFRESHED: ("Forecast refreshed", "/demand-forecasting"),
            AuditAction.INVENTORY_RECOMMENDATION_GENERATED: ("Inventory recommendations updated", "/demand-forecasting"),
            AuditAction.USER_INVITED: ("User invited", "/users"),
            AuditAction.USER_UPDATED: ("User updated", "/users"),
            AuditAction.PROFILE_UPDATED: ("Profile updated", "/profile"),
            AuditAction.SETTINGS_UPDATED: ("Settings updated", "/settings"),
            AuditAction.IMPORT_UPLOADED: ("Import validated", "/data-import"),
            AuditAction.IMPORT_COMPLETED: ("Import completed", "/data-import"),
            AuditAction.IMPORT_FAILED: ("Import failed", "/data-import"),
        }
        return mappings.get(action)

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
        exclude_authentication: bool = False,
        resource_type: str | None = None,
        status: str | None = None,
        sort_order: str = "newest",
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
            exclude_authentication=exclude_authentication,
            resource_type=resource_type,
            status=status,
            sort_order=sort_order,
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
