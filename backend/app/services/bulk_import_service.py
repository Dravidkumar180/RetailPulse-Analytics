"""Database-backed queue with leases, row savepoints and atomic batch checkpoints."""
import hashlib
import logging
from datetime import UTC, datetime, timedelta
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy import func, or_, select, update
from sqlalchemy.exc import IntegrityError
from app.models.bulk_import import BulkImportJob, BulkImportRow
from app.models.catalog import Product
from app.models.company import Company
from app.models.customer import Customer
from app.models.inventory import Inventory
from app.services.import_preview_service import preview_csv
from app.services.import_validation_service import validate_records
from app.services.import_record_writer import write_record
from app.core.constants import AuditAction
from app.services.notification_service import audit, emit
# Register the durable data quality change listeners for imported business records.
from app.services import data_quality_service  # noqa: F401

ACTIVE = ("Uploaded", "Validating", "Processing")
TERMINAL = ("Completed", "Completed with Errors", "Failed", "Cancelled")
BATCH_SIZE = 100
LEASE_SECONDS = 120
logger = logging.getLogger(__name__)


def lifecycle(db, job, event):
    actions = {"Uploaded": AuditAction.IMPORT_UPLOADED, "Started": AuditAction.IMPORT_STARTED,
        "Completed": AuditAction.IMPORT_COMPLETED, "Completed with Errors": AuditAction.IMPORT_COMPLETED,
        "Failed": AuditAction.IMPORT_FAILED, "Cancelled": AuditAction.IMPORT_CANCELLED}
    audit(db, job.company_id, job.user_id, actions[event],
        f"Import {job.id}: {event}; type={job.import_type}; file={job.filename}; actor={job.user_name}")
    kinds = {"Started": "IMPORT_STARTED", "Completed": "IMPORT_COMPLETED",
        "Completed with Errors": "IMPORT_COMPLETED_WITH_ERRORS", "Failed": "IMPORT_FAILED"}
    if event in kinds:
        emit(db, company_id=job.company_id, type=kinds[event], title=f"Import {event.lower()}",
            message=f"{job.filename}: {event.lower()}. {job.successful} successful, {job.failed} failed, {job.skipped} skipped.",
            priority="HIGH" if event == "Failed" else "MEDIUM" if event == "Completed with Errors" else "LOW",
            resource_type="import", resource_id=job.id, path=f"/data-import?job={job.id}",
            details={"Import ID": str(job.id), "Total": job.total, "Successful": job.successful,
                "Failed": job.failed, "Skipped": job.skipped}, event_key=f"bulk-import:{job.id}:{event}")


def now():
    return datetime.now(UTC)


def get_job(db, company_id, job_id):
    job = db.scalar(select(BulkImportJob).where(BulkImportJob.id == job_id, BulkImportJob.company_id == company_id))
    if not job:
        raise HTTPException(404, "Import not found.")
    return job


def enqueue(db, user, kind, filename, content, request_id, reason=None):
    if not user.company_id:
        raise HTTPException(403, "A company account is required for imports.")
    digest = hashlib.sha256(kind.encode() + b"\0" + content).hexdigest()

    def existing():
        job = db.get(BulkImportJob, request_id)
        if job and (job.company_id != user.company_id or job.user_id != user.id or job.fingerprint != digest):
            raise HTTPException(409, "This request identifier has already been used. Start a new upload.")
        return job

    job = existing()
    if job:
        return job
    parsed = preview_csv(kind, filename, content, include_all=True)
    if not parsed["structureValid"]:
        raise ValueError(" ".join(parsed["errors"]))
    from app.services.workflow_service import required
    held = kind == "inventory" and required(db,user.company_id,"INVENTORY_IMPORT_APPROVAL")
    if held and not (reason or "").strip():
        raise HTTPException(422,"A reason is required for inventory import approval.")
    clean_name = filename.replace("\\", "/").rsplit("/", 1)[-1]
    clean_name = "".join(c for c in clean_name if c.isprintable())[:255] or "import.csv"
    job = BulkImportJob(id=request_id, company_id=user.company_id, user_id=user.id, user_name=user.name,
        import_type=kind, filename=clean_name, fingerprint=digest, columns=parsed["columns"], total=parsed["totalRows"], status="Awaiting Approval" if held else "Uploaded")
    try:
        db.add(job)
        db.flush()
        db.add_all([BulkImportRow(job_id=job.id, row_number=line, data=row) for line, row in zip(parsed["rowNumbers"], parsed["rows"])])
        lifecycle(db, job, "Uploaded")
        if held:
            db.flush()
            from app.api.v1.endpoints.workflows import RequestWrite
            from app.services.workflow_service import create
            create(db,user,RequestWrite(request_type="INVENTORY_IMPORT_APPROVAL",related_id=job.id,requested_values={"release_import":True},reason=reason))
        db.commit()
    except IntegrityError:
        db.rollback()
        duplicate = existing()
        if duplicate:
            return duplicate
        raise
    return job


def serialize(job):
    def timestamp(value):
        return value.replace(tzinfo=UTC).isoformat() if value else None
    start = job.started_at
    duration = 0
    if start:
        duration = max(0, ((job.completed_at or now()).replace(tzinfo=UTC) - start.replace(tzinfo=UTC)).total_seconds())
    processed = job.successful + job.failed + job.skipped
    return {"id": str(job.id), "importType": job.import_type, "filename": job.filename,
        "uploadedBy": job.user_name, "uploadDate": timestamp(job.created_at), "columns": job.columns,
        "totalRecords": job.total, "successfulRecords": job.successful, "failedRecords": job.failed,
        "skippedRecords": job.skipped, "duplicateRecords": job.duplicates, "processedRecords": processed,
        "progress": round(processed / job.total * 100, 1) if job.total else 0,
        "status": job.status, "cancelRequested": job.cancel_requested, "durationSeconds": round(duration, 1),
        "startedAt": timestamp(start), "completedAt": timestamp(job.completed_at), "message": job.message}


def serialize_row(row):
    return {"rowNumber": row.row_number, "data": row.data, "status": row.status, "action": row.action,
        "errorType": row.error_type, "message": row.message, "recordId": row.record_id}


def recount(db, job):
    db.flush()
    counts = dict(db.execute(select(BulkImportRow.status, func.count()).where(BulkImportRow.job_id == job.id).group_by(BulkImportRow.status)).all())
    job.successful, job.failed = counts.get("Success", 0), counts.get("Failed", 0)
    job.skipped = counts.get("Skipped", 0)
    job.duplicates = db.scalar(select(func.count()).select_from(BulkImportRow).where(BulkImportRow.job_id == job.id, BulkImportRow.error_type == "Duplicate"))


def finish(db, job, status, message=None):
    if status in ("Failed", "Cancelled"):
        db.execute(update(BulkImportRow).where(BulkImportRow.job_id == job.id, BulkImportRow.status == "Pending")
            .values(status="Skipped", action="Not processed", error_type=status, message="Not processed because the import was cancelled." if status == "Cancelled" else "Not processed because the import stopped."))
    recount(db, job)
    job.status, job.completed_at, job.message = status, now(), message
    job.lease_until = None
    job.lease_token = None
    lifecycle(db, job, status)


def cancel(db, job):
    # Lock the same job row used by the worker. Completed batches remain committed.
    db.execute(update(BulkImportJob).where(BulkImportJob.id == job.id, BulkImportJob.status.in_(ACTIVE)).values(cancel_requested=True))
    db.refresh(job)
    if job.status in TERMINAL:
        return job
    if job.status == "Uploaded":
        finish(db, job, "Cancelled", "Import cancelled before processing started.")
    else:
        job.cancel_requested = True
    db.commit()
    return job


def claim_next(session_factory):
    with session_factory() as db:
        expired = or_(BulkImportJob.lease_until.is_(None), BulkImportJob.lease_until < now())
        ids = db.scalars(select(BulkImportJob.id).where(BulkImportJob.status.in_(ACTIVE), expired)
            .order_by(BulkImportJob.created_at).limit(10)).all()
        for job_id in ids:
            token = str(uuid4())
            claimed = db.execute(update(BulkImportJob).where(BulkImportJob.id == job_id,
                BulkImportJob.status.in_(ACTIVE), expired).values(lease_token=token, lease_until=now() + timedelta(seconds=LEASE_SECONDS)))
            db.commit()
            if claimed.rowcount:
                return job_id, token
    return None


def apply_validation(record, result):
    if result["status"] == "Valid":
        return
    duplicate = result["status"] == "Duplicate"
    record.status = "Skipped" if duplicate else "Failed"
    record.action = "Skipped" if duplicate else "Rejected"
    record.error_type = "Duplicate" if duplicate else "Validation"
    record.message = " ".join(f'{issue["type"]}: {issue["message"]}' for issue in result["issues"])


def parsed_rows(job, rows):
    return {"columns": job.columns, "rowNumbers": [r.row_number for r in rows], "rows": [r.data for r in rows]}


def step(session_factory, job_id, token):
    """One transaction per validation or processing batch; returns whether work remains."""
    with session_factory() as db:
        # The write locks the job even on SQLite and fences an expired/replaced worker.
        changed = db.execute(update(BulkImportJob).where(BulkImportJob.id == job_id,
            BulkImportJob.lease_token == token, BulkImportJob.status.in_(ACTIVE))
            .values(lease_until=now() + timedelta(seconds=LEASE_SECONDS)))
        if not changed.rowcount:
            db.rollback()
            return False
        job = db.get(BulkImportJob, job_id)
        if job.cancel_requested:
            finish(db, job, "Cancelled", "Import cancelled. Previously completed records were retained.")
            db.commit()
            return False
        if job.status == "Uploaded":
            job.status, job.started_at = "Validating", now()
            lifecycle(db, job, "Started")
            db.commit()
            return True
        # Serialize import workers per company; locks also coordinate with normal stock edits.
        db.scalar(select(Company.id).where(Company.id == job.company_id).with_for_update())
        if job.import_type in ("sales", "inventory"):
            list(db.scalars(select(Product.id).where(Product.company_id == job.company_id).order_by(Product.id).with_for_update()))
            list(db.scalars(select(Inventory.id).where(Inventory.company_id == job.company_id).order_by(Inventory.id).with_for_update()))
        if job.import_type == "sales":
            list(db.scalars(select(Customer.id).where(Customer.company_id == job.company_id).order_by(Customer.id).with_for_update()))
        query = select(BulkImportRow).where(BulkImportRow.job_id == job.id, BulkImportRow.status == "Pending").order_by(BulkImportRow.row_number)
        rows = list(db.scalars(query if job.status == "Validating" else query.limit(BATCH_SIZE)))
        if not rows:
            finish(db, job, "Completed with Errors" if job.failed or job.skipped else "Completed")
            db.commit()
            return False
        results = validate_records(db, job.company_id, job.import_type, parsed_rows(job, rows))["rows"]
        validating = job.status == "Validating"
        context = {}
        for record, result in zip(rows, results):
            apply_validation(record, result)
            if validating or record.status != "Pending":
                continue
            try:
                # Failed writes roll back this record's products/stock/sale together.
                with db.begin_nested():
                    record_id, action = write_record(db, job, record, context)
                    db.flush()
                    record.record_id, record.action, record.status = record_id, action, "Success"
            except IntegrityError:
                context.clear()
                record.status, record.action, record.error_type = "Failed", "Rejected", "Conflict"
                record.message = "A conflicting record was saved while this import was running. Review and revalidate this row."
            except ValueError as exc:
                context.clear()
                record.status, record.action, record.error_type = "Failed", "Rejected", "Validation"
                record.message = str(exc)
        job.status = "Processing"
        recount(db, job)
        if job.successful + job.failed + job.skipped == job.total:
            finish(db, job, "Completed with Errors" if job.failed or job.skipped else "Completed")
        # Extend from the actual commit time, not the start of a long validation pass.
        if job.status in ACTIVE:
            job.lease_until = now() + timedelta(seconds=LEASE_SECONDS)
        db.commit()
        return job.status in ACTIVE


def run_once(session_factory):
    claimed = claim_next(session_factory)
    if not claimed:
        return False
    job_id, token = claimed
    try:
        while step(session_factory, job_id, token):
            pass
    except Exception:
        logger.exception("Bulk import worker failed for import %s", job_id)
        with session_factory() as db:
            job = db.scalar(select(BulkImportJob).where(BulkImportJob.id == job_id, BulkImportJob.lease_token == token).with_for_update())
            if job and job.status in ACTIVE:
                finish(db, job, "Failed", "Processing stopped unexpectedly. Completed batches were retained; download the results before retrying unprocessed rows.")
                db.commit()
    return True
