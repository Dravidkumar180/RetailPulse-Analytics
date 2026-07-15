"""Seed sample catalog data for the local QA company."""
from decimal import Decimal

from sqlalchemy import func, select

from app.core.database import SessionLocal
from app.models.catalog import Category, Product
from app.models.company import Company


CATEGORIES = [
    ("Mobile Phones", "Smartphones and mobile accessories"),
    ("Laptops", "Portable computers for work and gaming"),
    ("Audio", "Headphones, speakers and audio equipment"),
    ("Wearables", "Smart watches and wearable technology"),
    ("Footwear", "Sports and everyday footwear"),
    ("Home & Kitchen", "Home appliances and kitchen essentials"),
    ("Cameras", "Cameras and photography equipment"),
    ("Beauty", "Personal care and beauty products"),
]

PRODUCTS = [
    ("Smartphone X1", "RTL-10001", "Mobile Phones", "TechNova", "6.7-inch display, 128GB storage", 699, 525, 50, "Piece", "ACTIVE"),
    ("Laptop Pro 15", "RTL-10002", "Laptops", "TechNova", "15.6-inch, 16GB RAM, 512GB SSD", 1299, 990, 30, "Piece", "ACTIVE"),
    ("Wireless Headphones", "RTL-10003", "Audio", "SoundMax", "Noise cancelling Bluetooth headphones", 129, 78, 120, "Piece", "ACTIVE"),
    ("Smart Watch S2", "RTL-10004", "Wearables", "FitLife", "Heart rate, GPS and water resistance", 199, 135, 0, "Piece", "INACTIVE"),
    ("Running Shoes", "RTL-10005", "Footwear", "RunFast", "Lightweight comfort-fit running shoes", 89, 52, 75, "Pair", "ACTIVE"),
    ("Air Fryer 5L", "RTL-10006", "Home & Kitchen", "HomeChef", "Digital low-oil air fryer", 149, 105, 24, "Piece", "ACTIVE"),
    ("DSLR Camera", "RTL-10007", "Cameras", "Canon", "24.2MP camera with full-HD video", 549, 420, 15, "Piece", "ACTIVE"),
    ("Perfume Classic", "RTL-10008", "Beauty", "AromaX", "Long-lasting 100ml fragrance", 39, 18, 60, "Bottle", "ACTIVE"),
    ("Bluetooth Speaker", "RTL-10009", "Audio", "SoundMax", "Portable waterproof speaker", 79, 44, 42, "Piece", "ACTIVE"),
    ("Gaming Laptop G5", "RTL-10010", "Laptops", "GameCore", "RTX graphics, 16GB RAM and 1TB SSD", 1599, 1280, 12, "Piece", "INACTIVE"),
]


def main() -> None:
    db = SessionLocal()
    try:
        company = db.scalar(select(Company).where(func.lower(Company.name) == "qa"))
        if company is None:
            company = db.scalar(select(Company).order_by(Company.created_at.desc()))
        if company is None:
            raise RuntimeError("Create a company before seeding catalog data.")

        categories: dict[str, Category] = {}
        for name, description in CATEGORIES:
            category = db.scalar(select(Category).where(Category.company_id == company.id, func.lower(Category.name) == name.lower()))
            if category is None:
                category = Category(company_id=company.id, name=name, description=description, status="ACTIVE")
                db.add(category)
                db.flush()
            categories[name] = category

        created = 0
        for name, sku, category_name, brand, description, unit_price, cost_price, stock, unit, product_status in PRODUCTS:
            exists = db.scalar(select(Product).where(Product.company_id == company.id, Product.sku == sku))
            if exists is None:
                db.add(Product(company_id=company.id, category_id=categories[category_name].id, name=name, sku=sku, brand=brand, description=description, unit_price=Decimal(str(unit_price)), cost_price=Decimal(str(cost_price)), stock_quantity=stock, unit_of_measure=unit, status=product_status))
                created += 1

        db.commit()
        print(f"Seeded {created} products and {len(categories)} categories for {company.name}.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
