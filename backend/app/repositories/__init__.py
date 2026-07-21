# Teaching guide: This file contains  init  database access.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from datetime import UTC, date, datetime, time
# Imports the needed names from uuid.
from uuid import UUID

# Imports the needed names from sqlalchemy.
from sqlalchemy import func, or_, select
# Imports the needed names from sqlalchemy.orm.
from sqlalchemy.orm import (
    Session,
    joinedload,
)

# Imports the needed names from app.core.constants.
from app.core.constants import AuditAction
# Imports the needed names from app.models.audit_log.
from app.models.audit_log import AuditLog
# Imports the needed names from app.models.company.
from app.models.company import Company
# Imports the needed names from app.models.user.
from app.models.user import User


# Groups audit log repository behavior.
class AuditLogRepository:
    # Adds create.
    def create(
        self,
        db: Session,
        *,
        company_id: UUID,
        user_id: UUID | None,
        action: AuditAction,
        ip_address: str,
        browser: str,
        details: str | None = None,
    ) -> AuditLog:
        # Stores audit log for the next steps.
        audit_log = AuditLog(
            company_id=company_id,
            user_id=user_id,
            action=action,
            ip_address=ip_address[:64],
            browser=browser[:500],
            details=details,
            timestamp=datetime.now(UTC),
        )

        # Applies this change to the database session.
        db.add(audit_log)
        # Applies this change to the database session.
        db.flush()

        # Returns the completed value to the caller.
        return audit_log

    # Gets by id.
    def get_by_id(
        self,
        db: Session,
        audit_log_id: UUID,
        *,
        company_id: UUID | None = None,
    ) -> AuditLog | None:
        # Stores statement for the next steps.
        statement = (
            select(AuditLog)
            .options(
                joinedload(AuditLog.company),
                joinedload(AuditLog.user),
            )
            .where(AuditLog.id == audit_log_id)
        )

        # Checks whether this condition is true.
        if company_id is not None:
            # Stores statement for the next steps.
            statement = statement.where(
                AuditLog.company_id == company_id,
            )

        # Returns the completed value to the caller.
        return db.scalar(statement)

    # Gets logs.
    def list_logs(
        self,
        db: Session,
        *,
        company_id: UUID | None,
        page: int,
        page_size: int,
        action: AuditAction | None = None,
        user_id: UUID | None = None,
        search: str | None = None,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> tuple[list[AuditLog], int]:
        # Stores filters for the next steps.
        filters = []

        # Checks whether this condition is true.
        if company_id is not None:
            filters.append(
                AuditLog.company_id == company_id,
            )

        # Checks whether this condition is true.
        if action:
            filters.append(AuditLog.action == action)

        # Checks whether this condition is true.
        if user_id:
            filters.append(AuditLog.user_id == user_id)

        # Checks whether this condition is true.
        if start_date:
            # Stores start datetime for the next steps.
            start_datetime = datetime.combine(
                start_date,
                time.min,
                tzinfo=UTC,
            )
            filters.append(
                AuditLog.timestamp >= start_datetime,
            )

        # Checks whether this condition is true.
        if end_date:
            # Stores end datetime for the next steps.
            end_datetime = datetime.combine(
                end_date,
                time.max,
                tzinfo=UTC,
            )
            filters.append(
                AuditLog.timestamp <= end_datetime,
            )

        # Checks whether this condition is true.
        if search:
            # Stores search value for the next steps.
            search_value = f"%{search.strip().lower()}%"

            filters.append(
                or_(
                    func.lower(Company.name).like(search_value),
                    func.lower(User.name).like(search_value),
                    func.lower(User.email).like(search_value),
                    func.lower(AuditLog.browser).like(search_value),
                    func.lower(AuditLog.ip_address).like(
                        search_value
                    ),
                    func.lower(AuditLog.details).like(search_value),
                )
            )

        # Stores base statement for the next steps.
        base_statement = (
            select(AuditLog)
            .join(
                Company,
                Company.id == AuditLog.company_id,
            )
            .outerjoin(
                User,
                User.id == AuditLog.user_id,
            )
        )

        # Stores count statement for the next steps.
        count_statement = (
            select(func.count(AuditLog.id))
            .select_from(AuditLog)
            .join(
                Company,
                Company.id == AuditLog.company_id,
            )
            .outerjoin(
                User,
                User.id == AuditLog.user_id,
            )
            .where(*filters)
        )

        # Stores total items for the next steps.
        total_items = int(
            db.scalar(count_statement)
            or 0
        )

        # Stores statement for the next steps.
        statement = (
            base_statement
            .options(
                joinedload(AuditLog.company),
                joinedload(AuditLog.user),
            )
            .where(*filters)
            .order_by(AuditLog.timestamp.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )

        # Stores items for the next steps.
        items = list(
            db.scalars(statement)
            .unique()
            .all()
        )

        # Returns the completed value to the caller.
        return items, total_items


# Stores audit log repository for the next steps.
audit_log_repository = AuditLogRepository()
