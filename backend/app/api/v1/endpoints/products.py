from uuid import UUID
from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import asc, desc, func, or_, select

from app.api.dependencies import BrowserInfo, ClientIp, DatabaseSession
from app.core.constants import AuditAction
from app.core.permissions import CompanyAdminOrSuperAdmin
from app.models.catalog import Category, Product
from app.schemas.catalog import ProductList, ProductResponse, ProductWrite
from app.services.audit_log_service import audit_log_service

router = APIRouter()

def response(item: Product) -> ProductResponse:
    return ProductResponse.model_validate({
        "id": item.id, "company_id": item.company_id, "category_id": item.category_id,
        "category_name": item.category.name, "name": item.name, "sku": item.sku,
        "brand": item.brand, "description": item.description, "unit_price": item.unit_price,
        "cost_price": item.cost_price, "stock_quantity": item.stock_quantity,
        "unit_of_measure": item.unit_of_measure, "status": item.status,
        "created_at": item.created_at, "updated_at": item.updated_at,
    })

def get_item(db, company_id, product_id):
    item = db.scalar(select(Product).join(Product.category).where(Product.id == product_id, Product.company_id == company_id))
    if not item: raise HTTPException(status_code=404, detail="Product not found.")
    return item

def validate(db, company_id, data, product_id=None):
    category = db.scalar(select(Category).where(Category.id == data.category_id, Category.company_id == company_id))
    if not category: raise HTTPException(status_code=400, detail="Category is invalid for this company.")
    sku_query = select(Product).where(Product.company_id == company_id, func.lower(Product.sku) == data.sku.strip().lower())
    name_query = select(Product).where(Product.company_id == company_id, Product.category_id == data.category_id, func.lower(Product.name) == data.name.strip().lower())
    if product_id: sku_query = sku_query.where(Product.id != product_id); name_query = name_query.where(Product.id != product_id)
    if db.scalar(sku_query): raise HTTPException(status_code=409, detail="SKU already exists in this company.")
    if db.scalar(name_query): raise HTTPException(status_code=409, detail="Product name already exists in this category.")

@router.get("", response_model=ProductList)
def list_products(db: DatabaseSession, current_user: CompanyAdminOrSuperAdmin, search: str | None = None, category_id: UUID | None = Query(default=None, alias="categoryId"), product_status: str | None = Query(default=None, alias="status"), brand: str | None = None, sort: str = "recent") -> ProductList:
    company_id = current_user.company_id
    statement = select(Product).join(Product.category).where(Product.company_id == company_id)
    if search: statement = statement.where(or_(Product.name.ilike(f"%{search}%"), Product.sku.ilike(f"%{search}%"), Product.brand.ilike(f"%{search}%")))
    if category_id: statement = statement.where(Product.category_id == category_id)
    if product_status: statement = statement.where(Product.status == product_status)
    if brand: statement = statement.where(Product.brand == brand)
    statement = statement.order_by(asc(Product.name) if sort == "name" else asc(Product.unit_price) if sort == "price" else desc(Product.created_at))
    items = list(db.scalars(statement).all())
    total = db.scalar(select(func.count(Product.id)).where(Product.company_id == company_id)) or 0
    active = db.scalar(select(func.count(Product.id)).where(Product.company_id == company_id, Product.status == "ACTIVE")) or 0
    categories = db.scalar(select(func.count(Category.id)).where(Category.company_id == company_id)) or 0
    return ProductList(items=[response(item) for item in items], total=len(items), total_products=total, active_products=active, inactive_products=total-active, total_categories=categories)

@router.get("/{product_id}", response_model=ProductResponse)
def product_detail(product_id: UUID, db: DatabaseSession, current_user: CompanyAdminOrSuperAdmin): return response(get_item(db, current_user.company_id, product_id))

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(data: ProductWrite, db: DatabaseSession, current_user: CompanyAdminOrSuperAdmin, client_ip: ClientIp, browser: BrowserInfo):
    validate(db, current_user.company_id, data)
    item = Product(company_id=current_user.company_id, **data.model_dump()); item.name=item.name.strip(); item.sku=item.sku.strip().upper()
    db.add(item); db.flush(); audit_log_service.create_log(db, company_id=current_user.company_id, user_id=current_user.id, action=AuditAction.PRODUCT_CREATED, ip_address=client_ip, browser=browser); db.commit(); db.refresh(item)
    return response(item)

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: UUID, data: ProductWrite, db: DatabaseSession, current_user: CompanyAdminOrSuperAdmin, client_ip: ClientIp, browser: BrowserInfo):
    item=get_item(db,current_user.company_id,product_id); old=item.status; validate(db,current_user.company_id,data,product_id)
    for key,value in data.model_dump().items(): setattr(item,key,value)
    item.name=item.name.strip(); item.sku=item.sku.strip().upper()
    action = AuditAction.PRODUCT_ACTIVATED if old != item.status and item.status == "ACTIVE" else AuditAction.PRODUCT_DEACTIVATED if old != item.status else AuditAction.PRODUCT_UPDATED
    audit_log_service.create_log(db,company_id=current_user.company_id,user_id=current_user.id,action=action,ip_address=client_ip,browser=browser); db.commit(); db.refresh(item); return response(item)

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: UUID, db: DatabaseSession, current_user: CompanyAdminOrSuperAdmin, client_ip: ClientIp, browser: BrowserInfo):
    item=get_item(db,current_user.company_id,product_id); db.delete(item); audit_log_service.create_log(db,company_id=current_user.company_id,user_id=current_user.id,action=AuditAction.PRODUCT_DELETED,ip_address=client_ip,browser=browser); db.commit()
