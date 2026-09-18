import io
import unittest
from datetime import UTC, datetime, timedelta
from unittest.mock import patch
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.models import (
    Base,
    Company,
    User,
    Category,
    Product,
    Customer,
    Sale,
    SaleItem,
    Inventory,
    InventoryMovement,
)
from app.models.report import ReportRun, ReportSchedule
from app.core.constants import UserRole, UserStatus
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.core.exceptions import register_exception_handlers
from app.api.v1.endpoints.reports import router
from app.schemas.report import ScheduleInput
from app.services.report_scheduler import execute_due, next_execution, effective_request


class ReportsTest(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
        )
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine, expire_on_commit=False)
        self.companies = []
        self.users = []
        self.products = []
        self.customers = []
        for n in range(2):
            c = Company(
                name=f"Company {n}",
                industry="Retail",
                email=f"c{n}@test.test",
                address="Test",
                phone="123",
            )
            self.db.add(c)
            self.db.flush()
            self.companies.append(c)
            u = User(
                company_id=c.id,
                name=f"User {n}",
                email=f"u{n}@test.test",
                password_hash="test",
                role=UserRole.COMPANY_ADMIN,
                status=UserStatus.ACTIVE,
            )
            cat = Category(company_id=c.id, name="Electronics")
            customer = Customer(
                company_id=c.id,
                customer_id=f"C{n}",
                full_name=f"Customer {n}",
                email=f"b{n}@test.test",
                phone="123",
                customer_type="REGULAR",
                status="ACTIVE",
            )
            self.db.add_all([u, cat, customer])
            self.db.flush()
            self.users.append(u)
            self.customers.append(customer)
            p = Product(
                company_id=c.id,
                category_id=cat.id,
                name=f"Product {n}",
                sku=f"SKU{n}",
                brand="Brand",
                unit_price=100,
                cost_price=40,
                stock_quantity=10,
                unit_of_measure="unit",
            )
            self.db.add(p)
            self.db.flush()
            self.products.append(p)
            s = Sale(
                company_id=c.id,
                invoice_number=f"INV{n}",
                customer_name=customer.full_name,
                customer_id=customer.id,
                sale_date=datetime(2026, 9, 10, tzinfo=UTC),
                sales_channel="ONLINE",
                payment_method="CARD",
                payment_status="PAID",
                total_amount=200,
                created_by_id=u.id,
            )
            inv = Inventory(
                company_id=c.id,
                product_id=p.id,
                current_stock=10,
                available_stock=10,
                reserved_stock=0,
                reorder_level=5,
                stock_status="IN_STOCK",
            )
            self.db.add_all([s, inv])
            self.db.flush()
            self.db.add_all(
                [
                    SaleItem(
                        sale_id=s.id,
                        product_id=p.id,
                        category_id=cat.id,
                        quantity=2,
                        unit_price=100,
                        total=200,
                    ),
                    InventoryMovement(
                        inventory_id=inv.id,
                        movement_type="ADD",
                        quantity_changed=10,
                        previous_quantity=0,
                        updated_quantity=10,
                        reason="Initial",
                        performed_by_id=u.id,
                    ),
                ]
            )
        self.db.commit()
        self.current = self.users[0]
        app = FastAPI()
        app.include_router(router, prefix="/reports")
        register_exception_handlers(app)
        app.dependency_overrides[get_db] = lambda: self.db
        app.dependency_overrides[get_current_active_user] = lambda: self.current
        self.client = TestClient(app)

    def tearDown(self):
        self.client.close()
        self.db.close()
        self.engine.dispose()

    def generate(self, kind="sales", filters=None):
        r = self.client.post(
            "/reports/generate", json={"report_type": kind, "filters": filters or {}}
        )
        self.assertEqual(r.status_code, 200, r.text)
        self.assertEqual(r.json()["status"], "COMPLETED", r.text)
        return r.json()

    def config(self):
        return dict(
            name="Daily sales",
            report_type="sales",
            filters={},
            format="CSV",
            frequency="Daily",
            execution_time="09:00",
            timezone="Asia/Kolkata",
            recipients=["recipient@example.com"],
            active=True,
            period="fixed",
        )

    def test_all_reports_scoped_and_combined_filters(self):
        for kind in [
            "sales",
            "inventory",
            "customer",
            "product_performance",
            "stock_movement",
        ]:
            run = self.generate(kind)
            self.assertEqual(run["total"], 1, kind)
        f = dict(
            product_id=str(self.products[0].id),
            category_id=str(self.products[0].category_id),
            brand="Brand",
            customer_id=str(self.customers[0].id),
            sales_status="PAID",
            user_id=str(self.users[0].id),
            start_date="2026-09-10",
            end_date="2026-09-10",
        )
        run = self.generate(filters=f)
        self.assertEqual(run["total"], 1)
        f["sales_status"] = "PENDING"
        self.assertEqual(self.generate(filters=f)["total"], 0)
        response = self.client.post(
            "/reports/generate",
            json={
                "report_type": "sales",
                "filters": {"product_id": str(self.products[1].id)},
            },
        )
        self.assertEqual(response.status_code, 400)
        self.current = self.users[1]
        for suffix in ["", "/download"]:
            self.assertEqual(
                self.client.get("/reports/" + run["id"] + suffix).status_code, 404
            )
        self.assertEqual(self.client.get("/reports/history").json()["total"], 0)

    def test_validation_sort_and_export(self):
        self.assertEqual(
            self.client.post(
                "/reports/generate",
                json={
                    "report_type": "sales",
                    "filters": {"start_date": "2026-09-20", "end_date": "2026-09-01"},
                },
            ).status_code,
            422,
        )
        run = self.generate()
        self.assertEqual(
            self.client.get(
                f"/reports/{run['id']}?sort_by=Line%20total&page_size=5"
            ).json()["rows"][0]["Line total"],
            200,
        )
        self.assertEqual(
            self.client.get(f"/reports/{run['id']}?sort_by=invalid").status_code, 400
        )
        csv = self.client.get(f"/reports/{run['id']}/download?format=CSV")
        self.assertIn("Company 0", csv.text)
        self.assertIn("INV0", csv.text)
        self.assertNotIn("INV1", csv.text)
        pdf = self.client.get(f"/reports/{run['id']}/download?format=PDF")
        self.assertTrue(pdf.content.startswith(b"%PDF"))
        from pypdf import PdfReader

        text = PdfReader(io.BytesIO(pdf.content)).pages[0].extract_text()
        self.assertIn("Company 0", text)
        self.assertIn("INV0", text)

    def test_schedules_crud_roles_and_worker(self):
        response = self.client.post("/reports/schedules", json=self.config())
        self.assertEqual(response.status_code, 200, response.text)
        id = response.json()["id"]
        self.current = self.users[1]
        self.assertEqual(
            self.client.put(f"/reports/schedules/{id}", json=self.config()).status_code,
            404,
        )
        self.assertEqual(
            self.client.delete(f"/reports/schedules/{id}").status_code, 404
        )
        self.current = self.users[0]
        self.current.role = UserRole.VIEWER
        self.db.commit()
        self.assertEqual(
            self.client.post("/reports/schedules", json=self.config()).status_code, 403
        )
        self.assertEqual(self.client.get("/reports/schedules").status_code, 403)
        self.current.role = UserRole.COMPANY_ADMIN
        self.db.commit()
        from uuid import UUID

        s = self.db.get(ReportSchedule, UUID(id))
        s.next_run = datetime.now(UTC) - timedelta(minutes=1)
        self.db.commit()
        with patch("app.services.report_scheduler.deliver") as delivery:
            execute_due(self.db)
            execute_due(self.db)
            self.assertEqual(delivery.call_count, 1)
        run = self.db.scalar(select(ReportRun).where(ReportRun.schedule_id == s.id))
        self.assertEqual(run.delivery_status, "SENT")
        s.next_run = datetime.now(UTC) - timedelta(minutes=1)
        self.current.status = UserStatus.INACTIVE
        self.db.commit()
        execute_due(self.db)
        self.assertFalse(s.active)
        self.current.status = UserStatus.ACTIVE
        self.db.commit()
        self.assertEqual(
            self.client.delete(f"/reports/schedules/{id}").status_code, 204
        )
        self.assertIsNotNone(self.db.get(ReportRun, run.id))

    def test_delivery_failure_and_generation_failure(self):
        response = self.client.post("/reports/schedules", json=self.config())
        from uuid import UUID

        s = self.db.get(ReportSchedule, UUID(response.json()["id"]))
        s.next_run = datetime.now(UTC) - timedelta(minutes=1)
        self.db.commit()
        with patch(
            "app.services.report_scheduler.deliver",
            side_effect=RuntimeError("SMTP not configured"),
        ):
            execute_due(self.db)
        run = self.db.scalar(select(ReportRun))
        self.assertEqual(run.status, "COMPLETED")
        self.assertEqual(run.delivery_status, "FAILED")
        self.assertIn("SMTP", run.error)
        with patch(
            "app.services.report_service.report_data",
            side_effect=RuntimeError("internal secret"),
        ):
            r = self.client.post(
                "/reports/generate", json={"report_type": "sales"}
            ).json()
        self.assertEqual(r["status"], "FAILED")
        self.assertNotIn("secret", r["error"])

    def test_calendar_and_rolling_period(self):
        config = ScheduleInput.model_validate(
            self.config()
            | {"frequency": "Monthly", "month_day": 1, "period": "previous_period"}
        )
        now = datetime(2026, 3, 1, 5, tzinfo=UTC)
        self.assertEqual(
            next_execution(config, now).isoformat(), "2026-04-01T03:30:00+00:00"
        )
        req = effective_request(config, now)
        self.assertEqual(str(req.filters.start_date), "2026-02-01")
        self.assertEqual(str(req.filters.end_date), "2026-02-28")


if __name__ == "__main__":
    unittest.main()
