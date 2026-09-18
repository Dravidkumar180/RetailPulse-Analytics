"""Tenant-scoped reporting over the existing operational tables."""

import csv
import io
import logging
from datetime import UTC, datetime, time, timedelta
from decimal import Decimal
from uuid import UUID
from xml.sax.saxutils import escape
from sqlalchemy import select, func
from fastapi import HTTPException
from app.models import (
    Product,
    Category,
    Sale,
    SaleItem,
    Customer,
    Inventory,
    InventoryMovement,
    User,
)
from app.models.report import ReportRun
from app.schemas.report import GenerateReport

NAMES = {
    "sales": "Sales Report",
    "inventory": "Inventory Report",
    "customer": "Customer Report",
    "product_performance": "Product Performance Report",
    "stock_movement": "Stock Movement Report",
}


def options(db, user):
    company = user.company_id

    def choices(model, label):
        return [
            {"id": str(row.id), "name": getattr(row, label)}
            for row in db.scalars(
                select(model)
                .where(model.company_id == company)
                .order_by(getattr(model, label))
            ).all()
        ]

    return dict(
        products=choices(Product, "name"),
        categories=choices(Category, "name"),
        customers=choices(Customer, "full_name"),
        users=choices(User, "name"),
        brands=db.scalars(
            select(Product.brand)
            .where(Product.company_id == company, Product.brand.is_not(None))
            .distinct()
            .order_by(Product.brand)
        ).all(),
        company=user.company.name,
    )


def validate_scope(db, user, filters):
    for field, model in [
        ("product_id", Product),
        ("category_id", Category),
        ("customer_id", Customer),
        ("user_id", User),
    ]:
        value = getattr(filters, field)
        if value and not db.scalar(
            select(model.id).where(
                model.id == value, model.company_id == user.company_id
            )
        ):
            raise HTTPException(400, "Selected filter is not available in your company")


def report_data(db, user, request):
    f, company, kind = request.filters, user.company_id, request.report_type
    validate_scope(db, user, f)
    product_filters = [Product.company_id == company, Category.company_id == company]
    for value, column in [
        (f.product_id, Product.id),
        (f.category_id, Category.id),
        (f.brand, Product.brand),
    ]:
        if value:
            product_filters.append(column == value)

    def dates(query, column):
        if f.start_date:
            query = query.where(column >= datetime.combine(f.start_date, time.min, UTC))
        if f.end_date:
            query = query.where(
                column < datetime.combine(f.end_date + timedelta(days=1), time.min, UTC)
            )
        return query

    if kind == "inventory":
        q = (
            select(
                Product.name.label("Product"),
                Product.sku.label("SKU"),
                Category.name.label("Category"),
                Product.brand.label("Brand"),
                Inventory.current_stock.label("Current stock"),
                Inventory.reserved_stock.label("Reserved"),
                Inventory.available_stock.label("Available"),
                Inventory.reorder_level.label("Reorder level"),
                Inventory.stock_status.label("Status"),
                (Inventory.current_stock * Product.cost_price).label("Stock value"),
            )
            .join(Inventory, Inventory.product_id == Product.id)
            .join(Category, Category.id == Product.category_id)
            .where(Inventory.company_id == company, *product_filters)
        )
        if f.stock_status:
            q = q.where(Inventory.stock_status == f.stock_status)
        q = dates(q, Inventory.updated_at).order_by(Product.name, Product.id)
    elif kind == "stock_movement":
        q = (
            select(
                InventoryMovement.created_at.label("Date"),
                Product.name.label("Product"),
                Category.name.label("Category"),
                Product.brand.label("Brand"),
                InventoryMovement.movement_type.label("Movement"),
                InventoryMovement.quantity_changed.label("Quantity"),
                InventoryMovement.previous_quantity.label("Previous stock"),
                InventoryMovement.updated_quantity.label("Updated stock"),
                InventoryMovement.reason.label("Reason"),
                User.name.label("Performed by"),
            )
            .select_from(InventoryMovement)
            .join(Inventory, Inventory.id == InventoryMovement.inventory_id)
            .join(Product, Product.id == Inventory.product_id)
            .join(Category, Category.id == Product.category_id)
            .join(User, User.id == InventoryMovement.performed_by_id)
            .where(
                Inventory.company_id == company,
                User.company_id == company,
                *product_filters,
            )
        )
        if f.user_id:
            q = q.where(InventoryMovement.performed_by_id == f.user_id)
        q = dates(q, InventoryMovement.created_at).order_by(
            InventoryMovement.created_at.desc(), InventoryMovement.id
        )
    else:
        base = (
            select(SaleItem.id)
            .join(Sale, Sale.id == SaleItem.sale_id)
            .join(Product, Product.id == SaleItem.product_id)
            .join(Category, Category.id == SaleItem.category_id)
            .where(Sale.company_id == company, *product_filters)
        )
        if f.customer_id:
            base = base.where(Sale.customer_id == f.customer_id)
        if f.sales_status:
            base = base.where(Sale.payment_status == f.sales_status)
        if f.user_id:
            base = base.where(Sale.created_by_id == f.user_id)
        base = dates(base, Sale.sale_date)
        if kind == "sales":
            q = base.with_only_columns(
                Sale.invoice_number.label("Invoice"),
                Sale.sale_date.label("Date"),
                Sale.customer_name.label("Customer"),
                Product.name.label("Product"),
                Category.name.label("Category"),
                Product.brand.label("Brand"),
                SaleItem.quantity.label("Quantity"),
                SaleItem.unit_price.label("Unit price"),
                SaleItem.total.label("Line total"),
                Sale.payment_method.label("Payment method"),
                Sale.payment_status.label("Status"),
            ).order_by(Sale.sale_date.desc(), SaleItem.id)
        elif kind == "product_performance":
            q = (
                base.with_only_columns(
                    Product.name.label("Product"),
                    Product.sku.label("SKU"),
                    Category.name.label("Category"),
                    Product.brand.label("Brand"),
                    func.sum(SaleItem.quantity).label("Units sold"),
                    func.count(func.distinct(Sale.id)).label("Orders"),
                    func.sum(SaleItem.total).label("Revenue"),
                    func.sum(SaleItem.quantity * Product.cost_price).label(
                        "Cost at current price"
                    ),
                )
                .group_by(
                    Product.id, Product.name, Product.sku, Category.name, Product.brand
                )
                .order_by(func.sum(SaleItem.total).desc(), Product.id)
            )
        else:
            totals = (
                base.with_only_columns(
                    Sale.customer_id.label("customer_id"),
                    func.count(func.distinct(Sale.id)).label("orders"),
                    func.sum(SaleItem.quantity).label("units"),
                    func.sum(SaleItem.total).label("revenue"),
                    func.max(Sale.sale_date).label("last_purchase"),
                )
                .group_by(Sale.customer_id)
                .subquery()
            )
            q = (
                select(
                    Customer.full_name.label("Customer"),
                    Customer.email.label("Email"),
                    Customer.customer_type.label("Type"),
                    Customer.status.label("Status"),
                    func.coalesce(totals.c.orders, 0).label("Orders"),
                    func.coalesce(totals.c.units, 0).label("Units purchased"),
                    func.coalesce(totals.c.revenue, 0).label("Revenue"),
                    totals.c.last_purchase.label("Last purchase"),
                )
                .outerjoin(totals, totals.c.customer_id == Customer.id)
                .where(Customer.company_id == company, Customer.is_deleted.is_(False))
            )
            if f.customer_id:
                q = q.where(Customer.id == f.customer_id)
            if any(
                [
                    f.product_id,
                    f.category_id,
                    f.brand,
                    f.sales_status,
                    f.user_id,
                    f.start_date,
                    f.end_date,
                ]
            ):
                q = q.where(totals.c.customer_id.is_not(None))
            q = q.order_by(Customer.full_name, Customer.id)
    result = db.execute(q)
    columns = list(result.keys())

    def clean(v):
        if isinstance(v, Decimal):
            return float(v)
        if isinstance(v, datetime):
            return v.isoformat()
        if isinstance(v, UUID):
            return str(v)
        return v

    rows = [
        {key: clean(value) for key, value in row.items()} for row in result.mappings()
    ]
    return columns, rows


def generate(db, user, request, schedule_id=None, existing_run=None):
    validate_scope(db, user, request.filters)
    context = {
        "company": user.company.name,
        "period": f'{request.filters.start_date or "All dates"} to {request.filters.end_date or "present"}',
    }
    opts = options(db, user)
    for key, value in request.filters.model_dump(
        mode="json", exclude_none=True
    ).items():
        collection = {
            "product_id": "products",
            "category_id": "categories",
            "customer_id": "customers",
            "user_id": "users",
        }.get(key)
        context[key] = (
            next((x["name"] for x in opts[collection] if x["id"] == value), value)
            if collection
            else value
        )
    if request.report_type == "inventory":
        context["note"] = (
            "Current inventory snapshot; date filters apply to last stock update, not historical stock balances."
        )
    if request.report_type in ("sales", "customer", "product_performance"):
        context["note"] = (
            "Revenue uses sale item line totals for the selected payment statuses. Product cost uses current catalog cost."
        )
    run = existing_run or ReportRun(
        company_id=user.company_id,
        user_id=user.id,
        generated_by=user.name,
        schedule_id=schedule_id,
        name=NAMES[request.report_type],
        report_type=request.report_type,
        filters=request.filters.model_dump(mode="json", exclude_none=True),
        context=context,
        format=request.format,
    )
    run.context = context
    run.filters = request.filters.model_dump(mode="json", exclude_none=True)
    db.add(run)
    db.commit()
    try:
        run.columns, run.rows = report_data(db, user, request)
        run.status = "COMPLETED"
        db.commit()
    except Exception:
        logging.getLogger(__name__).exception("Report generation failed")
        db.rollback()
        run.status = "FAILED"
        run.error = (
            "Report generation failed. Please retry or contact your administrator."
        )
        db.commit()
    return run


def export(run, format):
    if run.status != "COMPLETED":
        raise HTTPException(409, "This report is not available for download")
    context = {
        **run.context,
        "Generated by": run.generated_by,
        "Generated at": run.created_at.isoformat(),
        "Records": len(run.rows),
    }
    if format == "CSV":
        out = io.StringIO(newline="")
        writer = csv.writer(out)

        def safe(value):
            if isinstance(value, str) and value.lstrip().startswith(
                ("=", "+", "-", "@")
            ):
                return "'" + value
            return value

        writer.writerow([run.name])
        for k, v in context.items():
            writer.writerow([k, safe(str(v))])
        writer.writerow([])
        writer.writerow(run.columns)
        for row in run.rows:
            writer.writerow([safe(row.get(c, "")) for c in run.columns])
        return out.getvalue().encode("utf-8-sig"), "text/csv; charset=utf-8"
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import (
        SimpleDocTemplate,
        Paragraph,
        Spacer,
        LongTable,
        TableStyle,
    )

    out = io.BytesIO()
    styles = getSampleStyleSheet()
    small = ParagraphStyle(
        "cell", fontName="Helvetica", fontSize=7, leading=10, wordWrap="CJK"
    )
    para = lambda value: Paragraph(
        escape(str(value if value is not None else "")), small
    )
    story = [Paragraph(escape(run.name), styles["Title"])]
    story += [
        Paragraph(escape(f"{k}: {v}"), styles["Normal"]) for k, v in context.items()
    ]
    story.append(Spacer(1, 15))
    table = LongTable(
        [[para(c) for c in run.columns]]
        + [[para(row.get(c)) for c in run.columns] for row in run.rows],
        colWidths=[770 / len(run.columns)] * len(run.columns),
        repeatRows=1,
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#dceaff")),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [colors.white, colors.HexColor("#f4f7fb")],
                ),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#dbe3ee")),
            ]
        )
    )
    story.append(table)

    def footer(canvas, doc):
        canvas.setFont("Helvetica", 8)
        canvas.drawRightString(805, 18, f"RetailPulse | Page {doc.page}")

    SimpleDocTemplate(
        out,
        pagesize=landscape(A4),
        rightMargin=35,
        leftMargin=35,
        topMargin=30,
        bottomMargin=30,
    ).build(story, onFirstPage=footer, onLaterPages=footer)
    return out.getvalue(), "application/pdf"
