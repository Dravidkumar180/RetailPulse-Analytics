"""Integration checks exercise actual models, APIs, tenant boundaries and lifecycle."""

import unittest
from uuid import uuid4
from sqlalchemy import select, func, delete
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.core.constants import UserRole
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.core.exceptions import register_exception_handlers
from app.api.v1.endpoints.data_quality import router
from app.models.data_quality import QualityIssue, QualityRun, QualityChange
from app.models.inventory import Inventory, InventoryMovement
from app.models.sales import Sale
from app.models.audit_log import AuditLog
from app.services import data_quality_service as service
from tests.test_reports import ReportsTest as Fixture


class QualityTest(unittest.TestCase):
    def setUp(self):
        Fixture.setUp(self)
        self.client.close()
        app = FastAPI()
        app.include_router(router, prefix="/dq")
        register_exception_handlers(app)
        app.dependency_overrides[get_db] = lambda: self.db
        app.dependency_overrides[get_current_active_user] = lambda: self.current
        self.client = TestClient(app)
        self.db.execute(delete(QualityChange))
        # Correct the reporting fixture's intentionally omitted subtotal.
        for s in self.db.scalars(select(Sale)):
            s.subtotal = s.total_amount
        self.db.commit()

    def tearDown(self):
        Fixture.tearDown(self)

    def run_checks(self, targets=None):
        run = service.start(
            self.db,
            self.current.company_id,
            self.current.name,
            self.current.id,
            "Manual",
        )
        service.reconcile(self.db, run, targets)
        self.db.commit()
        return run

    def mismatch(self):
        inv = self.db.scalar(
            select(Inventory).where(Inventory.company_id == self.current.company_id)
        )
        inv.current_stock = 9
        self.db.commit()
        return inv

    def test_dedup_resolution_reopen_and_audit(self):
        inv = self.mismatch()
        self.run_checks()
        self.run_checks()
        findings = self.db.scalars(select(QualityIssue)).all()
        self.assertEqual(len(findings), 1)
        row = findings[0]
        result = self.client.patch(
            f"/dq/issues/{row.id}",
            json={"status": "Resolved", "previous_status": "Open", "note": "Reviewed"},
        )
        self.assertEqual(result.status_code, 200, result.text)
        self.run_checks()
        self.assertEqual(row.status, "Open")
        inv.current_stock = 10
        self.db.commit()
        self.run_checks()
        self.assertEqual(row.status, "Resolved")
        self.assertEqual(len(row.history), 3)
        self.assertTrue(row.resolved_at)
        self.assertGreater(
            self.db.scalar(select(func.count()).select_from(AuditLog)), 0
        )

    def test_tenant_isolation_on_list_detail_update_history(self):
        self.mismatch()
        run = self.run_checks()
        row = self.db.scalar(select(QualityIssue))
        self.current = self.users[1]
        self.assertEqual(self.client.get("/dq/issues").json()["total"], 0)
        self.assertEqual(self.client.get(f"/dq/issues/{row.id}").status_code, 404)
        self.assertEqual(self.client.get(f"/dq/runs/{run.id}").status_code, 404)
        self.assertEqual(
            self.client.patch(
                f"/dq/issues/{row.id}",
                json={"status": "Ignored", "previous_status": "Open", "note": "no"},
            ).status_code,
            404,
        )
        self.assertEqual(self.client.get("/dq/runs").json()["total"], 0)

    def test_combined_filters_and_date_validation(self):
        self.mismatch()
        self.run_checks()
        params = dict(
            search="Product 0",
            module="Inventory",
            severity="Error",
            status="Open",
            issue_type="Inventory mismatch",
            date_from="2000-01-01",
            date_to="2100-01-01",
        )
        self.assertEqual(
            self.client.get("/dq/issues", params=params).json()["total"], 1
        )
        params["status"] = "Resolved"
        self.assertEqual(
            self.client.get("/dq/issues", params=params).json()["total"], 0
        )
        self.assertEqual(
            self.client.get(
                "/dq/issues?date_from=2026-10-01&date_to=2026-01-01"
            ).status_code,
            422,
        )

    def test_roles(self):
        self.current.role = UserRole.VIEWER
        self.assertEqual(self.client.get("/dq/issues").status_code, 403)
        self.current.role = UserRole.ANALYST
        self.assertEqual(self.client.get("/dq/issues").status_code, 200)
        self.assertEqual(self.client.post("/dq/runs").status_code, 403)
        self.assertEqual(
            self.client.patch(
                f"/dq/issues/{uuid4()}",
                json={"status": "Open", "previous_status": "Open", "note": "x"},
            ).status_code,
            403,
        )

    def test_targeted_checks_do_not_resolve_unchecked_issue(self):
        self.mismatch()
        self.run_checks()
        row = self.db.scalar(select(QualityIssue))
        run = self.run_checks({"Customers": {str(self.customers[0].id)}})
        self.assertEqual(row.status, "Open")
        self.assertEqual(run.records_checked, 1)

    def test_automatic_outbox(self):
        self.db.execute(delete(QualityChange))
        self.db.commit()
        self.mismatch()
        self.assertGreater(
            self.db.scalar(select(func.count()).select_from(QualityChange)), 0
        )
        service.drain_changes(self.db)
        self.assertEqual(
            self.db.scalar(select(QualityIssue)).issue_type, "Inventory mismatch"
        )
        self.assertEqual(
            self.db.scalar(select(func.count()).select_from(QualityChange)), 0
        )

    def test_movement_and_oversale(self):
        inv = self.mismatch()
        m = self.db.scalar(
            select(InventoryMovement).where(InventoryMovement.inventory_id == inv.id)
        )
        m.movement_type, m.previous_quantity, m.quantity_changed, m.updated_quantity = (
            "SALE",
            2,
            -3,
            10,
        )
        self.db.commit()
        self.run_checks()
        kinds = {i.issue_type for i in self.db.scalars(select(QualityIssue))}
        self.assertTrue({"Sale exceeds stock", "Stock movement mismatch"} <= kinds)

    def test_stale_status_and_blank_note(self):
        self.mismatch()
        self.run_checks()
        row = self.db.scalar(select(QualityIssue))
        url = f"/dq/issues/{row.id}"
        self.assertEqual(
            self.client.patch(
                url,
                json={"status": "Resolved", "previous_status": "Open", "note": "  "},
            ).status_code,
            422,
        )
        self.assertEqual(
            self.client.patch(
                url,
                json={
                    "status": "Resolved",
                    "previous_status": "Investigating",
                    "note": "review",
                },
            ).status_code,
            409,
        )

    def test_details_related_records_are_tenant_scoped(self):
        self.mismatch()
        self.run_checks()
        row = self.db.scalar(select(QualityIssue))
        result = self.client.get(f"/dq/issues/{row.id}").json()
        self.assertEqual(result["current_record"]["current_stock"], 9)
        self.assertEqual(len(result["related_sales"]), 1)
        self.assertEqual(result["related_sales"][0]["invoice"], "INV0")

    def test_running_company_exclusion(self):
        service.start(self.db, self.current.company_id)
        self.db.commit()
        self.assertEqual(self.client.post("/dq/runs").status_code, 409)

    def test_saved_report_totals_and_export(self):
        from app.services.report_service import generate
        from app.schemas.report import GenerateReport

        report = generate(self.db, self.current, GenerateReport(report_type="sales"))
        report.rows = [{**r, "Line total": 999} for r in report.rows]
        self.db.commit()
        self.run_checks()
        result = self.client.get("/dq/issues?module=Reports").json()
        self.assertEqual(result["total"], 1)
        self.assertEqual(
            result["items"][0]["evidence"]["metrics"][0]["actual_total"], "200.0"
        )
        for format, content_type in [("CSV", "text/csv"), ("PDF", "application/pdf")]:
            response = self.client.get(
                "/dq/export", params={"format": format, "module": "Reports"}
            )
            self.assertEqual(
                response.status_code,
                200,
                response.text[:100] if format == "CSV" else "",
            )
            self.assertIn(content_type, response.headers["content-type"])
            self.assertGreater(len(response.content), 100)

    def test_reservations_at_sale_time(self):
        inv = self.db.scalar(
            select(Inventory).where(Inventory.company_id == self.current.company_id)
        )
        movement = self.db.scalar(
            select(InventoryMovement).where(InventoryMovement.inventory_id == inv.id)
        )
        movement.movement_type = "SALE"
        movement.previous_quantity = 12
        movement.quantity_changed = -2
        movement.updated_quantity = 10
        movement.available_before = 1
        self.db.commit()
        self.run_checks()
        self.assertIsNotNone(
            self.db.scalar(
                select(QualityIssue).where(
                    QualityIssue.issue_type == "Sale exceeds stock"
                )
            )
        )

    def test_worker_claim_and_completion(self):
        from sqlalchemy.orm import Session

        run = service.start(self.db, self.current.company_id, trigger="Manual")
        self.db.commit()
        service.worker(run.id, factory=lambda: Session(self.engine))
        self.db.refresh(run)
        self.assertEqual(run.status, "Completed")
        service.worker(run.id, factory=lambda: Session(self.engine))
        self.assertEqual(
            self.db.scalar(select(func.count()).select_from(QualityRun)), 1
        )

    def test_ignored_findings_remain_ignored(self):
        self.mismatch()
        self.run_checks()
        row = self.db.scalar(select(QualityIssue))
        service.transition(
            self.db,
            row,
            "Ignored",
            "Accepted discrepancy",
            self.current.name,
            self.current.id,
        )
        self.db.commit()
        self.run_checks()
        self.assertEqual(row.status, "Ignored")
        self.assertEqual(self.client.get("/dq/overview").json()["unresolved"], 0)

    def test_failed_check_does_not_resolve_existing_findings(self):
        from unittest.mock import patch

        self.mismatch()
        self.run_checks()
        row = self.db.scalar(select(QualityIssue))
        with patch.object(
            service.re, "fullmatch", side_effect=RuntimeError("injected check failure")
        ):
            run = self.run_checks()
        self.assertEqual(run.status, "Failed")
        self.assertTrue(run.failed_checks)
        self.assertEqual(row.status, "Open")


if __name__ == "__main__":
    unittest.main()
