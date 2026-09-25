"""Checks use live tenant-scoped records; only findings and execution metadata are stored."""

from collections import defaultdict
from datetime import timedelta
from decimal import Decimal
import logging
import re
from uuid import UUID
from sqlalchemy import select, func, or_, event, update
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.catalog import Product
from app.models.customer import Customer, CustomerPurchaseSummary
from app.models.sales import Sale, SaleItem
from app.models.inventory import Inventory, InventoryMovement
from app.models.audit_log import AuditLog
from app.models.report import ReportRun
from app.models.user import User
from app.models.data_quality import QualityIssue, QualityRun, QualityChange, now
from app.core.constants import AuditAction

CHECKS = [
    "Invalid SKU",
    "Duplicate SKU",
    "Missing product information",
    "Missing customer information",
    "Inventory mismatch",
    "Stock movement mismatch",
    "Sale exceeds stock",
    "Invalid product reference",
    "Invalid customer reference",
    "Report totals mismatch",
]


def audit(db, company, user, action, description, before=None, after=None):
    db.add(
        AuditLog(
            company_id=company,
            user_id=user,
            action=action,
            details=description,
            before_values=before,
            after_values=after,
            timestamp=now(),
            ip_address="system",
            browser="Data Quality",
        )
    )


def transition(db, issue, status, note, actor, user_id=None):
    previous = issue.status
    stamp = now()
    issue.history = [
        *issue.history,
        dict(
            previous_status=previous,
            new_status=status,
            note=note,
            actor=actor,
            user_id=str(user_id) if user_id else None,
            at=stamp.isoformat(),
        ),
    ]
    issue.status = status
    issue.resolution_note = note
    issue.resolved_by = actor if status == "Resolved" else None
    issue.resolved_at = stamp if status == "Resolved" else None
    audit(
        db,
        issue.company_id,
        user_id,
        AuditAction.QUALITY_ISSUE_UPDATED,
        f"Data quality issue {issue.id}: {previous} ? {status}",
        {"status": previous},
        {"status": status, "note": note},
    )


def reconcile(db, run, targets=None):
    company = run.company_id
    checked, findings, failures = set(), {}, []
    counts = defaultdict(int)
    movement_errors = set()

    def rows(model, module):
        query = select(model).where(model.company_id == company)
        if targets is not None:
            ids = targets.get(module, set())
            query = query.where(model.id.in_([UUID(i) for i in ids]))
        return db.scalars(query).all()

    def issue(kind, module, row, label, description, evidence=None, severity="Error"):
        findings[(kind, str(row.id))] = dict(
            issue_type=kind,
            module=module,
            record_id=str(row.id),
            record_label=label,
            description=description,
            evidence=evidence or {},
            severity=severity,
        )
        counts[kind] += 1

    def execute(module, model, check):
        for row in rows(model, module):
            key = (module, str(row.id))
            try:
                check(row)
                checked.add(key)
            except Exception:
                logging.getLogger(__name__).exception(
                    "Quality check failed: %s %s", module, row.id
                )
                failures.append(
                    {
                        "module": module,
                        "record_id": str(row.id),
                        "message": "Check failed; retry reconciliation.",
                    }
                )

    def product(p):
        if not p.sku or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]*", p.sku):
            issue(
                "Invalid SKU",
                "Products",
                p,
                p.name,
                "SKU must contain letters, numbers, dots, underscores or hyphens.",
                severity="Warning",
            )
        duplicates = db.scalar(
            select(func.count())
            .select_from(Product)
            .where(
                Product.company_id == company,
                func.lower(func.trim(Product.sku)) == (p.sku or "").strip().lower(),
            )
        )
        if duplicates > 1:
            issue(
                "Duplicate SKU",
                "Products",
                p,
                p.name,
                f"SKU {p.sku} is used by {duplicates} products.",
                severity="Warning",
            )
        missing = [
            k
            for k in ("name", "sku", "unit_of_measure", "category_id")
            if not str(getattr(p, k) or "").strip()
        ]
        if missing:
            issue(
                "Missing product information",
                "Products",
                p,
                p.name or "Unnamed product",
                "Missing: " + ", ".join(missing),
                severity="Warning",
            )
        inv = db.scalar(
            select(Inventory).where(
                Inventory.company_id == company, Inventory.product_id == p.id
            )
        )
        if not inv:
            issue(
                "Inventory mismatch",
                "Products",
                p,
                p.name,
                "Product has no inventory record.",
                {"current_quantity": p.stock_quantity},
            )

    def customer(c):
        if c.is_deleted:
            return
        missing = [
            k
            for k in ("full_name", "email", "phone")
            if not str(getattr(c, k) or "").strip()
        ]
        if missing:
            issue(
                "Missing customer information",
                "Customers",
                c,
                c.full_name,
                "Missing: " + ", ".join(missing),
                severity="Warning",
            )
        summary = db.scalar(
            select(CustomerPurchaseSummary).where(
                CustomerPurchaseSummary.customer_id == c.id
            )
        )
        if summary:
            # Match the reporting module's current name-based aggregation semantics.
            orders, revenue = db.execute(
                select(
                    func.count(Sale.id), func.coalesce(func.sum(Sale.total_amount), 0)
                ).where(
                    Sale.company_id == company,
                    func.lower(Sale.customer_name) == c.full_name.lower(),
                )
            ).one()
            if summary.total_orders != orders or summary.total_revenue != revenue:
                issue(
                    "Report totals mismatch",
                    "Customers",
                    c,
                    c.full_name,
                    "Customer reporting summary differs from sales transactions.",
                    {
                        "reported_orders": summary.total_orders,
                        "expected_orders": orders,
                        "reported_revenue": str(summary.total_revenue),
                        "expected_revenue": str(revenue),
                    },
                    "Warning",
                )

    def inventory(inv):
        p = db.scalar(
            select(Product).where(
                Product.company_id == company, Product.id == inv.product_id
            )
        )
        movements = db.scalars(
            select(InventoryMovement)
            .where(InventoryMovement.inventory_id == inv.id)
            .order_by(InventoryMovement.created_at, InventoryMovement.id)
        ).all()
        expected = movements[-1].updated_quantity if movements else inv.current_stock
        details = {
            "product": p.name if p else "Unavailable product",
            "product_id": str(p.id) if p else None,
            "current_quantity": inv.current_stock,
            "expected_quantity": expected,
            "difference": inv.current_stock - expected,
            "available_quantity": inv.available_stock,
            "reserved_quantity": inv.reserved_stock,
            "product_quantity": p.stock_quantity if p else None,
            "movements": [
                dict(
                    id=str(m.id),
                    type=m.movement_type,
                    previous=m.previous_quantity,
                    change=m.quantity_changed,
                    current=m.updated_quantity,
                    available_before=m.available_before,
                    at=m.created_at.isoformat(),
                    reason=m.reason,
                )
                for m in movements[-50:]
            ],
        }
        if (
            not p
            or inv.current_stock != expected
            or p.stock_quantity != inv.current_stock
            or inv.available_stock != inv.current_stock - inv.reserved_stock
        ):
            issue(
                "Inventory mismatch",
                "Inventory",
                inv,
                p.name if p else "Inventory",
                "Inventory, product balance or available stock disagrees with the movement ledger.",
                details,
            )
        broken, oversold = [], []
        for idx, m in enumerate(movements):
            checked.add(("Stock Movements", str(m.id)))
            if m.previous_quantity + m.quantity_changed != m.updated_quantity or (
                idx and movements[idx - 1].updated_quantity != m.previous_quantity
            ):
                broken.append(str(m.id))
                movement_errors.add(("Stock Movements", str(m.id)))
            if m.movement_type == "SALE" and -m.quantity_changed > (
                m.available_before
                if m.available_before is not None
                else m.previous_quantity
            ):
                oversold.append(str(m.id))
                movement_errors.add(("Stock Movements", str(m.id)))
        if broken:
            issue(
                "Stock movement mismatch",
                "Inventory",
                inv,
                details["product"],
                "Movement arithmetic or continuity is inconsistent.",
                {**details, "inconsistent_movement_ids": broken},
            )
        if oversold:
            issue(
                "Sale exceeds stock",
                "Inventory",
                inv,
                details["product"],
                "Sale stock removal exceeds the recorded pre-transaction availability (physical balance for legacy movements without reservation snapshots).",
                {**details, "movement_ids": oversold},
            )

    def sale(s):
        items = db.scalars(select(SaleItem).where(SaleItem.sale_id == s.id)).all()
        invalid = []
        for i in items:
            p = db.scalar(
                select(Product).where(
                    Product.company_id == company, Product.id == i.product_id
                )
            )
            if not p or p.status == "INACTIVE":
                invalid.append("Unavailable product" if not p else p.name)
        if invalid:
            issue(
                "Invalid product reference",
                "Sales",
                s,
                s.invoice_number,
                "Sale references missing or currently inactive products.",
                {"products": invalid},
            )
        c = (
            db.scalar(
                select(Customer).where(
                    Customer.company_id == company, Customer.id == s.customer_id
                )
            )
            if s.customer_id
            else None
        )
        if (s.customer_id and (not c or c.is_deleted or c.status != "ACTIVE")) or (
            not s.customer_id and not s.customer_name.strip()
        ):
            issue(
                "Invalid customer reference",
                "Sales",
                s,
                s.invoice_number,
                "Sale references an unavailable customer or has no customer information.",
            )
        expected = sum(
            (i.quantity * i.unit_price - i.discount + i.tax for i in items), Decimal(0)
        )
        if (
            not items
            or expected != s.total_amount
            or any(
                i.total != i.quantity * i.unit_price - i.discount + i.tax for i in items
            )
            or s.subtotal - s.discount + s.tax != s.total_amount
        ):
            issue(
                "Report totals mismatch",
                "Sales",
                s,
                s.invoice_number,
                "Invoice totals used in reports differ from transaction line items.",
                {
                    "reported_total": str(s.total_amount),
                    "expected_total": str(expected),
                    "difference": str(s.total_amount - expected),
                },
                "Warning",
            )

    def report(r):
        if r.status != "COMPLETED":
            return
        from app.services.report_service import report_data
        from app.schemas.report import GenerateReport

        user = db.scalar(
            select(User).where(User.company_id == company, User.id == r.user_id)
        )
        if not user:
            return
        columns, live = report_data(
            db, user, GenerateReport(report_type=r.report_type, filters=r.filters)
        )
        numeric = set(columns) & {
            "Line total",
            "Revenue",
            "Stock value",
            "Quantity",
            "Current stock",
            "Reserved",
            "Available",
            "Orders",
            "Units purchased",
            "Change",
        }
        metrics = []
        for key in sorted(numeric):
            stored = sum(
                (Decimal(str(row.get(key) or 0)) for row in r.rows), Decimal(0)
            )
            actual = sum((Decimal(str(row.get(key) or 0)) for row in live), Decimal(0))
            if stored != actual:
                metrics.append(
                    dict(
                        metric=key,
                        report_total=str(stored),
                        actual_total=str(actual),
                        difference=str(stored - actual),
                    )
                )
        if metrics or len(r.rows) != len(live):
            issue(
                "Report totals mismatch",
                "Reports",
                r,
                r.name,
                "Saved report differs from current transactions for the same filters. Changes since generation may explain the difference; review or regenerate the report.",
                {
                    "generated_at": r.created_at.isoformat(),
                    "report_rows": len(r.rows),
                    "actual_rows": len(live),
                    "metrics": metrics,
                },
                "Warning",
            )

    execute("Reports", ReportRun, report)
    execute("Products", Product, product)
    execute("Customers", Customer, customer)
    execute("Inventory", Inventory, inventory)
    execute("Sales", Sale, sale)
    existing_query = select(QualityIssue).where(QualityIssue.company_id == company)
    if targets is not None:
        existing_query = existing_query.where(
            or_(
                *[
                    (QualityIssue.module == module) & QualityIssue.record_id.in_(ids)
                    for module, ids in targets.items()
                    if ids
                ]
            )
        )
    existing = {
        (i.issue_type, i.record_id): i for i in db.scalars(existing_query).all()
    }
    for key, values in findings.items():
        row = existing.get(key)
        if row is None:
            row = QualityIssue(company_id=company, **values)
            db.add(row)
            db.flush()
            from app.services.notification_service import emit

            emit(
                db,
                company_id=company,
                type="SYSTEM_ALERT",
                title="Data quality issue detected",
                message=f"{row.issue_type}: {row.record_label}",
                priority="HIGH" if row.severity == "Error" else "MEDIUM",
                resource_type="data_quality",
                resource_id=row.id,
                path="/data-quality",
                event_key=f"quality:{row.id}",
            )
        else:
            for k, v in values.items():
                setattr(row, k, v)
            row.last_seen_at = now()
            if row.status == "Resolved":
                transition(db, row, "Open", "Inconsistency detected again.", "System")
    for key, row in existing.items():
        if (
            key not in findings
            and (row.module, row.record_id) in checked
            and row.status in ("Open", "Investigating")
        ):
            transition(
                db, row, "Resolved", "Verified consistent by reconciliation.", "System"
            )
            run.issues_resolved += 1
    errors = {
        (v["module"], v["record_id"])
        for v in findings.values()
        if v["severity"] == "Error"
    } | movement_errors
    warnings = {
        (v["module"], v["record_id"])
        for v in findings.values()
        if v["severity"] == "Warning"
    } - errors
    run.records_checked = len(checked)
    run.error_records, run.warning_records = len(errors), len(warnings)
    run.valid_records = len(checked - errors - warnings)
    run.issues_detected = len(findings)
    run.failed_checks = failures
    run.checks = [{"name": name, "issues": counts[name]} for name in CHECKS]
    run.status = (
        "Failed" if failures else "Completed with Issues" if findings else "Completed"
    )
    run.completed_at, run.active_company = now(), None
    audit(
        db,
        company,
        run.user_id,
        AuditAction.RECONCILIATION_COMPLETED,
        f"Reconciliation {run.id}: {run.status}; {len(findings)} issues.",
    )


def start(db, company, actor="System", user_id=None, trigger="Automatic"):
    run = QualityRun(
        company_id=company,
        triggered_by=actor,
        user_id=user_id,
        trigger=trigger,
        active_company=str(company),
        issues_resolved=0,
        claimed_at=now() if trigger == "Automatic" else None,
    )
    db.add(run)
    db.flush()
    audit(
        db,
        company,
        user_id,
        AuditAction.RECONCILIATION_STARTED,
        f"Reconciliation {run.id} started ({trigger}).",
    )
    return run


def worker(run_id, factory=None):
    from app.core.database import SessionLocal

    with (factory or SessionLocal)() as db:
        claimed = db.execute(
            update(QualityRun)
            .where(
                QualityRun.id == run_id,
                QualityRun.status == "Running",
                QualityRun.claimed_at.is_(None),
            )
            .values(claimed_at=now())
        )
        db.commit()
        if not claimed.rowcount:
            return
        run = db.get(QualityRun, run_id)
        if not run or run.status != "Running":
            return
        try:
            reconcile(db, run)
            db.commit()
        except Exception:
            db.rollback()
            logging.getLogger(__name__).exception("Reconciliation failed")
            run = db.get(QualityRun, run_id)
            run.status, run.completed_at, run.active_company = "Failed", now(), None
            run.failed_checks = [{"message": "Execution failed; retry reconciliation."}]
            audit(
                db,
                run.company_id,
                run.user_id,
                AuditAction.RECONCILIATION_COMPLETED,
                f"Reconciliation {run.id} failed.",
            )
            db.commit()


@event.listens_for(Session, "before_flush")
def collect_changes(db, context, instances):
    changed = db.info.setdefault("quality_changed", [])
    for row in db.new | db.dirty | db.deleted:
        if (
            isinstance(
                row,
                (
                    Product,
                    Customer,
                    Inventory,
                    Sale,
                    InventoryMovement,
                    SaleItem,
                    ReportRun,
                ),
            )
            and row not in changed
        ):
            changed.append(row)


@event.listens_for(Session, "after_flush_postexec")
def queue_changes(db, context):
    for row in db.info.pop("quality_changed", []):
        if isinstance(row, InventoryMovement):
            row = db.get(Inventory, row.inventory_id)
        elif isinstance(row, SaleItem):
            row = db.get(Sale, row.sale_id)
        if row and row.id and row.company_id:
            module = {
                Product: "Products",
                Customer: "Customers",
                Inventory: "Inventory",
                Sale: "Sales",
                ReportRun: "Reports",
            }.get(type(row))
            if module:
                db.add(
                    QualityChange(
                        company_id=row.company_id, module=module, record_id=str(row.id)
                    )
                )


@event.listens_for(Session, "after_rollback")
def clear_changes(db):
    db.info.pop("quality_changed", None)


def drain_changes(db):
    # Durable pending manual jobs survive process restarts. A crashed claimed job
    # releases its company after the execution timeout instead of blocking forever.
    stale = db.scalars(
        select(QualityRun).where(
            QualityRun.status == "Running",
            QualityRun.claimed_at < now() - timedelta(hours=1),
        )
    ).all()
    for run in stale:
        run.status, run.completed_at, run.active_company = "Failed", now(), None
        run.failed_checks = [
            {"message": "Execution timed out or was interrupted. Please retry."}
        ]
        audit(
            db,
            run.company_id,
            run.user_id,
            AuditAction.RECONCILIATION_COMPLETED,
            f"Reconciliation {run.id} timed out.",
        )
    db.commit()
    changes = db.scalars(select(QualityChange).limit(500)).all()
    grouped = defaultdict(list)
    for change in changes:
        grouped[change.company_id].append(change)
    for company, batch in grouped.items():
        if db.scalar(
            select(QualityRun.id).where(QualityRun.active_company == str(company))
        ):
            continue
        targets = defaultdict(set)
        for change in batch:
            targets[change.module].add(change.record_id)
        # Expand only related records; never schedule a full scan after a small write.
        products = [UUID(i) for i in targets["Products"]]
        customers = [UUID(i) for i in targets["Customers"]]
        if products:
            targets["Inventory"].update(
                str(i)
                for i in db.scalars(
                    select(Inventory.id).where(
                        Inventory.company_id == company,
                        Inventory.product_id.in_(products),
                    )
                )
            )
            targets["Sales"].update(
                str(i)
                for i in db.scalars(
                    select(Sale.id)
                    .join(SaleItem)
                    .where(
                        Sale.company_id == company, SaleItem.product_id.in_(products)
                    )
                )
            )
        if customers:
            targets["Sales"].update(
                str(i)
                for i in db.scalars(
                    select(Sale.id).where(
                        Sale.company_id == company, Sale.customer_id.in_(customers)
                    )
                )
            )
        if targets["Sales"]:
            targets["Customers"].update(
                str(i)
                for i in db.scalars(
                    select(Sale.customer_id).where(
                        Sale.company_id == company,
                        Sale.id.in_([UUID(i) for i in targets["Sales"]]),
                        Sale.customer_id.is_not(None),
                    )
                )
            )
        try:
            run = start(db, company)
            reconcile(db, run, targets)
            for change in batch:
                db.delete(change)
            db.commit()
        except IntegrityError:
            db.rollback()  # Another worker claimed this company; retry the durable outbox later.
