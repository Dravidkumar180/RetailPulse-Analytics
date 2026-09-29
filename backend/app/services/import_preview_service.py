"""Day 1 CSV structure checks. No persistence or business-record validation."""
import csv
import io

MAX_FILE_SIZE = 10 * 1024 * 1024
SCHEMAS = {
    "products": (["Product Name", "SKU", "Category", "Brand", "Unit Price", "Stock Quantity"], ["Laptop Pro 15", "LP001", "Electronics", "Dell", "85000", "20"]),
    "inventory": (["SKU", "Current Stock", "Reorder Level"], ["LP001", "20", "5"]),
    "customers": (["Name", "Email", "Phone"], ["Sample Customer", "customer@example.com", "+919876543210"]),
    "sales": (["Customer", "Product", "Quantity", "Unit Price", "Sale Date"], ["Sample Customer", "LP001", "1", "85000", "2026-09-29"]),
}


def preview_csv(kind: str, filename: str, content: bytes) -> dict:
    if kind not in SCHEMAS:
        raise ValueError("Select Products, Inventory, Customers, or Sales.")
    if not filename.lower().endswith(".csv"):
        raise ValueError("Invalid file type. Only .csv files are allowed.")
    if len(content) > MAX_FILE_SIZE:
        raise ValueError("File size exceeds the 10 MB limit.")
    if not content:
        raise ValueError("The selected file is empty.")
    try:
        text = content.decode("utf-8-sig")
        if "\x00" in text:
            raise ValueError("The file contains binary data. Upload a UTF-8 CSV.")
        reader = csv.reader(io.StringIO(text, newline=""), strict=True)
        headers = next(reader, [])
        columns = [h.strip() for h in headers]
        if not columns or any(not h for h in columns):
            raise ValueError("Every column must have a name.")
        if len({h.casefold() for h in columns}) != len(columns):
            raise ValueError("Duplicate column names are not allowed.")
        required = SCHEMAS[kind][0]
        missing = [h for h in required if h not in columns]
        optional = {"products": {"Description"}, "customers": {"Customer ID"}, "sales": {"Invoice Number"}}.get(kind, set())
        unexpected = [h for h in columns if h not in set(required) | optional]
        total, sample = 0, []
        for row in reader:
            if not row or all(not cell.strip() for cell in row):
                continue
            if len(row) != len(columns):
                raise ValueError(f"CSV line {reader.line_num}: expected {len(columns)} fields, found {len(row)}. Check commas and quoted values.")
            total += 1
            if len(sample) < 5:
                sample.append(dict(zip(columns, row)))
        if not total:
            raise ValueError("The CSV does not contain any data rows.")
    except UnicodeDecodeError as exc:
        raise ValueError("The file must use UTF-8 encoding.") from exc
    except csv.Error as exc:
        raise ValueError("Malformed CSV. Check quoted fields and field lengths.") from exc
    errors = []
    if missing:
        errors.append(f"Missing required columns: {', '.join(missing)}.")
    if unexpected:
        errors.append(f"Unrecognized column names: {', '.join(unexpected)}. Use the template column names (case-sensitive).")
    return {"columns": columns, "requiredColumns": required, "missingColumns": missing,
            "unexpectedColumns": unexpected, "totalRows": total, "rows": sample,
            "errors": errors, "structureValid": not errors, "validationLevel": "structure"}
