"""Read-only Day 2 validation; business writes belong to the later processing stage."""
import re
from collections import Counter, defaultdict
from datetime import date
from decimal import Decimal, InvalidOperation

from sqlalchemy import select

from app.models.catalog import Category, Product
from app.models.customer import Customer
from app.models.inventory import Inventory
from app.models.sales import Sale
from app.services.import_preview_service import SCHEMAS, preview_csv

ERROR_TYPES = ("Missing required field", "Invalid data type", "Invalid value", "Duplicate in file", "Duplicate in database")
LENGTHS = {"Product Name": 160, "SKU": 80, "Category": 120, "Brand": 120,
           "Name": 160, "Email": 255, "Phone": 30, "Customer ID": 30,
           "Customer": 160, "Product": 160, "Invoice Number": 40}
INTEGER_FIELDS = {"Stock Quantity", "Current Stock", "Reorder Level", "Quantity"}
POLICIES = {
    "products": "Duplicate SKUs or product names within the same category are skipped; existing products are not overwritten.",
    "customers": "Duplicate email, normalized phone, or supplied Customer ID is skipped, including archived customers.",
    "sales": "One transaction per invoice number. Duplicate invoice numbers are skipped. Customer and product must exist in your company.",
    "inventory": "Existing inventory is eligible for update by SKU; missing inventory is eligible for creation for an existing product. Repeated SKUs in the file are skipped. Stock cannot be below reserved stock.",
}


def normalized(value):
    return (value or "").strip().casefold()


def phone_key(value):
    return re.sub(r"\D", "", value or "")


def field_type(column):
    if column in INTEGER_FIELDS:
        return "Whole number"
    return {"Unit Price": "Number (2 decimals)", "Sale Date": "Date (YYYY-MM-DD)",
            "Email": "Email", "Phone": "Phone"}.get(column, "Text")


def validate_file(db, company_id, kind, filename, content):
    parsed = preview_csv(kind, filename, content, include_all=True)
    if not parsed["structureValid"]:
        raise ValueError(" ".join(parsed["errors"]))
    # Queries are tenant-scoped, independent of any company supplied in the CSV/request.
    existing = set()
    products = {}
    product_names = defaultdict(list)
    customers = Counter()
    inventory = {}
    if kind == "products":
        for sku, name, category in db.execute(select(Product.sku, Product.name, Category.name)
                .join(Category, Product.category_id == Category.id)
                .where(Product.company_id == company_id, Category.company_id == company_id)):
            existing.update({("SKU", normalized(sku)), ("Product/category", normalized(name), normalized(category))})
    elif kind == "customers":
        for email, phone, code in db.execute(select(Customer.email, Customer.phone, Customer.customer_id)
                .where(Customer.company_id == company_id)):
            existing.update({("Email", normalized(email)), ("Phone", phone_key(phone)), ("Customer ID", normalized(code))})
    elif kind == "sales":
        existing = {("Invoice Number", normalized(v)) for v in db.scalars(select(Sale.invoice_number).where(Sale.company_id == company_id))}
        customers = Counter(normalized(v) for v in db.scalars(select(Customer.full_name)
            .where(Customer.company_id == company_id, Customer.is_deleted.is_(False), Customer.status == "ACTIVE")))
    if kind in {"inventory", "sales"}:
        for p in db.execute(select(Product.id, Product.sku, Product.name, Product.stock_quantity, Product.status)
                .where(Product.company_id == company_id)):
            products[normalized(p.sku)] = p
            product_names[normalized(p.name)].append(p)
        inventory = {i.product_id: i for i in db.execute(select(Inventory.product_id, Inventory.reserved_stock, Inventory.available_stock)
            .where(Inventory.company_id == company_id))}

    results, seen, reserved = [], set(), defaultdict(int)
    for line, raw in zip(parsed["rowNumbers"], parsed["rows"]):
        row = {key: value.strip() for key, value in raw.items()}
        issues, values = [], {}

        def issue(category, field, message):
            issues.append({"type": category, "field": field, "message": message})

        for field in SCHEMAS[kind][0]:
            if not row[field]:
                issue("Missing required field", field, f"{field} is required.")
        for field, value in row.items():
            if not value:
                continue
            if field in LENGTHS and len(value) > LENGTHS[field]:
                issue("Invalid value", field, f"{field} must be at most {LENGTHS[field]} characters.")
            if field in INTEGER_FIELDS or field == "Unit Price":
                try:
                    if not re.fullmatch(r"[+-]?(?:\d+(?:\.\d*)?|\.\d+)", value, flags=re.ASCII):
                        raise InvalidOperation
                    number = Decimal(value)
                    if not number.is_finite():
                        raise InvalidOperation
                except InvalidOperation:
                    issue("Invalid data type", field, f"{field} must be a finite number without currency symbols or separators.")
                    continue
                positive = field in {"Unit Price", "Quantity"}
                if number < 0 or (positive and number == 0):
                    issue("Invalid value", field, f"{field} must be {'greater than zero' if positive else 'zero or greater'}.")
                elif field in INTEGER_FIELDS and number != number.to_integral_value():
                    issue("Invalid data type", field, f"{field} must be a whole number.")
                elif number > (Decimal("9999999999.99") if field == "Unit Price" else 2147483647):
                    issue("Invalid value", field, f"{field} exceeds the supported maximum.")
                elif field == "Unit Price" and number * 100 != (number * 100).to_integral_value():
                    issue("Invalid value", field, "Unit Price must have at most two decimal places.")
                else:
                    values[field] = number
            elif field == "Sale Date":
                try:
                    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value, flags=re.ASCII):
                        raise ValueError
                    date.fromisoformat(value)
                except ValueError:
                    issue("Invalid data type", field, "Sale Date must be a valid date in YYYY-MM-DD format.")
            elif field == "Email" and not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", value):
                issue("Invalid value", field, "Email must be a valid email address.")
            elif field == "Phone" and (not re.fullmatch(r"\+?[0-9 ()-]+", value) or not 7 <= len(phone_key(value)) <= 15):
                issue("Invalid value", field, "Phone must contain 7 to 15 digits; spaces, +, parentheses and hyphens are allowed.")

        keys = set()
        if kind in {"products", "inventory"}:
            if row["SKU"]:
                keys.add(("SKU", normalized(row["SKU"])))
            if kind == "products" and row["Product Name"] and row["Category"]:
                keys.add(("Product/category", normalized(row["Product Name"]), normalized(row["Category"])))
        elif kind == "customers":
            for field in ("Email", "Phone", "Customer ID"):
                if row.get(field):
                    keys.add((field, phone_key(row[field]) if field == "Phone" else normalized(row[field])))
        elif row["Invoice Number"]:
            keys.add(("Invoice Number", normalized(row["Invoice Number"])))
        for source, matches in (("file", keys & seen), ("database", keys & existing)):
            if matches:
                fields = ", ".join(sorted({key[0] for key in matches}))
                issue(f"Duplicate in {source}", fields, f"Duplicate {fields} in {'uploaded file' if source == 'file' else 'your company database'}; this row is excluded.")
        # An invalid first occurrence still claims its identifiers: users must resolve ambiguity.
        seen.update(keys)
        product, planned_action = None, "Create"
        if kind in {"inventory", "sales"}:
            field = "SKU" if kind == "inventory" else "Product"
            key = normalized(row[field])
            product = products.get(key)
            if not product and kind == "sales" and len(product_names[key]) == 1:
                product = product_names[key][0]
            if key and not product:
                issue("Invalid value", field, f"{field} must identify an existing product in your company; use its SKU.")
            elif product and product.status != "ACTIVE":
                issue("Invalid value", field, "The product is inactive.")
            inv = inventory.get(product.id) if product else None
            if kind == "inventory" and inv:
                planned_action = "Update"
                if "Current Stock" in values and values["Current Stock"] < inv.reserved_stock:
                    issue("Invalid value", "Current Stock", "Current Stock cannot be below reserved stock.")
            if kind == "sales":
                if row["Customer"] and customers[normalized(row["Customer"])] != 1:
                    issue("Invalid value", "Customer", "Customer must match exactly one active customer in your company.")
                if "Unit Price" in values and "Quantity" in values and values["Unit Price"] * values["Quantity"] > Decimal("999999999999.99"):
                    issue("Invalid value", "Quantity", "Transaction total exceeds the supported maximum.")
                # Only eligible rows consume stock during this read-only simulation.
                if not issues and product:
                    qty = int(values["Quantity"])
                    available = min(product.stock_quantity, inv.available_stock) if inv else product.stock_quantity
                    if reserved[product.id] + qty > available:
                        issue("Invalid value", "Quantity", "Quantity exceeds available stock after earlier valid rows in this file.")
                    else:
                        reserved[product.id] += qty
        duplicate = any(i["type"].startswith("Duplicate") for i in issues)
        status = "Duplicate" if duplicate else "Invalid" if issues else "Valid"
        results.append({"rowNumber": line, "data": raw, "status": status, "issues": issues,
                        "action": "Skip" if duplicate else "Reject" if issues else planned_action})

    counts = Counter(r["status"] for r in results)
    summary = []
    for category in ERROR_TYPES:
        affected = [r for r in results if any(i["type"] == category for i in r["issues"])]
        example = next((i["message"] for r in affected for i in r["issues"] if i["type"] == category), "")
        summary.append({"type": category, "count": len(affected), "example": example})
    return {"columns": parsed["columns"], "totalRows": len(results), "validRows": counts["Valid"],
            "invalidRows": counts["Invalid"], "duplicateRows": counts["Duplicate"], "rows": results,
            "errorSummary": summary, "duplicatePolicy": POLICIES[kind], "validationLevel": "records",
            "columnTypes": {c: field_type(c) for c in parsed["columns"]}}
