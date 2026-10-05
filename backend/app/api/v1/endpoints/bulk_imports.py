"""Authorized queue, polling, results, cancellation and CSV export endpoints."""
import csv
import io
from uuid import UUID
from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError
from app.api.dependencies import DatabaseSession
from app.core.permissions import CompanyAdminOrSuperAdmin
from app.models.bulk_import import BulkImportJob, BulkImportRow
from app.services import bulk_import_service as service
from app.services.import_preview_service import MAX_FILE_SIZE

router = APIRouter()


@router.post("", status_code=202)
def start(db: DatabaseSession, current_user: CompanyAdminOrSuperAdmin,
          request_id: UUID = Form(..., alias="requestId"), import_type: str = Form(..., alias="importType"),
          file: UploadFile = File(...)):
    try:
        content = file.file.read(MAX_FILE_SIZE + 1)
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(413, "File size exceeds the 10 MB limit.")
        return service.serialize(service.enqueue(db, current_user, import_type, file.filename or "", content, request_id))
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(503, "Unable to queue the import. Please retry the same request.") from exc
    finally:
        file.file.close()


@router.get("")
def recent(db: DatabaseSession, current_user: CompanyAdminOrSuperAdmin, page: int = Query(1, ge=1), page_size: int = Query(10, ge=1, le=50),
           import_type: str | None = Query(None, pattern="^(products|inventory|customers|sales)$"),
           status: str | None = Query(None, pattern="^(Uploaded|Validating|Processing|Completed|Completed with Errors|Failed|Cancelled)$")):
    scope = BulkImportJob.company_id == current_user.company_id
    if import_type:
        scope = scope & (BulkImportJob.import_type == import_type)
    if status:
        scope = scope & (BulkImportJob.status == status)
    jobs = db.scalars(select(BulkImportJob).where(scope).order_by(BulkImportJob.created_at.desc(), BulkImportJob.id).offset((page - 1) * page_size).limit(page_size)).all()
    return {"items": [service.serialize(j) for j in jobs], "total": db.scalar(select(func.count()).select_from(BulkImportJob).where(scope))}


@router.get("/overview")
def overview(db: DatabaseSession, current_user: CompanyAdminOrSuperAdmin):
    counts = dict(db.execute(select(BulkImportJob.status, func.count()).where(
        BulkImportJob.company_id == current_user.company_id).group_by(BulkImportJob.status)).all())
    return {"total": sum(counts.values()), "completed": counts.get("Completed", 0),
        "withErrors": counts.get("Completed with Errors", 0), "failed": counts.get("Failed", 0),
        "active": sum(counts.get(status, 0) for status in service.ACTIVE), "cancelled": counts.get("Cancelled", 0)}


@router.get("/{job_id}")
def status(job_id: UUID, db: DatabaseSession, current_user: CompanyAdminOrSuperAdmin):
    return service.serialize(service.get_job(db, current_user.company_id, job_id))


@router.post("/{job_id}/cancel")
def cancel(job_id: UUID, db: DatabaseSession, current_user: CompanyAdminOrSuperAdmin):
    return service.serialize(service.cancel(db, service.get_job(db, current_user.company_id, job_id)))


@router.get("/{job_id}/rows")
def rows(job_id: UUID, db: DatabaseSession, current_user: CompanyAdminOrSuperAdmin,
         status: str = Query("All", pattern="^(All|Success|Failed|Skipped|Pending)$"),
         page: int = Query(1, ge=1), page_size: int = Query(10, ge=1, le=100)):
    service.get_job(db, current_user.company_id, job_id)
    conditions = [BulkImportRow.job_id == job_id]
    if status != "All":
        conditions.append(BulkImportRow.status == status)
    items = db.scalars(select(BulkImportRow).where(*conditions).order_by(BulkImportRow.row_number).offset((page - 1) * page_size).limit(page_size)).all()
    total = db.scalar(select(func.count()).select_from(BulkImportRow).where(*conditions))
    return {"items": [service.serialize_row(r) for r in items], "total": total}


def safe_cell(value):
    text = str(value or "")
    if text.lstrip().startswith(("=", "+", "-", "@")) or text.startswith(("\t", "\r", "\n")):
        text = "'" + text
    return text


@router.get("/{job_id}/report")
def report(job_id: UUID, db: DatabaseSession, current_user: CompanyAdminOrSuperAdmin,
           kind: str = Query("errors", pattern="^(errors|success)$")):
    job = service.get_job(db, current_user.company_id, job_id)
    if job.status in service.ACTIVE:
        raise HTTPException(409, "Reports are available when processing finishes or is cancelled.")
    states = ("Success",) if kind == "success" else ("Failed", "Skipped")
    records = db.scalars(select(BulkImportRow).where(BulkImportRow.job_id == job.id, BulkImportRow.status.in_(states)).order_by(BulkImportRow.row_number)).all()

    def chunks():
        output = io.StringIO(newline="")
        writer = csv.writer(output, quoting=csv.QUOTE_ALL)
        writer.writerow(["CSV Row", *job.columns, "Processing Status", "Action", "Error Type", "Error Message"])
        yield "\ufeff" + output.getvalue()
        for row in records:
            output.seek(0)
            output.truncate(0)
            writer.writerow([row.row_number, *[safe_cell(row.data.get(c, "")) for c in job.columns], row.status,
                row.action or "", safe_cell(row.error_type), safe_cell(row.message)])
            yield output.getvalue()
    return StreamingResponse(chunks(), media_type="text/csv", headers={"Content-Disposition": f'attachment; filename="import_{job.id}_{kind}.csv"'})
