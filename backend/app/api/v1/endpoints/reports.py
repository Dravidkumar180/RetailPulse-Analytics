from typing import Literal
from uuid import UUID
from datetime import UTC, datetime
from fastapi import APIRouter, HTTPException, Query, Response
from sqlalchemy import select, func
from app.api.dependencies import DatabaseSession
from app.core.permissions import AllAuthenticatedRoles
from app.models.report import ReportRun, ReportSchedule
from app.schemas.report import GenerateReport, ScheduleInput
from app.services import report_service as service
from app.services.report_scheduler import MANAGERS, next_execution

router = APIRouter()


def manager(user):
    if str(user.role) not in MANAGERS:
        raise HTTPException(403, "Your role cannot manage scheduled reports")


def scoped(db, model, id, user):
    row = db.scalar(
        select(model).where(model.id == id, model.company_id == user.company_id)
    )
    if not row:
        raise HTTPException(404, "Report or schedule not found")
    return row


def run_json(run):
    return {
        key: getattr(run, key)
        for key in [
            "id",
            "schedule_id",
            "name",
            "generated_by",
            "created_at",
            "report_type",
            "filters",
            "context",
            "format",
            "status",
            "error",
            "delivery_status",
        ]
    } | {"total": len(run.rows), "columns": run.columns}


def schedule_json(db, row):
    latest = db.scalar(
        select(ReportRun)
        .where(ReportRun.company_id == row.company_id, ReportRun.schedule_id == row.id)
        .order_by(ReportRun.created_at.desc())
        .limit(1)
    )
    return {
        **row.configuration,
        "id": row.id,
        "active": row.active,
        "next_run": row.next_run,
        "last_run": row.last_run,
        "last_report": run_json(latest) if latest else None,
        "user_id": row.user_id,
    }


@router.get("/options")
def options(db: DatabaseSession, user: AllAuthenticatedRoles):
    return service.options(db, user)


@router.post("/generate")
def generate(body: GenerateReport, db: DatabaseSession, user: AllAuthenticatedRoles):
    return run_json(service.generate(db, user, body))


@router.get("/history")
def history(
    db: DatabaseSession,
    user: AllAuthenticatedRoles,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    report_type: str | None = None,
    status: str | None = None,
    search: str = "",
    schedule_id: UUID | None = None,
):
    conditions = [ReportRun.company_id == user.company_id]
    if report_type:
        conditions.append(ReportRun.report_type == report_type)
    if status:
        conditions.append(ReportRun.status == status)
    if search:
        conditions.append(ReportRun.name.ilike("%" + search + "%"))
    if schedule_id:
        conditions.append(ReportRun.schedule_id == schedule_id)
    total = db.scalar(select(func.count()).select_from(ReportRun).where(*conditions))
    rows = db.scalars(
        select(ReportRun)
        .where(*conditions)
        .order_by(ReportRun.created_at.desc(), ReportRun.id)
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return {"items": [run_json(r) for r in rows], "total": total}


@router.get("/schedules")
def schedules(db: DatabaseSession, user: AllAuthenticatedRoles):
    manager(user)
    return [
        schedule_json(db, row)
        for row in db.scalars(
            select(ReportSchedule)
            .where(ReportSchedule.company_id == user.company_id)
            .order_by(ReportSchedule.name)
        ).all()
    ]


@router.post("/schedules")
def create_schedule(
    body: ScheduleInput, db: DatabaseSession, user: AllAuthenticatedRoles
):
    manager(user)
    service.validate_scope(db, user, body.filters)
    row = ReportSchedule(
        company_id=user.company_id,
        user_id=user.id,
        name=body.name,
        configuration=body.model_dump(mode="json"),
        active=body.active,
        next_run=next_execution(body),
    )
    db.add(row)
    db.commit()
    return schedule_json(db, row)


@router.put("/schedules/{id}")
def edit_schedule(
    id: UUID, body: ScheduleInput, db: DatabaseSession, user: AllAuthenticatedRoles
):
    manager(user)
    row = scoped(db, ReportSchedule, id, user)
    service.validate_scope(db, user, body.filters)
    row.name, row.configuration, row.active = (
        body.name,
        body.model_dump(mode="json"),
        body.active,
    )
    row.user_id = user.id
    row.next_run = next_execution(body)
    db.commit()
    return schedule_json(db, row)


@router.delete("/schedules/{id}", status_code=204)
def delete_schedule(id: UUID, db: DatabaseSession, user: AllAuthenticatedRoles):
    manager(user)
    row = scoped(db, ReportSchedule, id, user)
    # Explicitly preserve history even on development SQLite without FK pragmas.
    for run in db.scalars(
        select(ReportRun).where(
            ReportRun.schedule_id == id, ReportRun.company_id == user.company_id
        )
    ).all():
        run.schedule_id = None
    db.delete(row)
    db.commit()
    return Response(status_code=204)


@router.get("/{id}/download")
def download(
    id: UUID,
    db: DatabaseSession,
    user: AllAuthenticatedRoles,
    format: Literal["CSV", "PDF"] = "CSV",
):
    run = scoped(db, ReportRun, id, user)
    content, mime = service.export(run, format)
    run.format = format
    db.commit()
    return Response(
        content,
        media_type=mime,
        headers={
            "Content-Disposition": f'attachment; filename="{run.report_type}-{run.id}.{format.lower()}"'
        },
    )


@router.get("/{id}")
def detail(
    id: UUID,
    db: DatabaseSession,
    user: AllAuthenticatedRoles,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    sort_by: str | None = None,
    direction: Literal["asc", "desc"] = "asc",
):
    run = scoped(db, ReportRun, id, user)
    rows = run.rows
    if sort_by:
        if sort_by not in run.columns:
            raise HTTPException(400, "Unknown sort column")
        rows = sorted(
            rows,
            key=lambda r: (
                r.get(sort_by) is None,
                r.get(sort_by) if r.get(sort_by) is not None else "",
            ),
            reverse=direction == "desc",
        )
    return {**run_json(run), "rows": rows[(page - 1) * page_size : page * page_size]}
