from datetime import date, datetime, time, UTC, timedelta
from typing import Literal
from uuid import UUID
from fastapi import APIRouter, BackgroundTasks, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func, or_, cast, String
from sqlalchemy.exc import IntegrityError
from app.api.dependencies import DatabaseSession
from app.core.permissions import AnalystOrHigher, CompanyAdminOrSuperAdmin
from app.models.data_quality import QualityIssue, QualityRun
from app.models.catalog import Product
from app.models.inventory import Inventory, InventoryMovement
from app.models.sales import Sale, SaleItem
from app.models.customer import Customer
from app.models.report import ReportRun
from app.services import data_quality_service as service

router = APIRouter()


def serialize(row):
    values = {
        c.key: getattr(row, c.key)
        for c in row.__table__.columns
        if c.key not in ("company_id", "active_company", "claimed_at")
    }
    return {
        key: (
            value.replace(tzinfo=UTC)
            if isinstance(value, datetime) and value.tzinfo is None
            else value
        )
        for key, value in values.items()
    }


def scoped(db, model, id, company):
    row = db.scalar(select(model).where(model.id == id, model.company_id == company))
    if row is None:
        raise HTTPException(404, "Record not found")
    return row


@router.get("/overview")
def overview(db: DatabaseSession, user: AnalystOrHigher):
    latest = db.scalar(
        select(QualityRun)
        .where(QualityRun.company_id == user.company_id)
        .order_by(QualityRun.started_at.desc())
        .limit(1)
    )
    baseline = db.scalar(
        select(QualityRun)
        .where(
            QualityRun.company_id == user.company_id,
            QualityRun.trigger == "Manual",
            QualityRun.status.in_(["Completed", "Completed with Issues"]),
        )
        .order_by(QualityRun.started_at.desc())
        .limit(1)
    )
    unresolved = db.scalar(
        select(func.count())
        .select_from(QualityIssue)
        .where(
            QualityIssue.company_id == user.company_id,
            QualityIssue.status.in_(["Open", "Investigating"]),
        )
    )
    return dict(
        latest=serialize(latest) if latest else None,
        baseline=serialize(baseline) if baseline else None,
        unresolved=unresolved,
        checks=service.CHECKS,
    )


@router.post("/runs", status_code=202)
def run_checks(
    db: DatabaseSession, user: CompanyAdminOrSuperAdmin, tasks: BackgroundTasks
):
    try:
        run = service.start(db, user.company_id, user.name, user.id, "Manual")
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            409, "A reconciliation is already running for your company."
        )
    tasks.add_task(service.worker, run.id)
    return serialize(run)


@router.get("/runs")
def history(
    db: DatabaseSession,
    user: AnalystOrHigher,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
):
    condition = QualityRun.company_id == user.company_id
    total = db.scalar(select(func.count()).select_from(QualityRun).where(condition))
    rows = db.scalars(
        select(QualityRun)
        .where(condition)
        .order_by(QualityRun.started_at.desc(), QualityRun.id)
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return {"items": [serialize(r) for r in rows], "total": total}


@router.get("/runs/{id}")
def run_detail(id: UUID, db: DatabaseSession, user: AnalystOrHigher):
    return serialize(scoped(db, QualityRun, id, user.company_id))


@router.get("/issues")
def issues(
    db: DatabaseSession,
    user: AnalystOrHigher,
    search: str = "",
    issue_type: str | None = None,
    severity: Literal["Warning", "Error"] | None = None,
    module: str | None = None,
    status: Literal["Open", "Investigating", "Resolved", "Ignored"] | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
):
    if date_from and date_to and date_from > date_to:
        raise HTTPException(422, "Start date must be before end date.")
    conditions = [QualityIssue.company_id == user.company_id]
    for key, value in [
        ("issue_type", issue_type),
        ("severity", severity),
        ("module", module),
        ("status", status),
    ]:
        if value:
            conditions.append(getattr(QualityIssue, key) == value)
    if search.strip():
        term = "%" + search.strip().replace("%", "\\%").replace("_", "\\_") + "%"
        conditions.append(
            or_(
                cast(QualityIssue.id, String).ilike(term, escape="\\"),
                *[
                    getattr(QualityIssue, k).ilike(term, escape="\\")
                    for k in ("record_label", "description", "issue_type", "record_id")
                ],
            )
        )
    if date_from:
        conditions.append(
            QualityIssue.detected_at >= datetime.combine(date_from, time.min, UTC)
        )
    if date_to:
        conditions.append(
            QualityIssue.detected_at
            < datetime.combine(date_to + timedelta(days=1), time.min, UTC)
        )
    total = db.scalar(select(func.count()).select_from(QualityIssue).where(*conditions))
    rows = db.scalars(
        select(QualityIssue)
        .where(*conditions)
        .order_by(QualityIssue.detected_at.desc(), QualityIssue.id)
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return {"items": [serialize(r) for r in rows], "total": total}


@router.get("/issues/{id}")
def detail(id: UUID, db: DatabaseSession, user: AnalystOrHigher):
    issue = scoped(db, QualityIssue, id, user.company_id)
    model = {
        "Products": Product,
        "Inventory": Inventory,
        "Sales": Sale,
        "Customers": Customer,
        "Reports": ReportRun,
    }.get(issue.module)
    record = (
        db.scalar(
            select(model).where(
                model.id == UUID(issue.record_id), model.company_id == user.company_id
            )
        )
        if model
        else None
    )
    # Explicit fields only: never traverse unscoped ORM relationships.
    fields = {
        "Products": ["name", "sku", "stock_quantity", "status"],
        "Inventory": ["current_stock", "reserved_stock", "available_stock"],
        "Sales": ["invoice_number", "customer_name", "total_amount", "sale_date"],
        "Customers": ["full_name", "email", "phone", "status"],
        "Reports": ["name", "report_type", "status", "created_at"],
    }
    current = {k: getattr(record, k) for k in fields[issue.module]} if record else None
    related_sales, movements = [], []
    product_id = (
        record.product_id
        if isinstance(record, Inventory)
        else record.id if isinstance(record, Product) else None
    )
    if product_id:
        related_sales = [
            dict(
                id=str(s.id),
                invoice=s.invoice_number,
                total=str(s.total_amount),
                date=s.sale_date,
            )
            for s in db.scalars(
                select(Sale)
                .join(SaleItem)
                .where(
                    Sale.company_id == user.company_id,
                    SaleItem.product_id == product_id,
                )
                .distinct()
                .order_by(Sale.sale_date.desc())
                .limit(50)
            )
        ]
        movements = [
            dict(
                id=str(m.id),
                previous=m.previous_quantity,
                change=m.quantity_changed,
                current=m.updated_quantity,
                type=m.movement_type,
                at=m.created_at,
            )
            for m in db.scalars(
                select(InventoryMovement)
                .join(Inventory)
                .where(
                    Inventory.company_id == user.company_id,
                    Inventory.product_id == product_id,
                )
                .order_by(InventoryMovement.created_at.desc())
                .limit(50)
            )
        ]
    return {
        **serialize(issue),
        "current_record": current,
        "related_sales": related_sales,
        "movements": movements,
    }


class StatusUpdate(BaseModel):
    status: Literal["Open", "Investigating", "Resolved", "Ignored"]
    previous_status: Literal["Open", "Investigating", "Resolved", "Ignored"]
    note: str = Field(min_length=1, max_length=4000)


@router.patch("/issues/{id}")
def update(
    id: UUID, body: StatusUpdate, db: DatabaseSession, user: CompanyAdminOrSuperAdmin
):
    row = db.scalar(
        select(QualityIssue)
        .where(QualityIssue.id == id, QualityIssue.company_id == user.company_id)
        .with_for_update()
    )
    if row is None:
        raise HTTPException(404, "Issue not found")
    if row.status != body.previous_status:
        raise HTTPException(409, "Issue changed; refresh before updating.")
    if not body.note.strip():
        raise HTTPException(422, "A resolution or investigation note is required.")
    service.transition(db, row, body.status, body.note.strip(), user.name, user.id)
    db.commit()
    return serialize(row)


@router.get("/export")
def export_issues(
    db: DatabaseSession,
    user: AnalystOrHigher,
    format: Literal["CSV", "PDF"] = "CSV",
    search: str = "",
    issue_type: str | None = None,
    severity: Literal["Warning", "Error"] | None = None,
    module: str | None = None,
    status: Literal["Open", "Investigating", "Resolved", "Ignored"] | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
):
    import csv
    import io
    from fastapi import Response
    from app.core.constants import AuditAction

    records, page = [], 1
    while True:
        batch = issues(
            db,
            user,
            search,
            issue_type,
            severity,
            module,
            status,
            date_from,
            date_to,
            page,
            100,
        )
        records.extend(batch["items"])
        if len(records) >= batch["total"]:
            break
        page += 1
    columns = [
        "id",
        "issue_type",
        "severity",
        "module",
        "record_label",
        "description",
        "detected_at",
        "status",
        "resolved_by",
        "resolved_at",
        "resolution_note",
    ]
    if format == "CSV":
        stream = io.StringIO()
        writer = csv.writer(stream)
        writer.writerow(columns)
        for row in records:
            values = [str(row.get(k) or "") for k in columns]
            writer.writerow(
                [
                    "'" + v if v.lstrip().startswith(("=", "+", "-", "@")) else v
                    for v in values
                ]
            )
        content, mime = stream.getvalue().encode("utf-8-sig"), "text/csv"
    else:
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet
        from xml.sax.saxutils import escape

        stream = io.BytesIO()
        styles = getSampleStyleSheet()
        story = [
            Paragraph("Data Quality &amp; Reconciliation", styles["Title"]),
            Paragraph(
                f"{len(records)} issues · Generated {datetime.now(UTC).isoformat()}",
                styles["Normal"],
            ),
            Spacer(1, 16),
        ]
        for row in records:
            story.append(
                Paragraph(
                    escape(f"{row['issue_type']} — {row['record_label']}"),
                    styles["Heading2"],
                )
            )
            for key in columns:
                story.append(
                    Paragraph(
                        escape(f"{key.replace('_', ' ')}: {row.get(key) or '—'}"),
                        styles["Normal"],
                    )
                )
            story.append(Spacer(1, 12))
        SimpleDocTemplate(stream).build(story)
        content, mime = stream.getvalue(), "application/pdf"
    service.audit(
        db,
        user.company_id,
        user.id,
        AuditAction.REPORT_EXPORTED,
        f"Data quality report exported: {len(records)} issues ({format}).",
    )
    db.commit()
    return Response(
        content,
        media_type=mime,
        headers={
            "Content-Disposition": f'attachment; filename="data-quality.{format.lower()}"'
        },
    )
