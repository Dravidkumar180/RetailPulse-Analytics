"""Day 2 validation integration tests against an isolated, two-company database."""
import csv
import io
import unittest
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError

from app.api.v1.endpoints.data_imports import router
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.core.exceptions import register_exception_handlers
from app.models.catalog import Product
from app.models.customer import Customer
from app.models.inventory import Inventory
from app.models.sales import Sale
from app.models.data_import import DataImport
from app.services.import_preview_service import SCHEMAS, MAX_FILE_SIZE
from tests import test_reports as fixtures


class ImportValidationTest(unittest.TestCase):
    def setUp(self):
        fixtures.ReportsTest.setUp(self)
        self.client.close()
        self.customers[0].phone = "+91 98765 43210"
        self.db.commit()
        app = FastAPI()
        app.include_router(router, prefix="/import")
        register_exception_handlers(app)
        app.dependency_overrides[get_db] = lambda: self.db
        app.dependency_overrides[get_current_active_user] = lambda: self.current
        self.client = TestClient(app)

    def tearDown(self):
        fixtures.ReportsTest.tearDown(self)

    def send(self, kind, rows, columns=None):
        out = io.StringIO(newline="")
        writer = csv.writer(out)
        writer.writerow(columns or SCHEMAS[kind][0])
        writer.writerows(rows)
        return self.client.post("/import/validate-file", data={"importType": kind, "companyId": str(self.companies[1].id)},
            files={"file": ("sample.csv", out.getvalue().encode("utf-8"), "text/csv")})

    def validate(self, kind, rows, columns=None):
        response = self.send(kind, rows, columns)
        self.assertEqual(response.status_code, 200, response.text)
        result = response.json()
        self.assertEqual(result["totalRows"], result["validRows"] + result["invalidRows"] + result["duplicateRows"])
        return result

    def test_products_duplicates_and_overlapping_errors(self):
        result = self.validate("products", [
            ["New", "NEW", "Electronics", "Brand", "100", "5"],
            ["New again", " new ", "Electronics", "Brand", "-1", "5"],
            ["Existing", "sku0", "Electronics", "Brand", "100", "5"],
            ["", "MISSING", "Electronics", "", "abc", "-3"],
            ["Other company SKU", "SKU1", "Electronics", "Brand", "100", "5"],
            ["Product 0", "DIFFERENT", "Electronics", "Brand", "100", "5"],
        ])
        self.assertEqual((result["validRows"], result["invalidRows"], result["duplicateRows"]), (2, 1, 3))
        self.assertEqual(result["rows"][1]["action"], "Skip")
        self.assertEqual(len(result["rows"][3]["issues"]), 4)
        self.assertTrue(any(i["type"] == "Invalid value" for i in result["rows"][1]["issues"]))

    def test_numeric_edge_cases_are_safe(self):
        for price, stock in [("NaN", "1"), ("Infinity", "1"), ("1e500", "1"), ("0", "1"),
                             ("10.123", "1"), ("10000000000", "1"), ("1", "1.2"), ("1", "2147483648")]:
            with self.subTest(price=price, stock=stock):
                result = self.validate("products", [["New", "NEW", "Category", "Brand", price, stock]])
                self.assertEqual(result["invalidRows"], 1)

    def test_customer_normalized_duplicates_and_optional_code(self):
        columns = [*SCHEMAS["customers"][0], "Customer ID"]
        result = self.validate("customers", [
            ["Email match", "B0@TEST.TEST", "1234567890", "NEW"],
            ["Phone match", "new@example.com", "919876543210", "NEXT"],
            ["Code match", "code@example.com", "1234567891", "C0"],
            ["First", "fresh@example.com", "1234567892", "FRESH"],
            ["Second", "FRESH@example.com", "1234567893", "SECOND"],
            ["Invalid", "bad", "abc", "BAD"],
        ], columns)
        self.assertEqual((result["validRows"], result["invalidRows"], result["duplicateRows"]), (1, 1, 4))

    def test_inventory_update_policy_and_reserved_stock(self):
        inv = self.db.scalar(select(Inventory).where(Inventory.company_id == self.current.company_id))
        inv.reserved_stock = 3
        self.db.commit()
        result = self.validate("inventory", [["SKU0", "4", "0"], ["sku0", "5", "1"], ["SKU1", "6", "1"]])
        self.assertEqual([r["status"] for r in result["rows"]], ["Valid", "Duplicate", "Invalid"])
        self.assertEqual(result["rows"][0]["action"], "Update")
        self.assertEqual(self.validate("inventory", [["SKU0", "2", "1"]])["invalidRows"], 1)
        self.db.refresh(inv)
        self.assertEqual(inv.current_stock, 10)

    def test_sales_duplicates_dont_reserve_stock(self):
        result = self.validate("sales", [
            ["INV0", "Customer 0", "SKU0", "10", "100", "2026-09-30"],
            ["NEW1", "Customer 0", "SKU0", "6", "100", "2026-09-30"],
            ["NEW2", "Customer 0", "SKU0", "5", "100", "2026-09-30"],
            ["NEW3", "Customer 0", "SKU0", "4", "100", "2026-09-30"],
            ["NEW4", "Customer 1", "SKU1", "1", "100", "2026-02-30"],
        ])
        self.assertEqual([r["status"] for r in result["rows"]], ["Duplicate", "Valid", "Invalid", "Valid", "Invalid"])
        self.assertEqual(len(result["rows"][4]["issues"]), 3)
        self.assertEqual(self.send("sales", [["C", "P", "1", "1", "2026-09-30"]], SCHEMAS["sales"][0][1:]).status_code, 400)

    def test_validation_is_read_only_and_tenant_scoped(self):
        models = (Product, Customer, Inventory, Sale, DataImport)
        before = [self.db.scalar(select(func.count()).select_from(model)) for model in models]
        first = self.validate("products", [["Cross company", "SKU1", "Category", "Brand", "100", "1"]])
        self.assertEqual(first["validRows"], 1)
        self.current = self.users[1]
        second = self.validate("products", [["Cross company", "SKU1", "Category", "Brand", "100", "1"]])
        self.assertEqual(second["duplicateRows"], 1)
        self.assertEqual(before, [self.db.scalar(select(func.count()).select_from(model)) for model in models])

    def test_line_numbers_and_full_result(self):
        rows = [["First\nPerson", "first@example.com", "1234567890"], [],
                *[[f"Customer {n}", f"person{n}@example.com", f"987654{n:04}"] for n in range(25)]]
        result = self.validate("customers", rows)
        self.assertEqual(len(result["rows"]), 26)
        self.assertEqual(result["rows"][0]["rowNumber"], 2)
        self.assertEqual(result["rows"][1]["rowNumber"], 5)

    def test_permission_and_safe_server_error(self):
        self.current.role = "VIEWER"
        self.assertEqual(self.send("customers", [["Name", "a@example.com", "1234567890"]]).status_code, 403)
        self.current.role = "COMPANY_ADMIN"
        with patch("app.api.v1.endpoints.data_imports.validate_file", side_effect=SQLAlchemyError("SECRET CONNECTION STRING")):
            response = self.send("customers", [["Name", "a@example.com", "1234567890"]])
            self.assertEqual(response.status_code, 503)
            self.assertNotIn("SECRET", response.text)

    def test_rechecks_structure_and_limits(self):
        self.assertEqual(self.send("customers", [["Name", "Email"]], ["Name", "Email"]).status_code, 400)
        response = self.client.post("/import/validate-file", data={"importType": "customers"},
            files={"file": ("oversize.csv", b"x" * (MAX_FILE_SIZE + 1))})
        self.assertEqual(response.status_code, 413)

    def test_large_file_validates_every_row(self):
        result = self.validate("products", [[f"Bulk product {i}", f"BULK-{i}", "Category", "Brand", "10.50", "0"] for i in range(25000)])
        self.assertEqual(result["validRows"], 25000)
        self.assertEqual(result["rows"][-1]["rowNumber"], 25001)


if __name__ == "__main__":
    unittest.main()
