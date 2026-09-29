"""Day 1 checks use no database and never insert business records."""
import csv
import io
import unittest
from types import SimpleNamespace
from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.api.v1.endpoints.data_imports import router
from app.core.security import get_current_active_user
from app.core.exceptions import register_exception_handlers
from app.services.import_preview_service import MAX_FILE_SIZE, SCHEMAS, preview_csv


class PreviewTest(unittest.TestCase):
    def test_all_templates_and_sample_limit(self):
        for kind, (headers, sample) in SCHEMAS.items():
            with self.subTest(kind=kind):
                output = io.StringIO()
                csv.writer(output).writerows([headers, *([sample] * 8)])
                result = preview_csv(kind, "sample.CSV", output.getvalue().encode("utf-8-sig"))
                self.assertTrue(result["structureValid"])
                self.assertEqual(result["totalRows"], 8)
                self.assertEqual(len(result["rows"]), 5)

    def test_column_feedback(self):
        result = preview_csv("customers", "file.csv", b"Name,email,Other\nJane,a@example.com,x\n")
        self.assertFalse(result["structureValid"])
        self.assertEqual(result["missingColumns"], ["Email", "Phone"])
        self.assertEqual(result["unexpectedColumns"], ["email", "Other"])

    def test_reject_bad_files(self):
        for filename, content in [
            ("file.xlsx", b"x"), ("file.csv", b""), ("file.csv", b"x" * (MAX_FILE_SIZE + 1)),
            ("file.csv", b"\xff"), ("file.csv", b"Name,Email,Phone\n"),
            ("file.csv", b"Name,Name\na,b"), ("file.csv", b"Name,,Phone\na,b,c"),
            ("file.csv", b"Name,Email,Phone\na,b,c,d"),
            ("file.csv", b'Name,Email,Phone\n"unterminated,b,c'),
            ("file.csv", b"Name,Email,Phone\na,\x00,c"),
        ]:
            with self.subTest(filename=filename, length=len(content)):
                with self.assertRaises(ValueError):
                    preview_csv("customers", filename, content)

    def test_quoted_fields_blank_lines_and_multiline(self):
        result = preview_csv("customers", "file.csv", b'Name,Email,Phone\r\n"Doe, Jane",j@example.com,123\r\n\r\n"Two\nLines",l@example.com,456\r\n')
        self.assertEqual(result["totalRows"], 2)
        self.assertEqual(result["rows"][0]["Name"], "Doe, Jane")

    def test_api_templates_preview_and_authorization(self):
        app = FastAPI()
        app.include_router(router, prefix="/import")
        register_exception_handlers(app)
        user = SimpleNamespace(role="COMPANY_ADMIN", company_id=uuid4(), id=uuid4())
        app.dependency_overrides[get_current_active_user] = lambda: user
        with TestClient(app) as client:
            for kind in SCHEMAS:
                template = client.get(f"/import/templates/{kind}")
                self.assertEqual(template.status_code, 200)
                result = client.post("/import/preview", data={"importType": kind}, files={"file": ("template.csv", template.content, "text/csv")})
                self.assertEqual(result.status_code, 200)
                self.assertTrue(result.json()["structureValid"])
            bad = client.post("/import/preview", data={"importType": "customers"}, files={"file": ("file.csv", b"Name,Email,Phone\na,b,c,d")})
            self.assertEqual(bad.status_code, 400)
            user.role = "VIEWER"
            self.assertEqual(client.get("/import/templates/products").status_code, 403)
            self.assertEqual(client.post("/import/preview", data={"importType": "customers"}, files={"file": ("file.csv", b"x")}).status_code, 403)


if __name__ == "__main__":
    unittest.main()
