"""Seed five demo customers for the most recently active company."""

from datetime import date

from app.core.database import SessionLocal, initialize_development_database
from app.models.customer import (
    Customer,
    CustomerNotification,
    CustomerPurchaseSummary,
    CustomerTimeline,
)
from app.models.user import User


CUSTOMERS = [
    ("Aarav Mehta", "aarav.mehta@example.com", "+91-98765-41001", "Male", date(1991, 3, 14), "18 Park Street", "Mumbai", "Maharashtra", "India", "RETAIL", "ONLINE_STORE"),
    ("Isha Kapoor", "isha.kapoor@example.com", "+91-98765-41002", "Female", date(1994, 8, 22), "42 Lake View Road", "Bengaluru", "Karnataka", "India", "WHOLESALE", "RETAIL_STORE"),
    ("Rohan Verma", "rohan.verma@example.com", "+91-98765-41003", "Male", date(1988, 11, 5), "7 Green Avenue", "Delhi", "Delhi", "India", "CORPORATE", "MARKETPLACE"),
    ("Ananya Rao", "ananya.rao@example.com", "+91-98765-41004", "Female", date(1997, 1, 19), "25 Jubilee Hills", "Hyderabad", "Telangana", "India", "RETAIL", "ONLINE_STORE"),
    ("Vikram Singh", "vikram.singh@example.com", "+91-98765-41005", "Male", date(1985, 6, 30), "11 Rose Garden", "Jaipur", "Rajasthan", "India", "WHOLESALE", "RETAIL_STORE"),
    ("Neha Joshi", "neha.joshi@example.com", "+91-98765-41006", "Female", date(1993, 4, 12), "31 River Walk", "Pune", "Maharashtra", "India", "RETAIL", "ONLINE_STORE"),
    ("Arjun Nair", "arjun.nair@example.com", "+91-98765-41007", "Male", date(1989, 9, 8), "9 Marine Drive", "Kochi", "Kerala", "India", "CORPORATE", "RETAIL_STORE"),
    ("Priya Desai", "priya.desai@example.com", "+91-98765-41008", "Female", date(1996, 2, 25), "54 University Road", "Ahmedabad", "Gujarat", "India", "WHOLESALE", "MARKETPLACE"),
    ("Kabir Malhotra", "kabir.malhotra@example.com", "+91-98765-41009", "Male", date(1990, 12, 17), "16 Central Avenue", "Chandigarh", "Chandigarh", "India", "RETAIL", "ONLINE_STORE"),
    ("Sanya Bose", "sanya.bose@example.com", "+91-98765-41010", "Female", date(1998, 7, 3), "22 Salt Lake", "Kolkata", "West Bengal", "India", "CORPORATE", "MARKETPLACE"),
]


def main() -> None:
    initialize_development_database()
    db = SessionLocal()
    try:
        recent_user = db.query(User).order_by(User.last_login.desc()).first()
        if recent_user is None:
            raise RuntimeError("No company user exists; register a company first.")

        company_id = recent_user.company_id
        existing_count = db.query(Customer).filter(Customer.company_id == company_id).count()
        next_number = existing_count + 1
        added = 0

        for values in CUSTOMERS:
            full_name, email, phone, gender, dob, address, city, state, country, customer_type, channel = values
            exists = db.query(Customer).filter(
                Customer.company_id == company_id,
                (Customer.email == email) | (Customer.phone == phone),
            ).first()
            if exists:
                continue

            customer = Customer(
                company_id=company_id,
                customer_id=f"CUST-2026-{next_number:06d}",
                full_name=full_name,
                email=email,
                phone=phone,
                gender=gender,
                date_of_birth=dob,
                address=address,
                city=city,
                state=state,
                country=country,
                customer_type=customer_type,
                preferred_sales_channel=channel,
                status="ACTIVE",
            )
            db.add(customer)
            db.flush()
            db.add(CustomerPurchaseSummary(customer_id=customer.id))
            db.add(CustomerTimeline(customer_id=customer.id, event="Customer Registered", details="Demo customer profile created."))
            db.add(CustomerNotification(company_id=company_id, customer_id=customer.id, title="New customer registered", message=f"{full_name} ({customer.customer_id}) was added."))
            next_number += 1
            added += 1

        db.commit()
        print(f"Added {added} customers to company {recent_user.company.name}.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
