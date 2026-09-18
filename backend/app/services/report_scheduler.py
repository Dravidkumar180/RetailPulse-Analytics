"""Persistent schedule worker. Atomic due-time advancement prevents duplicate claims."""

import logging
import os
import smtplib
from email.message import EmailMessage
from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo
from sqlalchemy import select, update
from app.models.report import ReportSchedule, ReportRun
from app.models.user import User
from app.schemas.report import ScheduleInput, GenerateReport
from app.services.report_service import generate, export

MANAGERS = {"SUPER_ADMIN", "COMPANY_ADMIN", "ANALYST"}


def next_execution(config, now=None):
    now = now or datetime.now(UTC)
    local = now.astimezone(ZoneInfo(config.timezone))
    for offset in range(370):
        day = local.date() + timedelta(days=offset)
        if config.frequency == "Weekly" and day.weekday() != config.weekday:
            continue
        if config.frequency == "Monthly" and day.day != config.month_day:
            continue
        candidate = datetime.combine(
            day, config.execution_time.replace(tzinfo=None), ZoneInfo(config.timezone)
        ).astimezone(UTC)
        if candidate > now:
            return candidate
    raise ValueError("Cannot determine next execution")


def effective_request(config, now):
    data = config.model_dump(include={"report_type", "filters", "format"}, mode="json")
    if config.period == "previous_period":
        today = now.astimezone(ZoneInfo(config.timezone)).date()
        end = today - timedelta(days=1)
        if config.frequency == "Daily":
            start = end
        elif config.frequency == "Weekly":
            start = today - timedelta(days=7)
        else:
            end = today.replace(day=1) - timedelta(days=1)
            start = end.replace(day=1)
        data["filters"].update(start_date=start.isoformat(), end_date=end.isoformat())
    return GenerateReport.model_validate(data)


def deliver(run, config):
    host, sender = os.getenv("REPORT_SMTP_HOST"), os.getenv("REPORT_SMTP_FROM")
    if not host or not sender:
        raise RuntimeError(
            "Email delivery is not configured. Set REPORT_SMTP_HOST and REPORT_SMTP_FROM; the generated report remains available in History."
        )
    content, mime = export(run, config.format)
    message = EmailMessage()
    message["Subject"] = config.name
    message["From"] = sender
    message["To"] = ", ".join(config.recipients)
    message.set_content(
        f'{run.name}\nPeriod: {run.context["period"]}\nCompany: {run.context["company"]}\nYour scheduled report is attached.'
    )
    main, sub = mime.split(";")[0].split("/")
    message.add_attachment(
        content,
        maintype=main,
        subtype=sub,
        filename=f"{run.report_type}.{config.format.lower()}",
    )
    with smtplib.SMTP(
        host, int(os.getenv("REPORT_SMTP_PORT", "587")), timeout=30
    ) as smtp:
        if os.getenv("REPORT_SMTP_STARTTLS", "true").lower() == "true":
            smtp.starttls()
        if os.getenv("REPORT_SMTP_USER"):
            smtp.login(
                os.environ["REPORT_SMTP_USER"], os.environ["REPORT_SMTP_PASSWORD"]
            )
        refused = smtp.send_message(message)
        if refused:
            raise RuntimeError("Delivery was rejected for one or more recipients.")


def execute_due(db, now=None):
    now = now or datetime.now(UTC)
    ids = db.scalars(
        select(ReportSchedule.id).where(
            ReportSchedule.active.is_(True), ReportSchedule.next_run <= now
        )
    ).all()
    for schedule_id in ids:
        schedule = db.get(ReportSchedule, schedule_id)
        config = ScheduleInput.model_validate(schedule.configuration)
        claim = db.execute(
            update(ReportSchedule)
            .where(
                ReportSchedule.id == schedule_id,
                ReportSchedule.active.is_(True),
                ReportSchedule.next_run == schedule.next_run,
                ReportSchedule.next_run <= now,
            )
            .values(next_run=next_execution(config, now), last_run=now)
            # SQLite returns timezone-naive datetimes even for timezone-aware
            # columns.  Do not have SQLAlchemy evaluate this predicate against
            # objects in the session; let the database perform the atomic claim.
            .execution_options(synchronize_session=False)
        )
        if claim.rowcount != 1:
            db.rollback()
            continue
        user = db.get(User, schedule.user_id)
        # Persist the execution record in the same transaction as the claim.
        # A crash cannot silently consume a due occurrence without history.
        run = ReportRun(
            company_id=schedule.company_id,
            user_id=schedule.user_id,
            schedule_id=schedule.id,
            name=schedule.name,
            generated_by=user.name if user else "Unavailable",
            report_type=config.report_type,
            filters=config.filters.model_dump(mode="json"),
            format=config.format,
        )
        db.add(run)
        db.commit()
        if (
            not user
            or user.company_id != schedule.company_id
            or str(user.status) != "ACTIVE"
            or str(user.role) not in MANAGERS
        ):
            schedule.active = False
            run.status = "FAILED"
            run.error = "Schedule owner no longer has permission. Schedule disabled."
            db.commit()
            continue
        try:
            run = generate(
                db, user, effective_request(config, now), schedule.id, existing_run=run
            )
        except Exception:
            db.rollback()
            run.status = "FAILED"
            run.error = "Scheduled filters are no longer available. Edit this schedule."
            db.commit()
        if run.status == "COMPLETED":
            run.delivery_status = "SENDING"
            db.commit()
            try:
                deliver(run, config)
                run.delivery_status = "SENT"
            except Exception as exc:
                logging.getLogger(__name__).exception(
                    "Scheduled report delivery failed"
                )
                run.delivery_status = "FAILED"
                run.error = (
                    str(exc)
                    if isinstance(exc, RuntimeError)
                    else "Email delivery failed. Check SMTP configuration and recipient addresses."
                )
            db.commit()
    # A terminated worker must not leave an apparently successful/in-progress run forever.
    stale = db.scalars(
        select(ReportRun).where(
            ReportRun.created_at < now - timedelta(hours=1),
            ReportRun.status == "GENERATING",
        )
    ).all()
    for run in stale:
        run.status = "FAILED"
        run.error = "Generation was interrupted. Please generate the report again."
    for run in db.scalars(
        select(ReportRun).where(
            ReportRun.created_at < now - timedelta(hours=1),
            ReportRun.delivery_status == "SENDING",
        )
    ).all():
        run.delivery_status = "UNKNOWN"
        run.error = "Delivery was interrupted; check recipients before resending."
    db.commit()
