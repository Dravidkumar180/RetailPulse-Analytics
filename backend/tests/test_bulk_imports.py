"""Queue and worker integration checks using an isolated two-company database."""
import csv
import io
import unittest
from datetime import timedelta
from unittest.mock import patch
from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError

from app.api.v1.endpoints.data_imports import router
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.core.exceptions import register_exception_handlers
from app.models.bulk_import import BulkImportJob, BulkImportRow
from app.models.catalog import Product
from app.models.customer import Customer, CustomerPurchaseSummary
from app.models.inventory import Inventory, InventoryMovement
from app.models.sales import Sale
from app.models.notification import Notification
from app.models.audit_log import AuditLog
from app.models.data_quality import QualityChange
from app.core.constants import AuditAction
from app.services import bulk_import_service as service
from app.services.import_preview_service import SCHEMAS
from tests import test_reports as fixtures


class BulkImportsTest(unittest.TestCase):
    def setUp(self):
        fixtures.ReportsTest.setUp(self)
        self.client.close()
        self.factory = sessionmaker(self.engine, expire_on_commit=False, autoflush=False)
        app = FastAPI()
        app.include_router(router, prefix="/import")
        register_exception_handlers(app)
        app.dependency_overrides[get_db] = lambda: self.db
        app.dependency_overrides[get_current_active_user] = lambda: self.current
        self.client = TestClient(app)

    def tearDown(self):
        fixtures.ReportsTest.tearDown(self)

    def queue(self, kind="products", rows=None, request_id=None):
        output = io.StringIO(newline="")
        csv.writer(output).writerows([SCHEMAS[kind][0], *(rows if rows is not None else [["New", "NEW", "Category", "Brand", "10", "5"]])])
        response = self.client.post("/import/jobs", data={"requestId": str(request_id or uuid4()), "importType": kind, "companyId": str(self.companies[1].id)}, files={"file": ("test.csv", output.getvalue(), "text/csv")})
        self.assertEqual(response.status_code, 202, response.text)
        return response.json()

    def status(self, job):
        self.db.expire_all()
        response = self.client.get(f'/import/jobs/{job["id"]}')
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()

    def run_worker(self):
        self.db.commit()
        self.assertTrue(service.run_once(self.factory))
        self.db.expire_all()

    def test_mixed_results_and_downloads(self):
        job = self.queue(rows=[
            ["New", "NEW", "Category", "Brand", "10", "5"],
            ["Another", "NEW", "Category", "Brand", "10", "5"],
            ["Invalid", "BAD", "Category", "Brand", "-1", "5"],
            ["=HYPERLINK(1)", "FORMULA", "Category", "Brand", "0", "5"],
        ])
        self.assertEqual(job["status"], "Uploaded")
        self.assertEqual(self.db.scalar(select(func.count()).select_from(Product)), 2)
        self.run_worker()
        result = self.status(job)
        self.assertEqual(result["status"], "Completed with Errors")
        self.assertEqual((result["successfulRecords"], result["failedRecords"], result["skippedRecords"], result["duplicateRecords"]), (1, 2, 1, 1))
        self.assertEqual(result["progress"], 100)
        rows = self.client.get(f'/import/jobs/{job["id"]}/rows?status=Failed').json()
        self.assertEqual(rows["total"], 2)
        self.assertEqual(rows["items"][0]["rowNumber"], 4)
        error_csv = self.client.get(f'/import/jobs/{job["id"]}/report').text.lstrip("\ufeff")
        parsed = list(csv.DictReader(io.StringIO(error_csv)))
        self.assertEqual(len(parsed), 3)
        self.assertTrue(parsed[-1]["Product Name"].startswith("'="))
        success = self.client.get(f'/import/jobs/{job["id"]}/report?kind=success')
        self.assertEqual(success.status_code, 200)
        self.assertIn("NEW", success.text)

    def test_idempotent_start_and_claim(self):
        key = uuid4()
        first, second = self.queue(request_id=key), self.queue(request_id=key)
        self.assertEqual(first["id"], second["id"])
        self.assertEqual(self.db.scalar(select(func.count()).select_from(BulkImportJob)), 1)
        claim = service.claim_next(self.factory)
        self.assertIsNone(service.claim_next(self.factory))
        while service.step(self.factory, *claim):
            pass
        self.assertFalse(service.step(self.factory, *claim))
        replay = self.queue(request_id=key)
        self.assertEqual(replay["status"], "Completed")
        self.assertEqual(self.db.scalar(select(func.count()).select_from(Product).where(Product.sku == "NEW")), 1)

    def test_inventory_stock_and_sales_totals(self):
        inventory_job = self.queue("inventory", [["SKU0", "25", "8"]])
        self.run_worker()
        self.assertEqual(self.status(inventory_job)["successfulRecords"], 1)
        inv = self.db.scalar(select(Inventory).where(Inventory.company_id == self.current.company_id))
        self.assertEqual((inv.current_stock, inv.available_stock, inv.reorder_level), (25, 25, 8))
        self.assertEqual(self.db.get(Product, self.products[0].id).stock_quantity, 25)
        sales_job = self.queue("sales", [["NEW-SALE", "Customer 0", "SKU0", "3", "10", "2026-10-01"]])
        self.run_worker()
        self.assertEqual(self.status(sales_job)["status"], "Completed")
        self.db.refresh(inv)
        self.assertEqual(inv.current_stock, 22)
        summary = self.db.scalar(select(CustomerPurchaseSummary).where(CustomerPurchaseSummary.customer_id == self.customers[0].id))
        self.assertEqual((summary.total_orders, summary.total_revenue, summary.total_products_purchased), (2, 230, 5))
        movements = self.db.scalars(select(InventoryMovement).where(InventoryMovement.inventory_id == inv.id)).all()
        self.assertTrue(any(m.quantity_changed == -3 and m.available_before == 25 for m in movements))

    def test_customers_import(self):
        job = self.queue("customers", [["Jane", "jane@example.com", "+91 98765 43210"]])
        self.run_worker()
        self.assertEqual(self.status(job)["successfulRecords"], 1)
        customer = self.db.scalar(select(Customer).where(Customer.email == "jane@example.com"))
        self.assertEqual(customer.company_id, self.current.company_id)
        self.assertEqual(customer.phone, "919876543210")
        self.assertIsNotNone(self.db.scalar(select(CustomerPurchaseSummary).where(CustomerPurchaseSummary.customer_id == customer.id)))

    def test_revalidate_database_changes_before_write(self):
        job = self.queue()
        self.products[0].sku = "NEW"
        self.db.commit()
        self.run_worker()
        result = self.status(job)
        self.assertEqual(result["duplicateRecords"], 1)
        self.assertEqual(result["successfulRecords"], 0)

    def test_cancel_before_and_between_batches(self):
        job = self.queue()
        self.client.post(f'/import/jobs/{job["id"]}/cancel')
        result = self.status(job)
        self.assertEqual((result["status"], result["skippedRecords"]), ("Cancelled", 1))
        self.assertFalse(service.run_once(self.factory))
        job = self.queue(rows=[[f"New {i}", f"N{i}", "Category", "Brand", "10", "5"] for i in range(4)])
        claim = service.claim_next(self.factory)
        service.step(self.factory, *claim)  # Uploaded -> Validating
        service.step(self.factory, *claim)  # Validate
        with patch.object(service, "BATCH_SIZE", 2):
            service.step(self.factory, *claim)
        self.db.expire_all()
        self.client.post(f'/import/jobs/{job["id"]}/cancel')
        service.step(self.factory, *claim)
        result = self.status(job)
        self.assertEqual((result["status"], result["successfulRecords"], result["skippedRecords"]), ("Cancelled", 2, 2))

    def test_expired_lease_resumes_without_reimporting(self):
        job = self.queue(rows=[[f"New {i}", f"N{i}", "Category", "Brand", "10", "5"] for i in range(4)])
        claim = service.claim_next(self.factory)
        service.step(self.factory, *claim)
        service.step(self.factory, *claim)
        with patch.object(service, "BATCH_SIZE", 2):
            service.step(self.factory, *claim)
        with self.factory() as db:
            queued = db.get(BulkImportJob, claim[0])
            queued.lease_until = service.now() - timedelta(seconds=1)
            db.commit()
        replacement = service.claim_next(self.factory)
        self.assertNotEqual(claim[1], replacement[1])
        self.assertFalse(service.step(self.factory, *claim))
        while service.step(self.factory, *replacement):
            pass
        result = self.status(job)
        self.assertEqual((result["status"], result["successfulRecords"]), ("Completed", 4))
        self.assertEqual(self.db.scalar(select(func.count()).select_from(Product).where(Product.sku.like("N%"))), 4)

    def test_row_savepoint_rolls_back_partial_writes(self):
        job = self.queue(rows=[["Broken", "BROKEN", "Category", "Brand", "10", "1"], ["Good", "GOOD", "Category", "Brand", "10", "1"]])
        original = service.write_record
        def fail_after_insert(db, run, row, context):
            result = original(db, run, row, context)
            if row.data["SKU"] == "BROKEN":
                raise IntegrityError("internal SQL secret", {}, Exception("secret"))
            return result
        with patch.object(service, "write_record", side_effect=fail_after_insert):
            self.run_worker()
        result = self.status(job)
        self.assertEqual((result["successfulRecords"], result["failedRecords"]), (1, 1))
        self.assertIsNone(self.db.scalar(select(Product).where(Product.sku == "BROKEN")))
        errors = self.client.get(f'/import/jobs/{job["id"]}/report').text
        self.assertNotIn("secret", errors)

    def test_unexpected_failure_preserves_completed_batches(self):
        job = self.queue(rows=[[f"New {i}", f"N{i}", "Category", "Brand", "10", "5"] for i in range(3)])
        original = service.write_record
        def fail(db, run, row, context):
            if row.data["SKU"] == "N2":
                raise RuntimeError("SECRET")
            return original(db, run, row, context)
        with patch.object(service, "BATCH_SIZE", 1), patch.object(service, "write_record", side_effect=fail), self.assertLogs(service.logger, level="ERROR"):
            self.run_worker()
        result = self.status(job)
        self.assertEqual((result["status"], result["successfulRecords"], result["skippedRecords"]), ("Failed", 2, 1))
        self.assertNotIn("SECRET", result["message"])

    def test_permissions_and_tenant_boundaries(self):
        job = self.queue()
        self.current = self.users[1]
        for path in ("", "/rows", "/report"):
            self.assertEqual(self.client.get(f'/import/jobs/{job["id"]}{path}').status_code, 404)
        self.assertEqual(self.client.post(f'/import/jobs/{job["id"]}/cancel').status_code, 404)
        self.assertEqual(self.client.get("/import/jobs").json()["total"], 0)
        self.current = self.users[0]
        self.current.role = "VIEWER"
        self.assertEqual(self.client.get("/import/jobs").status_code, 403)
        self.assertEqual(self.client.post("/import/jobs", data={"requestId": str(uuid4()), "importType": "products"}, files={"file": ("x.csv", b"x")}).status_code, 403)

    def test_real_batches_publish_progress_and_preserve_cross_batch_duplicates(self):
        records = [[f"Bulk {i}", f"BULK-{i}", "Category", "Brand", "10", "0"] for i in range(205)]
        records.append(records[0])
        job = self.queue(rows=records)
        claim = service.claim_next(self.factory)
        service.step(self.factory, *claim)
        service.step(self.factory, *claim)
        self.assertEqual(self.status(job)["duplicateRecords"], 1)
        service.step(self.factory, *claim)
        progress = self.status(job)
        self.assertEqual((progress["status"], progress["successfulRecords"], progress["processedRecords"]), ("Processing", 100, 101))
        self.assertGreater(progress["progress"], 0)
        self.assertLess(progress["progress"], 100)
        self.db.commit()
        while service.step(self.factory, *claim):
            pass
        self.assertEqual(self.status(job)["successfulRecords"], 205)
        page = self.client.get(f'/import/jobs/{job["id"]}/rows?status=Success&page=2&page_size=100').json()
        self.assertEqual((page["total"], len(page["items"])), (205, 100))

    def test_processing_rechecks_changes_after_validation(self):
        job = self.queue("sales", [["NEW-SALE", "Customer 0", "SKU0", "8", "10", "2026-10-01"]])
        claim = service.claim_next(self.factory)
        service.step(self.factory, *claim)
        service.step(self.factory, *claim)
        with self.factory() as db:
            product = db.get(Product, self.products[0].id)
            product.stock_quantity = 2
            inventory = db.scalar(select(Inventory).where(Inventory.product_id == product.id))
            inventory.current_stock = inventory.available_stock = 2
            db.commit()
        while service.step(self.factory, *claim):
            pass
        result = self.status(job)
        self.assertEqual((result["successfulRecords"], result["failedRecords"]), (0, 1))
        self.assertIsNone(self.db.scalar(select(Sale).where(Sale.invoice_number == "NEW-SALE")))

    def test_reject_changed_idempotency_payload_and_invalid_files(self):
        key = uuid4()
        self.queue(request_id=key)
        response = self.client.post("/import/jobs", data={"requestId": str(key), "importType": "products"}, files={"file": ("test.csv", b"changed")})
        self.assertEqual(response.status_code, 409)
        for filename, content in [("file.xlsx", b"x"), ("file.csv", b""), ("file.csv", b"SKU\nx")]:
            with self.subTest(filename=filename, content=content):
                response = self.client.post("/import/jobs", data={"requestId": str(uuid4()), "importType": "products"}, files={"file": (filename, content)})
                self.assertEqual(response.status_code, 400)
        self.assertEqual(self.db.scalar(select(func.count()).select_from(BulkImportJob)), 1)

    def test_cancel_completed_is_idempotent_and_reports_require_completion(self):
        job = self.queue()
        self.assertEqual(self.client.get(f'/import/jobs/{job["id"]}/report').status_code, 409)
        self.run_worker()
        for _ in range(2):
            response = self.client.post(f'/import/jobs/{job["id"]}/cancel')
            self.assertEqual(response.json()["status"], "Completed")
        self.assertEqual(self.status(job)["successfulRecords"], 1)

    def test_lifecycle_notifications_audits_and_quality_queue(self):
        key = uuid4()
        job = self.queue(request_id=key)
        self.queue(request_id=key)
        self.run_worker()
        self.queue(request_id=key)
        actions = self.db.scalars(select(AuditLog.action).where(
            AuditLog.details.like(f"Import {job['id']}:%"))).all()
        self.assertCountEqual(actions, [AuditAction.IMPORT_UPLOADED, AuditAction.IMPORT_STARTED, AuditAction.IMPORT_COMPLETED])
        notifications = self.db.scalars(select(Notification).where(Notification.resource_id == job["id"])).all()
        self.assertEqual(len(notifications), 2)
        self.assertCountEqual([n.type for n in notifications], ["IMPORT_STARTED", "IMPORT_COMPLETED"])
        self.assertTrue(all(n.path == f"/data-import?job={job['id']}" for n in notifications))
        self.assertGreater(self.db.scalar(select(func.count()).select_from(QualityChange).where(
            QualityChange.company_id == self.current.company_id)), 0)

    def test_filtered_history_and_cancellation_audit(self):
        job = self.queue()
        for _ in range(2):
            self.client.post(f'/import/jobs/{job["id"]}/cancel')
        cancelled = self.client.get("/import/jobs?import_type=products&status=Cancelled&page_size=1").json()
        self.assertEqual((cancelled["total"], len(cancelled["items"])), (1, 1))
        overview = self.client.get("/import/jobs/overview").json()
        self.assertEqual((overview["total"], overview["cancelled"], overview["active"]), (1, 1, 0))
        self.assertEqual(self.client.get("/import/jobs?import_type=sales").json()["total"], 0)
        self.assertEqual(self.client.get("/import/jobs?status=invalid").status_code, 422)
        self.assertEqual(self.db.scalar(select(func.count()).select_from(AuditLog).where(
            AuditLog.action == AuditAction.IMPORT_CANCELLED)), 1)
        self.current = self.users[1]
        self.assertEqual(self.client.get("/import/jobs/overview").json()["total"], 0)


if __name__ == "__main__":
    unittest.main()
