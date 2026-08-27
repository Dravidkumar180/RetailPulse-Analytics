from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Index, Integer, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class DataImport(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "data_imports"
    __table_args__ = (Index("ix_data_imports_company_created", "companyId", "createdAt"),)

    company_id: Mapped[UUID] = mapped_column("companyId", PostgreSQLUUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    import_type: Mapped[str] = mapped_column("importType", String(30), nullable=False)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    uploaded_by_id: Mapped[UUID] = mapped_column("uploadedBy", PostgreSQLUUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    uploaded_by_name: Mapped[str] = mapped_column("uploadedByName", String(100), nullable=False)
    columns: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    staged_rows: Mapped[list[dict[str, Any]]] = mapped_column("stagedRows", JSON, nullable=False, default=list)
    total_records: Mapped[int] = mapped_column("totalRecords", Integer, nullable=False, default=0)
    successful_records: Mapped[int] = mapped_column("successfulRecords", Integer, nullable=False, default=0)
    failed_records: Mapped[int] = mapped_column("failedRecords", Integer, nullable=False, default=0)
    duplicate_records: Mapped[int] = mapped_column("duplicateRecords", Integer, nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="Pending")
    completed_at: Mapped[datetime | None] = mapped_column("completedAt", DateTime(timezone=True))


class DataImportError(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "data_import_errors"
    import_id: Mapped[UUID] = mapped_column("importId", PostgreSQLUUID(as_uuid=True), ForeignKey("data_imports.id", ondelete="CASCADE"), nullable=False, index=True)
    row_number: Mapped[int] = mapped_column("rowNumber", Integer, nullable=False)
    error_type: Mapped[str] = mapped_column("errorType", String(30), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    row_data: Mapped[dict[str, Any]] = mapped_column("rowData", JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=True), nullable=False, default=lambda: datetime.now().astimezone())
