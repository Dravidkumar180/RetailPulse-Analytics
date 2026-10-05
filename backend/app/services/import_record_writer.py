"""Write one validated record inside the worker's transaction/savepoint."""
from datetime import UTC, datetime
from decimal import Decimal
from sqlalchemy import func, select
from app.models.catalog import Category, Product
from app.models.customer import Customer, CustomerPurchaseSummary, CustomerTimeline
from app.models.inventory import Inventory, InventoryMovement
from app.models.sales import Sale, SaleItem
from app.services.import_validation_service import normalized, phone_key


def stock_status(available, reorder):
    return "OUT_OF_STOCK" if available == 0 else "LOW_STOCK" if available <= reorder else "IN_STOCK"


def write_record(db, job, record, context):
    row = {key: value.strip() for key, value in record.data.items()}
    company = job.company_id
    if job.import_type == "products":
        if "categories" not in context:
            context["categories"] = {normalized(c.name): c for c in db.scalars(select(Category).where(Category.company_id == company))}
        category = context["categories"].get(normalized(row["Category"]))
        if not category:
            category = Category(company_id=company, name=row["Category"], status="ACTIVE")
            db.add(category)
            db.flush()
            context["categories"][normalized(category.name)] = category
        stock, price = int(Decimal(row["Stock Quantity"])), Decimal(row["Unit Price"])
        product = Product(company_id=company, category_id=category.id, name=row["Product Name"], sku=row["SKU"],
            brand=row["Brand"], description=row.get("Description") or None, unit_price=price, cost_price=price,
            stock_quantity=stock, unit_of_measure="Each", status="ACTIVE")
        db.add(product)
        db.flush()
        inv = Inventory(company_id=company, product_id=product.id, current_stock=stock, reserved_stock=0,
            available_stock=stock, reorder_level=5, stock_status=stock_status(stock, 5))
        db.add(inv)
        db.flush()
        movement(db, job, inv, 0, stock, 0, "IMPORT")
        return str(product.id), "Created"
    if job.import_type == "customers":
        customer = Customer(company_id=company, customer_id=row.get("Customer ID") or f"I{job.id.hex[:20]}-{record.row_number}",
            full_name=row["Name"], email=row["Email"].lower(), phone=phone_key(row["Phone"]),
            customer_type="RETAIL", status="ACTIVE", is_deleted=False)
        db.add(customer)
        db.flush()
        db.add(CustomerPurchaseSummary(customer_id=customer.id))
        db.add(CustomerTimeline(customer_id=customer.id, event="Customer Imported", details=f"Import {job.id}"))
        return str(customer.id), "Created"
    key = normalized(row["SKU"] if job.import_type == "inventory" else row["Product"])
    if "products" not in context:
        products = list(db.scalars(select(Product).where(Product.company_id == company)))
        context["products"] = {normalized(p.sku): p for p in products}
        names = {}
        for p in products:
            names.setdefault(normalized(p.name), []).append(p)
        context["product_names"] = names
    product = context["products"].get(key)
    if not product and job.import_type == "sales":
        matches = context["product_names"].get(key, [])
        product = matches[0] if len(matches) == 1 else None
    if not product or product.status != "ACTIVE":
        raise ValueError("The product is no longer available. Revalidate the file.")
    inv = db.scalar(select(Inventory).where(Inventory.company_id == company, Inventory.product_id == product.id).with_for_update())
    previous, available_before = product.stock_quantity, inv.available_stock if inv else product.stock_quantity
    if job.import_type == "inventory":
        stock, reorder = int(Decimal(row["Current Stock"])), int(Decimal(row["Reorder Level"]))
        if inv and stock < inv.reserved_stock:
            raise ValueError("Current Stock cannot be below reserved stock.")
        action = "Updated" if inv else "Created"
        if not inv:
            inv = Inventory(company_id=company, product_id=product.id, reserved_stock=0)
            db.add(inv)
        else:
            previous = inv.current_stock
        product.stock_quantity = stock
        inv.current_stock, inv.reorder_level = stock, reorder
        inv.available_stock = stock - inv.reserved_stock
        inv.stock_status = stock_status(inv.available_stock, reorder)
        db.flush()
        movement(db, job, inv, previous, stock, available_before, "IMPORT")
        return str(inv.id), action
    qty, price = int(Decimal(row["Quantity"])), Decimal(row["Unit Price"])
    if inv and inv.current_stock != product.stock_quantity:
        raise ValueError("Product and inventory stock disagree. Reconcile stock before importing this sale.")
    if qty > min(product.stock_quantity, available_before):
        raise ValueError("Quantity exceeds current available stock.")
    if "customers" not in context:
        context["customers"] = {}
        for c in db.scalars(select(Customer).where(Customer.company_id == company, Customer.is_deleted.is_(False), Customer.status == "ACTIVE")):
            context["customers"].setdefault(normalized(c.full_name), []).append(c)
    matches = context["customers"].get(normalized(row["Customer"]), [])
    if len(matches) != 1:
        raise ValueError("Customer no longer matches exactly one active company customer.")
    customer, total = matches[0], qty * price
    sale = Sale(company_id=company, invoice_number=row["Invoice Number"], customer_name=customer.full_name,
        customer_id=customer.id, sale_date=datetime.fromisoformat(row["Sale Date"]).replace(tzinfo=UTC),
        sales_channel="IMPORT", payment_method="OTHER", payment_status="PAID", subtotal=total,
        discount=0, tax=0, total_amount=total, created_by_id=job.user_id)
    db.add(sale)
    db.flush()
    db.add(SaleItem(sale_id=sale.id, product_id=product.id, category_id=product.category_id,
        quantity=qty, unit_price=price, discount=0, tax=0, total=total))
    product.stock_quantity -= qty
    if not inv:
        inv = Inventory(company_id=company, product_id=product.id, reserved_stock=0, reorder_level=5)
        db.add(inv)
    inv.current_stock = product.stock_quantity
    inv.available_stock = inv.current_stock - inv.reserved_stock
    inv.stock_status = stock_status(inv.available_stock, inv.reorder_level)
    db.flush()
    movement(db, job, inv, previous, product.stock_quantity, available_before, "SALE")
    # Keep the customer aggregate consistent with the authoritative sales ledger.
    summary = db.scalar(select(CustomerPurchaseSummary).where(CustomerPurchaseSummary.customer_id == customer.id))
    if not summary:
        summary = CustomerPurchaseSummary(customer_id=customer.id)
        db.add(summary)
    orders, revenue, first, last = db.execute(select(func.count(Sale.id), func.coalesce(func.sum(Sale.total_amount), 0), func.min(Sale.sale_date), func.max(Sale.sale_date)).where(Sale.company_id == company, Sale.customer_id == customer.id)).one()
    summary.total_orders, summary.total_revenue = orders, revenue
    summary.average_order_value = revenue / orders if orders else 0
    summary.first_purchase_date, summary.last_purchase_date = first, last
    summary.total_products_purchased = db.scalar(select(func.coalesce(func.sum(SaleItem.quantity), 0)).join(Sale, SaleItem.sale_id == Sale.id).where(Sale.company_id == company, Sale.customer_id == customer.id))
    return str(sale.id), "Created"


def movement(db, job, inv, before, after, available_before, kind):
    db.add(InventoryMovement(inventory_id=inv.id, movement_type=kind, quantity_changed=after - before,
        previous_quantity=before, updated_quantity=after, available_before=available_before,
        reason="CSV import", remarks=f"Import {job.id}", performed_by_id=job.user_id))
