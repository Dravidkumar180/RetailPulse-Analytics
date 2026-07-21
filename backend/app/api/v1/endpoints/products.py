# Teaching guide: This file contains API requests and responses for products.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from uuid import UUID
# Imports the needed names from fastapi.
from fastapi import APIRouter, HTTPException, Query, status
# Imports the needed names from sqlalchemy.
from sqlalchemy import asc, desc, func, or_, select

# Imports the needed names from app.api.dependencies.
from app.api.dependencies import BrowserInfo, ClientIp, DatabaseSession
# Imports the needed names from app.core.constants.
from app.core.constants import AuditAction
# Imports the needed names from app.core.permissions.
from app.core.permissions import CompanyAdminOrSuperAdmin
# Imports the needed names from app.models.catalog.
from app.models.catalog import Category, Product
# Imports the needed names from app.schemas.catalog.
from app.schemas.catalog import ProductList, ProductResponse, ProductWrite
# Imports the needed names from app.services.audit_log_service.
from app.services.audit_log_service import audit_log_service

# Stores router for the next steps.
router = APIRouter()

# Runs response logic.
def response(item: Product) -> ProductResponse:
    # Returns the completed value to the caller.
    return ProductResponse.model_validate({
        "id": item.id, "company_id": item.company_id, "category_id": item.category_id,
        "category_name": item.category.name, "name": item.name, "sku": item.sku,
        "brand": item.brand, "description": item.description, "unit_price": item.unit_price,
        "cost_price": item.cost_price, "stock_quantity": item.stock_quantity,
        "unit_of_measure": item.unit_of_measure, "status": item.status,
        "created_at": item.created_at, "updated_at": item.updated_at,
    })

# Gets item.
def get_item(db, company_id, product_id):
    # Stores item for the next steps.
    item = db.scalar(select(Product).join(Product.category).where(Product.id == product_id, Product.company_id == company_id))
    # Checks whether this condition is true.
    if not item: raise HTTPException(status_code=404, detail="Product not found.")
    # Returns the completed value to the caller.
    return item

# Checks validate.
def validate(db, company_id, data, product_id=None):
    # Stores category for the next steps.
    category = db.scalar(select(Category).where(Category.id == data.category_id, Category.company_id == company_id))
    # Checks whether this condition is true.
    if not category: raise HTTPException(status_code=400, detail="Category is invalid for this company.")
    # Stores sku query for the next steps.
    sku_query = select(Product).where(Product.company_id == company_id, func.lower(Product.sku) == data.sku.strip().lower())
    # Stores name query for the next steps.
    name_query = select(Product).where(Product.company_id == company_id, Product.category_id == data.category_id, func.lower(Product.name) == data.name.strip().lower())
    # Checks whether this condition is true.
    if product_id: sku_query = sku_query.where(Product.id != product_id); name_query = name_query.where(Product.id != product_id)
    # Checks whether this condition is true.
    if db.scalar(sku_query): raise HTTPException(status_code=409, detail="SKU already exists in this company.")
    # Checks whether this condition is true.
    if db.scalar(name_query): raise HTTPException(status_code=409, detail="Product name already exists in this category.")

# Gets products.
@router.get("", response_model=ProductList)
def list_products(db: DatabaseSession, current_user: CompanyAdminOrSuperAdmin, search: str | None = None, category_id: UUID | None = Query(default=None, alias="categoryId"), product_status: str | None = Query(default=None, alias="status"), brand: str | None = None, sort: str = "recent") -> ProductList:
    # Stores company id for the next steps.
    company_id = current_user.company_id
    # Stores statement for the next steps.
    statement = select(Product).join(Product.category).where(Product.company_id == company_id)
    # Checks whether this condition is true.
    if search: statement = statement.where(or_(Product.name.ilike(f"%{search}%"), Product.sku.ilike(f"%{search}%"), Product.brand.ilike(f"%{search}%")))
    # Checks whether this condition is true.
    if category_id: statement = statement.where(Product.category_id == category_id)
    # Checks whether this condition is true.
    if product_status: statement = statement.where(Product.status == product_status)
    # Checks whether this condition is true.
    if brand: statement = statement.where(Product.brand == brand)
    # Stores statement for the next steps.
    statement = statement.order_by(asc(Product.name) if sort == "name" else asc(Product.unit_price) if sort == "price" else desc(Product.created_at))
    # Stores items for the next steps.
    items = list(db.scalars(statement).all())
    # Stores total for the next steps.
    total = db.scalar(select(func.count(Product.id)).where(Product.company_id == company_id)) or 0
    # Stores active for the next steps.
    active = db.scalar(select(func.count(Product.id)).where(Product.company_id == company_id, Product.status == "ACTIVE")) or 0
    # Stores categories for the next steps.
    categories = db.scalar(select(func.count(Category.id)).where(Category.company_id == company_id)) or 0
    # Returns the completed value to the caller.
    return ProductList(items=[response(item) for item in items], total=len(items), total_products=total, active_products=active, inactive_products=total-active, total_categories=categories)

# Runs product detail logic.
@router.get("/{product_id}", response_model=ProductResponse)
def product_detail(product_id: UUID, db: DatabaseSession, current_user: CompanyAdminOrSuperAdmin): return response(get_item(db, current_user.company_id, product_id))

# Adds product.
@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(data: ProductWrite, db: DatabaseSession, current_user: CompanyAdminOrSuperAdmin, client_ip: ClientIp, browser: BrowserInfo):
    validate(db, current_user.company_id, data)
    # Stores item for the next steps.
    item = Product(company_id=current_user.company_id, **data.model_dump()); item.name=item.name.strip(); item.sku=item.sku.strip().upper()
    # Applies this change to the database session.
    db.add(item); db.flush(); audit_log_service.create_log(db, company_id=current_user.company_id, user_id=current_user.id, action=AuditAction.PRODUCT_CREATED, ip_address=client_ip, browser=browser); db.commit(); db.refresh(item)
    # Returns the completed value to the caller.
    return response(item)

# Saves product.
@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: UUID, data: ProductWrite, db: DatabaseSession, current_user: CompanyAdminOrSuperAdmin, client_ip: ClientIp, browser: BrowserInfo):
    # Stores item for the next steps.
    item=get_item(db,current_user.company_id,product_id); old=item.status; validate(db,current_user.company_id,data,product_id)
    # Repeats this work for the matching values.
    for key,value in data.model_dump().items(): setattr(item,key,value)
    item.name=item.name.strip(); item.sku=item.sku.strip().upper()
    # Stores action for the next steps.
    action = AuditAction.PRODUCT_ACTIVATED if old != item.status and item.status == "ACTIVE" else AuditAction.PRODUCT_DEACTIVATED if old != item.status else AuditAction.PRODUCT_UPDATED
    audit_log_service.create_log(db,company_id=current_user.company_id,user_id=current_user.id,action=action,ip_address=client_ip,browser=browser); db.commit(); db.refresh(item); return response(item)

# Removes product.
@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: UUID, db: DatabaseSession, current_user: CompanyAdminOrSuperAdmin, client_ip: ClientIp, browser: BrowserInfo):
    # Stores item for the next steps.
    item=get_item(db,current_user.company_id,product_id); db.delete(item); audit_log_service.create_log(db,company_id=current_user.company_id,user_id=current_user.id,action=AuditAction.PRODUCT_DELETED,ip_address=client_ip,browser=browser); db.commit()
