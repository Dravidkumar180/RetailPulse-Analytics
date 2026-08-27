import csv
import io
import re
from datetime import UTC, datetime
from decimal import Decimal, InvalidOperation
from uuid import UUID

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError

from app.api.dependencies import BrowserInfo, ClientIp, DatabaseSession
from app.core.constants import AuditAction
from app.core.permissions import CompanyAdminOrSuperAdmin
from app.models.catalog import Category, Product
from app.models.customer import Customer, CustomerPurchaseSummary, CustomerTimeline
from app.models.data_import import DataImport, DataImportError
from app.models.inventory import Inventory
from app.models.sales import Sale, SaleItem
from app.services.audit_log_service import audit_log_service

router = APIRouter()
MAX_FILE_SIZE = 10 * 1024 * 1024
REQUIRED = {
    "products": ["Product Name", "SKU", "Category", "Unit Price", "Stock Quantity"],
    "customers": ["Name", "Email", "Phone"],
    "sales": ["Customer", "Product", "Quantity", "Unit Price", "Sale Date"],
}
ALIASES = {
    "product name": "Product Name", "name": "Name", "sku": "SKU", "category": "Category",
    "price": "Unit Price", "unit price": "Unit Price", "stock": "Stock Quantity", "stock quantity": "Stock Quantity",
    "email": "Email", "phone": "Phone", "customer": "Customer", "product": "Product", "quantity": "Quantity",
    "sale date": "Sale Date", "invoice": "Invoice Number", "invoice number": "Invoice Number",
    "brand": "Brand", "description": "Description", "customer id": "Customer ID",
}


def serialize(job: DataImport, include_rows: bool = False) -> dict:
    result = {"id": str(job.id), "importType": job.import_type, "filename": job.filename,
              "uploadedBy": job.uploaded_by_name, "uploadDate": job.created_at.isoformat(),
              "columns": job.columns, "totalRecords": job.total_records,
              "validRecords": job.total_records - job.failed_records - job.duplicate_records,
              "successfulRecords": job.successful_records, "failedRecords": job.failed_records,
              "duplicateRecords": job.duplicate_records, "status": job.status,
              "completedAt": job.completed_at.isoformat() if job.completed_at else None}
    if include_rows:
        result["rows"] = job.staged_rows[:10]
    return result


def get_job(db, company_id: UUID, import_id: UUID) -> DataImport:
    job = db.scalar(select(DataImport).where(DataImport.id == import_id, DataImport.company_id == company_id))
    if not job:
        raise HTTPException(404, "Import not found.")
    return job


def number(value: str, label: str, positive: bool = True) -> Decimal:
    try:
        parsed = Decimal(str(value).strip())
    except (InvalidOperation, ValueError):
        raise ValueError(f"{label} must be a valid number.")
    if (positive and parsed <= 0) or (not positive and parsed < 0):
        raise ValueError(f"{label} must be {'greater than zero' if positive else 'zero or greater'}.")
    return parsed


def whole_number(value: str, label: str, positive: bool = True) -> int:
    parsed = number(value, label, positive)
    if parsed != parsed.to_integral_value():
        raise ValueError(f"{label} must be a whole number.")
    return int(parsed)


def validate_rows(db, company_id: UUID, kind: str, rows: list[dict]) -> list[tuple[int, str, str, dict]]:
    errors: list[tuple[int, str, str, dict]] = []
    seen: set[str] = set()
    existing: set[str] = set()
    if kind == "products": existing = {v.lower() for v in db.scalars(select(Product.sku).where(Product.company_id == company_id)).all()}
    elif kind == "customers":
        existing = {f"email:{v.lower()}" for v in db.scalars(select(Customer.email).where(Customer.company_id == company_id)).all()}
        existing |= {f"phone:{v}" for v in db.scalars(select(Customer.phone).where(Customer.company_id == company_id)).all()}
    else: existing = {v.lower() for v in db.scalars(select(Sale.invoice_number).where(Sale.company_id == company_id)).all()}
    customers = {v.lower() for v in db.scalars(select(Customer.full_name).where(Customer.company_id == company_id, Customer.is_deleted.is_(False))).all()}
    products = {p.sku.lower(): p for p in db.scalars(select(Product).where(Product.company_id == company_id)).all()}
    products.update({p.name.lower(): p for p in products.values()})
    reserved: dict[UUID, int] = {}
    for index, row in enumerate(rows, 2):
        messages, duplicate = [], False
        try:
            if kind == "products":
                if not row["Product Name"].strip(): messages.append("Product Name is required.")
                if not row["SKU"].strip(): messages.append("SKU is required.")
                if not row["Category"].strip(): messages.append("Category is required.")
                number(row["Unit Price"], "Unit Price")
                whole_number(row["Stock Quantity"], "Stock Quantity", False)
                key = row["SKU"].strip().lower()
                duplicate = bool(key and (key in existing or key in seen)); seen.add(key)
            elif kind == "customers":
                if not row["Name"].strip(): messages.append("Name is required.")
                email, phone = row["Email"].strip().lower(), row["Phone"].strip()
                if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email): messages.append("Email is invalid.")
                if not re.fullmatch(r"\+?[0-9 ()-]{7,20}", phone): messages.append("Phone is invalid.")
                keys = {f"email:{email}", f"phone:{phone}"}
                duplicate = bool(keys & (existing | seen)); seen |= keys
            else:
                customer, product_key = row["Customer"].strip().lower(), row["Product"].strip().lower()
                if customer not in customers: messages.append("Customer does not exist in your company.")
                product = products.get(product_key)
                if not product: messages.append("Product does not exist in your company.")
                qty = whole_number(row["Quantity"], "Quantity")
                number(row["Unit Price"], "Unit Price")
                try: datetime.fromisoformat(row["Sale Date"].strip().replace("Z", "+00:00"))
                except ValueError: messages.append("Sale Date is invalid; use YYYY-MM-DD.")
                if product:
                    reserved[product.id] = reserved.get(product.id, 0) + qty
                    if reserved[product.id] > product.stock_quantity: messages.append(f"Quantity exceeds available stock ({product.stock_quantity}).")
                invoice = row.get("Invoice Number", "").strip().lower()
                if invoice: duplicate = invoice in existing or invoice in seen; seen.add(invoice)
        except (ValueError, KeyError) as exc: messages.append(str(exc))
        if duplicate: errors.append((index, "Duplicate", "Duplicate record; it will be skipped.", row))
        elif messages: errors.append((index, "Validation", " ".join(messages), row))
    return errors


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload(db: DatabaseSession, current_user: CompanyAdminOrSuperAdmin,
                 client_ip: ClientIp, browser: BrowserInfo,
                 import_type: str = Form(..., alias="importType"), file: UploadFile = File(...)):
    kind = import_type.strip().lower()
    if kind not in REQUIRED: raise HTTPException(400, "Select Products, Customers, or Sales.")
    if not file.filename or not file.filename.lower().endswith(".csv"): raise HTTPException(400, "Only CSV files are allowed.")
    content = await file.read(MAX_FILE_SIZE + 1)
    if len(content) > MAX_FILE_SIZE: raise HTTPException(413, "File exceeds the 10 MB limit.")
    try:
        text = content.decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(text))
        if not reader.fieldnames: raise ValueError
        mapped = [ALIASES.get(h.strip().lower(), h.strip()) for h in reader.fieldnames]
        missing = [h for h in REQUIRED[kind] if h not in mapped]
        if missing: raise HTTPException(400, f"Missing required columns: {', '.join(missing)}.")
        rows = [{mapped[i]: (value or "").strip() for i, value in enumerate(raw.values())} for raw in reader]
    except (UnicodeDecodeError, csv.Error, ValueError): raise HTTPException(400, "The file is not a valid UTF-8 CSV.")
    if not rows: raise HTTPException(400, "The CSV does not contain any data rows.")
    job = DataImport(company_id=current_user.company_id, import_type=kind, filename=file.filename,
                     uploaded_by_id=current_user.id, uploaded_by_name=current_user.name,
                     columns=mapped, staged_rows=rows, total_records=len(rows), status="Pending")
    db.add(job); db.flush()
    errors = validate_rows(db, current_user.company_id, kind, rows)
    for row_number, error_type, message, row_data in errors:
        db.add(DataImportError(import_id=job.id, row_number=row_number, error_type=error_type, message=message, row_data=row_data))
    job.duplicate_records = sum(1 for e in errors if e[1] == "Duplicate")
    job.failed_records = sum(1 for e in errors if e[1] != "Duplicate")
    audit_log_service.create_log(db, company_id=current_user.company_id, user_id=current_user.id,
        action=AuditAction.IMPORT_UPLOADED, ip_address=client_ip, browser=browser,
        details=f"Import {job.id}: validated {kind} file {file.filename}: {len(rows)} rows, {job.failed_records} invalid, {job.duplicate_records} duplicate.")
    db.commit()
    result = serialize(job, True)
    result["errors"] = [{"rowNumber": e[0], "errorType": e[1], "message": e[2], "rowData": e[3]} for e in errors[:50]]
    return result


@router.post("/{import_id}/validate")
def validate(import_id: UUID, db: DatabaseSession, current_user: CompanyAdminOrSuperAdmin):
    return serialize(get_job(db, current_user.company_id, import_id), True)


@router.post("/{import_id}/process")
def process(import_id: UUID, db: DatabaseSession, current_user: CompanyAdminOrSuperAdmin,
            client_ip: ClientIp, browser: BrowserInfo):
    job = get_job(db, current_user.company_id, import_id)
    if job.status not in {"Pending", "Failed"}: raise HTTPException(409, "This import has already been processed.")
    bad_rows = set(db.scalars(select(DataImportError.row_number).where(DataImportError.import_id == job.id)).all())
    valid = [(i, row) for i, row in enumerate(job.staged_rows, 2) if i not in bad_rows]
    job.status = "Processing"; db.flush()
    try:
        if job.import_type == "products":
            categories = {c.name.lower(): c for c in db.scalars(select(Category).where(Category.company_id == current_user.company_id)).all()}
            for _, row in valid:
                key = row["Category"].lower(); category = categories.get(key)
                if not category:
                    category = Category(company_id=current_user.company_id, name=row["Category"], status="ACTIVE"); db.add(category); db.flush(); categories[key] = category
                stock = int(Decimal(row["Stock Quantity"])); price = Decimal(row["Unit Price"])
                product = Product(company_id=current_user.company_id, category_id=category.id, name=row["Product Name"], sku=row["SKU"], brand=row.get("Brand") or None, description=row.get("Description") or None, unit_price=price, cost_price=price, stock_quantity=stock, unit_of_measure="Each", status="ACTIVE")
                db.add(product); db.flush(); db.add(Inventory(company_id=current_user.company_id, product_id=product.id, current_stock=stock, reserved_stock=0, available_stock=stock, reorder_level=5, stock_status="OUT_OF_STOCK" if stock == 0 else "LOW_STOCK" if stock <= 5 else "IN_STOCK"))
        elif job.import_type == "customers":
            for offset, (_, row) in enumerate(valid, 1):
                customer = Customer(company_id=current_user.company_id, customer_id=row.get("Customer ID") or f"IMP-{str(job.id)[:8].upper()}-{offset:05d}", full_name=row["Name"], email=row["Email"].lower(), phone=row["Phone"], customer_type="REGULAR", status="ACTIVE", is_deleted=False)
                db.add(customer); db.flush(); db.add(CustomerPurchaseSummary(customer_id=customer.id)); db.add(CustomerTimeline(customer_id=customer.id, event="Customer Imported", details=f"Imported from {job.filename}."))
        else:
            customers = {c.full_name.lower(): c for c in db.scalars(select(Customer).where(Customer.company_id == current_user.company_id, Customer.is_deleted.is_(False))).all()}
            products = {p.sku.lower(): p for p in db.scalars(select(Product).where(Product.company_id == current_user.company_id).with_for_update()).all()}; products.update({p.name.lower(): p for p in list(products.values())})
            for offset, (_, row) in enumerate(valid, 1):
                customer, product = customers[row["Customer"].lower()], products[row["Product"].lower()]; qty = int(Decimal(row["Quantity"])); price = Decimal(row["Unit Price"]); total = price * qty
                when = datetime.fromisoformat(row["Sale Date"].replace("Z", "+00:00")); when = when.replace(tzinfo=UTC) if when.tzinfo is None else when
                invoice = row.get("Invoice Number") or f"IMP-{str(job.id)[:8].upper()}-{offset:05d}"
                sale = Sale(company_id=current_user.company_id, invoice_number=invoice, customer_name=customer.full_name, customer_id=customer.id, sale_date=when, sales_channel="IMPORT", payment_method="OTHER", payment_status="PAID", subtotal=total, discount=0, tax=0, total_amount=total, created_by_id=current_user.id)
                db.add(sale); db.flush(); db.add(SaleItem(sale_id=sale.id, product_id=product.id, category_id=product.category_id, quantity=qty, unit_price=price, discount=0, tax=0, total=total)); product.stock_quantity -= qty
                inventory = db.scalar(select(Inventory).where(Inventory.company_id == current_user.company_id, Inventory.product_id == product.id))
                if inventory: inventory.current_stock = product.stock_quantity; inventory.available_stock = max(0, inventory.current_stock - inventory.reserved_stock); inventory.stock_status = "OUT_OF_STOCK" if inventory.available_stock == 0 else "LOW_STOCK" if inventory.available_stock <= inventory.reorder_level else "IN_STOCK"
        job.successful_records = len(valid); job.status = "Completed with Errors" if (job.failed_records or job.duplicate_records) else "Completed"; job.completed_at = datetime.now(UTC); job.staged_rows = []
        audit_log_service.create_log(db, company_id=current_user.company_id, user_id=current_user.id,
            action=AuditAction.IMPORT_COMPLETED, ip_address=client_ip, browser=browser,
            details=f"Import {job.id}: processed {job.import_type} file {job.filename}: {len(valid)} imported, {job.failed_records} invalid, {job.duplicate_records} duplicate.")
        db.commit()
    except (SQLAlchemyError, KeyError, ValueError, InvalidOperation) as exc:
        db.rollback(); job = get_job(db, current_user.company_id, import_id); job.status = "Failed"; job.completed_at = datetime.now(UTC)
        audit_log_service.create_log(db, company_id=current_user.company_id, user_id=current_user.id,
            action=AuditAction.IMPORT_FAILED, ip_address=client_ip, browser=browser,
            details=f"Import {job.id}: failed and rolled back: {job.import_type} file {job.filename}.")
        db.commit()
        raise HTTPException(500, "Import processing failed. No business records were added; please review the file and retry.") from exc
    return serialize(job)


@router.get("/history")
def history(db: DatabaseSession, current_user: CompanyAdminOrSuperAdmin):
    jobs = db.scalars(select(DataImport).where(DataImport.company_id == current_user.company_id).order_by(DataImport.created_at.desc())).all()
    return {"items": [serialize(j) for j in jobs], "total": len(jobs)}


@router.get("/{import_id}")
def detail(import_id: UUID, db: DatabaseSession, current_user: CompanyAdminOrSuperAdmin):
    job = get_job(db, current_user.company_id, import_id); result = serialize(job, True)
    errors = db.scalars(select(DataImportError).where(DataImportError.import_id == job.id).order_by(DataImportError.row_number).limit(50)).all()
    result["errors"] = [{"rowNumber": e.row_number, "errorType": e.error_type, "message": e.message, "rowData": e.row_data} for e in errors]
    return result


@router.get("/{import_id}/errors")
def download_errors(import_id: UUID, db: DatabaseSession, current_user: CompanyAdminOrSuperAdmin):
    job = get_job(db, current_user.company_id, import_id)
    errors = db.scalars(select(DataImportError).where(DataImportError.import_id == job.id).order_by(DataImportError.row_number)).all()
    output = io.StringIO(); fields = ["Row Number", "Error Type", "Error Reason", *job.columns]; writer = csv.DictWriter(output, fieldnames=fields); writer.writeheader()
    for error in errors: writer.writerow({"Row Number": error.row_number, "Error Type": error.error_type, "Error Reason": error.message, **error.row_data})
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": f'attachment; filename="{job.filename.rsplit(".", 1)[0]}_errors.csv"'})
