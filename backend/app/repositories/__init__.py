from datetime import UTC, date, datetime, time
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.orm import (
    Session,
    joinedload,
)

from app.core.constants import AuditAction
from app.models.audit_log import AuditLog
from app.models.company import Company
from app.models.user import User


class AuditLogRepository:
    def create(
        self,
        db: Session,
        *,
        company_id: UUID,
        user_id: UUID | None,
        action: AuditAction,
        ip_address: str,
        browser: str,
    ) -> AuditLog:
        audit_log = AuditLog(
            company_id=company_id,
            user_id=user_id,
            action=action,
            ip_address=ip_address[:64],
            browser=browser[:500],
            timestamp=datetime.now(UTC),
        )

        db.add(audit_log)
        db.flush()

        return audit_log

    def get_by_id(
        self,
        db: Session,
        audit_log_id: UUID,
        *,
        company_id: UUID | None = None,
    ) -> AuditLog | None:
        statement = (
            select(AuditLog)
            .options(
                joinedload(AuditLog.company),
                joinedload(AuditLog.user),
            )
            .where(AuditLog.id == audit_log_id)
        )

        if company_id is not None:
            statement = statement.where(
                AuditLog.company_id == company_id,
            )

        return db.scalar(statement)

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
        filters = []

        if company_id is not None:
            filters.append(
                AuditLog.company_id == company_id,
            )

        if action:
            filters.append(AuditLog.action == action)

        if user_id:
            filters.append(AuditLog.user_id == user_id)

        if start_date:
            start_datetime = datetime.combine(
                start_date,
                time.min,
                tzinfo=UTC,
            )
            filters.append(
                AuditLog.timestamp >= start_datetime,
            )

        if end_date:
            end_datetime = datetime.combine(
                end_date,
                time.max,
                tzinfo=UTC,
            )
            filters.append(
                AuditLog.timestamp <= end_datetime,
            )

        if search:
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
                )
            )

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

        total_items = int(
            db.scalar(count_statement)
            or 0
        )

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

        items = list(
            db.scalars(statement)
            .unique()
            .all()
        )

        return items, total_items


audit_log_repository = AuditLogRepository()