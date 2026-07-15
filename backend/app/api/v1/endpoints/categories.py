from uuid import UUID
from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, select

from app.api.dependencies import BrowserInfo, ClientIp, DatabaseSession
from app.core.constants import AuditAction
from app.core.permissions import CompanyAdminOrSuperAdmin
from app.models.catalog import Category, Product
from app.schemas.catalog import CategoryList, CategoryResponse, CategoryWrite
from app.services.audit_log_service import audit_log_service

router = APIRouter()

def response(category: Category, count: int = 0) -> CategoryResponse:
    return CategoryResponse.model_validate({
        "id": category.id, "company_id": category.company_id, "name": category.name,
        "description": category.description, "status": category.status,
        "product_count": count, "created_at": category.created_at, "updated_at": category.updated_at,
    })

@router.get("", response_model=CategoryList)
def list_categories(db: DatabaseSession, current_user: CompanyAdminOrSuperAdmin, search: str | None = Query(default=None, max_length=120)) -> CategoryList:
    statement = (select(Category, func.count(Product.id)).outerjoin(Product).where(Category.company_id == current_user.company_id).group_by(Category.id).order_by(Category.name))
    if search:
        statement = statement.where(Category.name.ilike(f"%{search.strip()}%"))
    rows = db.execute(statement).all()
    return CategoryList(items=[response(item, int(count)) for item, count in rows], total=len(rows))

@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(data: CategoryWrite, db: DatabaseSession, current_user: CompanyAdminOrSuperAdmin, client_ip: ClientIp, browser: BrowserInfo) -> CategoryResponse:
    duplicate = db.scalar(select(Category).where(Category.company_id == current_user.company_id, func.lower(Category.name) == data.name.strip().lower()))
    if duplicate:
        raise HTTPException(status_code=409, detail="A category with this name already exists.")
    item = Category(company_id=current_user.company_id, name=data.name.strip(), description=data.description, status=data.status)
    db.add(item); db.flush()
    audit_log_service.create_log(db, company_id=current_user.company_id, user_id=current_user.id, action=AuditAction.CATEGORY_CREATED, ip_address=client_ip, browser=browser)
    db.commit(); db.refresh(item)
    return response(item)

@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(category_id: UUID, data: CategoryWrite, db: DatabaseSession, current_user: CompanyAdminOrSuperAdmin, client_ip: ClientIp, browser: BrowserInfo) -> CategoryResponse:
    item = db.scalar(select(Category).where(Category.id == category_id, Category.company_id == current_user.company_id))
    if not item: raise HTTPException(status_code=404, detail="Category not found.")
    duplicate = db.scalar(select(Category).where(Category.company_id == current_user.company_id, Category.id != category_id, func.lower(Category.name) == data.name.strip().lower()))
    if duplicate: raise HTTPException(status_code=409, detail="A category with this name already exists.")
    item.name, item.description, item.status = data.name.strip(), data.description, data.status
    audit_log_service.create_log(db, company_id=current_user.company_id, user_id=current_user.id, action=AuditAction.CATEGORY_UPDATED, ip_address=client_ip, browser=browser)
    db.commit(); db.refresh(item)
    count = db.scalar(select(func.count(Product.id)).where(Product.category_id == item.id)) or 0
    return response(item, int(count))

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: UUID, db: DatabaseSession, current_user: CompanyAdminOrSuperAdmin, client_ip: ClientIp, browser: BrowserInfo) -> None:
    item = db.scalar(select(Category).where(Category.id == category_id, Category.company_id == current_user.company_id))
    if not item: raise HTTPException(status_code=404, detail="Category not found.")
    if db.scalar(select(func.count(Product.id)).where(Product.category_id == item.id)):
        raise HTTPException(status_code=409, detail="Delete or move products in this category first.")
    db.delete(item)
    audit_log_service.create_log(db, company_id=current_user.company_id, user_id=current_user.id, action=AuditAction.CATEGORY_DELETED, ip_address=client_ip, browser=browser)
    db.commit()
