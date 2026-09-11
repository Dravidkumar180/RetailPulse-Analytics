import unittest
from datetime import UTC, datetime, timedelta
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.models import Base, Company, User, Category, Product, DataImport
from app.models.notification import Notification
from app.core.constants import UserRole, UserStatus
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.core.exceptions import register_exception_handlers
from app.api.v1.endpoints.activity_notifications import router
from app.services.notification_service import (
    emit,
    evaluate_inventory,
    inventory_condition,
)


class NotificationsTest(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
        )
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine, expire_on_commit=False)
        self.company = Company(
            name="A",
            industry="Retail",
            email="a@test.test",
            address="Test",
            phone="123",
        )
        self.other = Company(
            name="B",
            industry="Retail",
            email="b@test.test",
            address="Test",
            phone="123",
        )
        self.db.add_all([self.company, self.other])
        self.db.flush()
        self.users = [
            User(
                company_id=self.company.id,
                name=str(role),
                email=f"{i}@test.test",
                password_hash="test",
                role=role,
                status=UserStatus.ACTIVE,
            )
            for i, role in enumerate(
                [
                    UserRole.COMPANY_ADMIN,
                    UserRole.ANALYST,
                    UserRole.VIEWER,
                    UserRole.COMPANY_ADMIN,
                ]
            )
        ]
        self.foreign = User(
            company_id=self.other.id,
            name="Other",
            email="other@test.test",
            password_hash="test",
            role=UserRole.SUPER_ADMIN,
            status=UserStatus.ACTIVE,
        )
        self.db.add_all([*self.users, self.foreign])
        self.db.commit()
        self.current = self.users[0]
        self.app = FastAPI()
        self.app.include_router(router, prefix="/notifications")
        register_exception_handlers(self.app)
        self.app.dependency_overrides[get_db] = lambda: self.db
        self.app.dependency_overrides[get_current_active_user] = lambda: self.current
        self.client = TestClient(self.app)

    def tearDown(self):
        self.client.close()
        self.db.close()
        self.engine.dispose()

    def emit(self, key):
        emit(
            self.db,
            company_id=self.company.id,
            type="LOW_STOCK",
            title="Low stock",
            message="Test",
            priority="MEDIUM",
            event_key=key,
        )
        self.db.commit()

    def test_isolation_and_roles(self):
        self.emit("one")
        rows = self.db.scalars(select(Notification)).all()
        self.assertEqual(len(rows), 3)
        nid = str(next(n.id for n in rows if n.user_id == self.current.id))
        for user in (self.users[3], self.foreign, self.users[2]):
            self.current = user
            self.assertEqual(self.client.get(f"/notifications/{nid}").status_code, 404)
            self.assertEqual(
                self.client.patch(f"/notifications/{nid}/read").status_code, 404
            )
        self.assertEqual(
            self.client.get("/notifications/unread-count").json()["count"], 0
        )

    def test_filters_read_pagination_deduplication(self):
        for key in ("1", "2", "3", "1"):
            self.emit(key)
        result = self.client.get(
            "/notifications?page_size=2&priority=MEDIUM&type=LOW_STOCK&status=unread"
        ).json()
        self.assertEqual(result["total"], 3)
        self.assertEqual(len(result["items"]), 2)
        nid = result["items"][0]["id"]
        first = self.client.patch(f"/notifications/{nid}/read").json()
        second = self.client.patch(f"/notifications/{nid}/read").json()
        self.assertEqual(first["read_at"], second["read_at"])
        self.assertEqual(
            self.client.get("/notifications/unread-count").json()["count"], 2
        )
        self.assertEqual(
            self.client.patch("/notifications/read-all").json()["updated"], 2
        )
        self.assertEqual(
            self.client.patch("/notifications/read-all").json()["updated"], 0
        )
        self.current = self.users[1]
        self.assertEqual(
            self.client.get("/notifications/unread-count").json()["count"], 3
        )
        for query in ("page=0", "priority=INVALID", "page_size=101"):
            self.assertEqual(
                self.client.get("/notifications?" + query).status_code, 422
            )

    def test_inventory_resolution_and_recurrence(self):
        category = Category(company_id=self.company.id, name="Hardware")
        self.db.add(category)
        self.db.flush()
        product = Product(
            company_id=self.company.id,
            category_id=category.id,
            name="Laptop",
            sku="L1",
            unit_price=100,
            cost_price=50,
            stock_quantity=0,
            unit_of_measure="unit",
            status="ACTIVE",
        )
        self.db.add(product)
        self.db.commit()
        self.assertEqual(
            self.client.get("/notifications").json()["items"][0]["priority"], "CRITICAL"
        )
        for _ in range(3):
            evaluate_inventory(self.db, self.company.id)
            self.db.commit()
        self.assertEqual(self.client.get("/notifications").json()["total"], 1)
        product.stock_quantity = 10
        self.db.commit()
        self.assertEqual(
            self.client.get("/notifications/unread-count").json()["count"], 0
        )
        self.assertEqual(
            self.client.get("/notifications?lifecycle=resolved").json()["total"], 1
        )
        product.stock_quantity = 0
        self.db.commit()
        self.assertEqual(
            self.client.get("/notifications?lifecycle=all").json()["total"], 2
        )

    def test_imports_expiry_role_change(self):
        for status in ("Completed", "Completed with Errors", "Failed"):
            self.db.add(
                DataImport(
                    company_id=self.company.id,
                    import_type="products",
                    filename="test.csv",
                    uploaded_by_id=self.current.id,
                    uploaded_by_name="Admin",
                    status=status,
                    successful_records=2,
                    failed_records=1,
                    duplicate_records=0,
                )
            )
            self.db.commit()
        self.assertEqual(self.client.get("/notifications").json()["total"], 3)
        self.current = self.users[1]
        self.assertEqual(self.client.get("/notifications").json()["total"], 0)
        self.current = self.users[0]
        self.current.role = UserRole.VIEWER
        self.db.commit()
        self.assertEqual(self.client.get("/notifications").json()["total"], 0)
        self.current.role = UserRole.COMPANY_ADMIN
        self.db.commit()
        row = self.db.scalar(
            select(Notification).where(Notification.user_id == self.current.id)
        )
        row.expires_at = datetime.now(UTC) - timedelta(seconds=1)
        self.db.commit()
        self.assertEqual(
            self.client.get("/notifications/unread-count").json()["count"], 2
        )

    def test_rollback_and_authentication(self):
        emit(
            self.db,
            company_id=self.company.id,
            type="SYSTEM_ALERT",
            title="Test",
            message="Test",
        )
        self.db.rollback()
        self.assertEqual(self.client.get("/notifications").json()["total"], 0)
        self.app.dependency_overrides.pop(get_current_active_user)
        self.assertEqual(self.client.get("/notifications").status_code, 401)

    def test_rule_boundaries(self):
        for args, expected in [
            ((0, 5, 2), ("OUT_OF_STOCK", "CRITICAL")),
            ((6, 5, 2), ("STOCKOUT_RISK", "HIGH")),
            ((4, 5, 0), ("LOW_STOCK", "MEDIUM")),
            ((5, 5, 0), (None, None)),
            ((15, 5, 0), (None, None)),
            ((16, 5, 0), ("OVERSTOCK", "LOW")),
            ((29, 5, 0), ("OVERSTOCK", "LOW")),
            ((30, 5, 0), ("OVERSTOCK", "MEDIUM")),
            ((44, 5, 0), ("OVERSTOCK", "MEDIUM")),
            ((45, 5, 0), ("OVERSTOCK", "HIGH")),
            ((74, 5, 0), ("OVERSTOCK", "HIGH")),
            ((75, 5, 0), ("OVERSTOCK", "CRITICAL")),
            ((80, 5, 2), (None, None)),
            ((240, 5, 2), ("OVERSTOCK", "MEDIUM")),
            ((1, 0, 0), (None, None)),
        ]:
            self.assertEqual(inventory_condition(*args), expected)

    def test_existing_overstock_refresh_preserves_identity_and_read_state(self):
        self.test_inventory_resolution_and_recurrence()
        product = self.db.scalar(select(Product))
        product.stock_quantity = 16
        self.db.commit()
        row = self.db.scalar(select(Notification).where(
            Notification.user_id == self.current.id,
            Notification.type == "OVERSTOCK",
        ))
        row.priority = "MEDIUM"  # Simulate an alert saved by the old rules.
        row.is_read = True
        row.read_at = datetime.now(UTC)
        self.db.commit()
        original_id, original_created = str(row.id), row.created_at
        for stock, priority in [(16, "LOW"), (40, "MEDIUM"), (48, "HIGH"), (80, "CRITICAL")]:
            product.stock_quantity = stock
            self.db.commit()
            evaluate_inventory(self.db, self.company.id)
            self.db.commit()
            result = self.client.get(f"/notifications?type=OVERSTOCK&priority={priority}").json()
            self.assertEqual(result["total"], 1)
            item = result["items"][0]
            self.assertEqual(item["id"], original_id)
            self.assertTrue(item["is_read"])
            self.assertEqual(item["details"]["Available stock"], stock)
            self.assertEqual(row.created_at, original_created)

    def test_sales_activity_and_audit(self):
        from app.services.audit_log_service import audit_log_service
        from app.core.constants import AuditAction
        from app.models.audit_log import AuditLog

        audit_log_service.create_log(
            self.db,
            company_id=self.company.id,
            user_id=self.current.id,
            action=AuditAction.SALE_CREATED,
            ip_address="test",
            browser="test",
            details="Invoice TEST created",
        )
        self.db.commit()
        response = self.client.get("/notifications?type=SALES_ALERT").json()
        self.assertEqual(response["total"], 1)
        self.client.patch(f"/notifications/{response['items'][0]['id']}/read")
        actions = self.db.scalars(select(AuditLog.action)).all()
        self.assertIn(AuditAction.NOTIFICATION_CREATED, actions)
        self.assertIn(AuditAction.NOTIFICATION_READ, actions)

    def test_migration_and_postgres_sql(self):
        import importlib.util
        import io
        from pathlib import Path
        from unittest.mock import patch
        from alembic.migration import MigrationContext
        from alembic.operations import Operations

        spec = importlib.util.spec_from_file_location(
            "notification_migration",
            Path(__file__).parents[1] / "alembic/versions/016_create_notifications.py",
        )
        migration = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(migration)
        Notification.__table__.drop(self.engine)
        with self.engine.begin() as connection:
            with Operations.context(
                MigrationContext.configure(connection)
            ), patch.object(migration.context, "is_offline_mode", return_value=False):
                migration.upgrade()
        self.emit("migrated")
        self.assertEqual(self.client.get("/notifications").json()["total"], 1)
        output = io.StringIO()
        context = MigrationContext.configure(
            dialect_name="postgresql", opts={"as_sql": True, "output_buffer": output}
        )
        with Operations.context(context), patch.object(
            migration.context, "is_offline_mode", return_value=True
        ):
            migration.upgrade()
        self.assertIn("CREATE TABLE notifications", output.getvalue())
        self.assertIn("ALTER TYPE audit_action", output.getvalue())
