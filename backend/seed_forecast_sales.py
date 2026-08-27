"""Seed repeatable historical sales for forecast demonstrations.

The script adds paid historical invoices only for active products that have no
sales in the forecast lookback window. It intentionally does not change the
current inventory balance because these are historical, already-fulfilled
orders. Re-running it is safe: invoices use an idempotent FC-SEED prefix.
"""

from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy import func, select

from app.core.database import SessionLocal
from app.models.catalog import Product
from app.models.sales import Sale, SaleItem
from app.models.user import User


LOOKBACK_DAYS = 90
SALE_OFFSETS = (84, 70, 56, 42, 28, 21, 14, 7)


def seed() -> None:
    with SessionLocal() as db:
        user = db.scalar(
            select(User)
            .where(User.last_login.is_not(None))
            .order_by(User.last_login.desc())
        )
        if user is None:
            raise RuntimeError("No recently active user was found for sales seeding.")

        products = list(
            db.scalars(
                select(Product)
                .where(Product.company_id == user.company_id, Product.status == "ACTIVE")
                .order_by(Product.name)
            ).all()
        )
        cutoff = datetime.now(UTC) - timedelta(days=LOOKBACK_DAYS)
        sold_ids = set(
            db.scalars(
                select(SaleItem.product_id)
                .join(Sale)
                .where(
                    Sale.company_id == user.company_id,
                    Sale.sale_date >= cutoff,
                    Sale.payment_status != "FAILED",
                )
                .distinct()
            ).all()
        )
        missing = [product for product in products if product.id not in sold_ids]
        if not missing:
            print("All active products already have forecast sales history.")
            return

        now = datetime.now(UTC)
        created_sales = 0
        created_items = 0
        for sequence, offset in enumerate(SALE_OFFSETS, start=1):
            sale_date = now - timedelta(days=offset)
            invoice = f"FC-SEED-{sale_date:%Y%m%d}-{sequence:02d}"
            sale = db.scalar(select(Sale).where(Sale.company_id == user.company_id, Sale.invoice_number == invoice))
            if sale is None:
                sale = Sale(
                company_id=user.company_id,
                invoice_number=invoice,
                customer_name="Forecast History Customer",
                customer_id=None,
                sale_date=sale_date,
                sales_channel="RETAIL_STORE",
                payment_method="CASH",
                payment_status="PAID",
                notes="Historical forecast seed sale",
                subtotal=Decimal("0"),
                discount=Decimal("0"),
                tax=Decimal("0"),
                total_amount=Decimal("0"),
                created_by_id=user.id,
                )
                db.add(sale)
                created_sales += 1
            existing_product_ids = {item.product_id for item in sale.items}
            subtotal = sale.subtotal
            for product_index, product in enumerate(missing):
                if product.id in existing_product_ids:
                    continue
                quantity = 1 + ((product_index + sequence) % 4)
                line_total = product.unit_price * quantity
                sale.items.append(
                    SaleItem(
                        product_id=product.id,
                        category_id=product.category_id,
                        quantity=quantity,
                        unit_price=product.unit_price,
                        discount=Decimal("0"),
                        tax=Decimal("0"),
                        total=line_total,
                    )
                )
                subtotal += line_total
                created_items += 1
            sale.subtotal = subtotal
            sale.total_amount = subtotal
        db.commit()
        print(f"Created {created_sales} historical sales with {created_items} product lines for {len(missing)} products.")


if __name__ == "__main__":
    seed()
