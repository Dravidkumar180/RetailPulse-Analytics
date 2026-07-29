"""Persistent, tenant-scoped demand forecasts and their accuracy history."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPrimaryKeyMixin


class DemandForecast(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "demand_forecasts"
    __table_args__ = (
        UniqueConstraint("companyId", "productId", "forecastPeriod", name="uq_forecast_company_product_period"),
        Index("ix_forecasts_company_generated", "companyId", "generatedAt"),
    )

    company_id: Mapped[UUID] = mapped_column("companyId", PostgreSQLUUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    product_id: Mapped[UUID] = mapped_column("productId", PostgreSQLUUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), index=True)
    category_id: Mapped[UUID] = mapped_column("categoryId", PostgreSQLUUID(as_uuid=True), ForeignKey("categories.id", ondelete="CASCADE"), index=True)
    forecast_period: Mapped[str] = mapped_column("forecastPeriod", String(80))
    predicted_demand: Mapped[int] = mapped_column("predictedDemand", Integer)
    confidence_score: Mapped[float] = mapped_column("confidenceScore", Float)
    generated_at: Mapped[datetime] = mapped_column("generatedAt", DateTime(timezone=True), default=lambda: datetime.now().astimezone())

    product = relationship("Product")
    category = relationship("Category")


class ForecastHistory(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "forecast_history"
    __table_args__ = (Index("ix_forecast_history_forecast_created", "forecastId", "createdAt"),)

    forecast_id: Mapped[UUID] = mapped_column("forecastId", PostgreSQLUUID(as_uuid=True), ForeignKey("demand_forecasts.id", ondelete="CASCADE"), index=True)
    historical_sales: Mapped[int] = mapped_column("historicalSales", Integer)
    prediction: Mapped[int] = mapped_column(Integer)
    accuracy: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=True), default=lambda: datetime.now().astimezone())

    forecast = relationship(DemandForecast)
