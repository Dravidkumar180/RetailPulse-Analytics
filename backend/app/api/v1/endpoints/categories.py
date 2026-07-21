# Teaching guide: This file contains API requests and responses for categories.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from uuid import UUID
# Imports the needed names from fastapi.
from fastapi import APIRouter, HTTPException, Query, status
# Imports the needed names from sqlalchemy.
from sqlalchemy import func, select

# Imports the needed names from app.api.dependencies.
from app.api.dependencies import BrowserInfo, ClientIp, DatabaseSession
# Imports the needed names from app.core.constants.
from app.core.constants import AuditAction
# Imports the needed names from app.core.permissions.
from app.core.permissions import CompanyAdminOrSuperAdmin
# Imports the needed names from app.models.catalog.
from app.models.catalog import Category, Product
# Imports the needed names from app.schemas.catalog.
from app.schemas.catalog import CategoryList, CategoryResponse, CategoryWrite
# Imports the needed names from app.services.audit_log_service.
from app.services.audit_log_service import audit_log_service

# Stores router for the next steps.
router = APIRouter()

# Runs response logic.
def response(category: Category, count: int = 0) -> CategoryResponse:
    # Returns the completed value to the caller.
    return CategoryResponse.model_validate({
        "id": category.id, "company_id": category.company_id, "name": category.name,
        "description": category.description, "status": category.status,
        "product_count": count, "created_at": category.created_at, "updated_at": category.updated_at,
    })

# Category list starts here.
@router.get("", response_model=CategoryList)
def list_categories(db: DatabaseSession, current_user: CompanyAdminOrSuperAdmin, search: str | None = Query(default=None, max_length=120)) -> CategoryList:
    # Stores statement for the next steps.
    statement = (select(Category, func.count(Product.id)).outerjoin(Product).where(Category.company_id == current_user.company_id).group_by(Category.id).order_by(Category.name))
    # Checks whether this condition is true.
    if search:
        # Stores statement for the next steps.
        statement = statement.where(Category.name.ilike(f"%{search.strip()}%"))
    # Stores rows for the next steps.
    rows = db.execute(statement).all()
    # Returns the completed value to the caller.
    return CategoryList(items=[response(item, int(count)) for item, count in rows], total=len(rows))

# Add category starts here.
@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(data: CategoryWrite, db: DatabaseSession, current_user: CompanyAdminOrSuperAdmin, client_ip: ClientIp, browser: BrowserInfo) -> CategoryResponse:
    # Stores duplicate for the next steps.
    duplicate = db.scalar(select(Category).where(Category.company_id == current_user.company_id, func.lower(Category.name) == data.name.strip().lower()))
    # Checks whether this condition is true.
    if duplicate:
        # Stops here and reports the problem.
        raise HTTPException(status_code=409, detail="A category with this name already exists.")
    # Stores item for the next steps.
    item = Category(company_id=current_user.company_id, name=data.name.strip(), description=data.description, status=data.status)
    # Applies this change to the database session.
    db.add(item); db.flush()
    audit_log_service.create_log(db, company_id=current_user.company_id, user_id=current_user.id, action=AuditAction.CATEGORY_CREATED, ip_address=client_ip, browser=browser)
    # Applies this change to the database session.
    db.commit(); db.refresh(item)
    # Returns the completed value to the caller.
    return response(item)

# Update category starts here.
@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(category_id: UUID, data: CategoryWrite, db: DatabaseSession, current_user: CompanyAdminOrSuperAdmin, client_ip: ClientIp, browser: BrowserInfo) -> CategoryResponse:
    # Stores item for the next steps.
    item = db.scalar(select(Category).where(Category.id == category_id, Category.company_id == current_user.company_id))
    # Checks whether this condition is true.
    if not item: raise HTTPException(status_code=404, detail="Category not found.")
    # Stores duplicate for the next steps.
    duplicate = db.scalar(select(Category).where(Category.company_id == current_user.company_id, Category.id != category_id, func.lower(Category.name) == data.name.strip().lower()))
    # Checks whether this condition is true.
    if duplicate: raise HTTPException(status_code=409, detail="A category with this name already exists.")
    item.name, item.description, item.status = data.name.strip(), data.description, data.status
    audit_log_service.create_log(db, company_id=current_user.company_id, user_id=current_user.id, action=AuditAction.CATEGORY_UPDATED, ip_address=client_ip, browser=browser)
    # Applies this change to the database session.
    db.commit(); db.refresh(item)
    # Stores count for the next steps.
    count = db.scalar(select(func.count(Product.id)).where(Product.category_id == item.id)) or 0
    # Returns the completed value to the caller.
    return response(item, int(count))

# Delete category starts here.
@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: UUID, db: DatabaseSession, current_user: CompanyAdminOrSuperAdmin, client_ip: ClientIp, browser: BrowserInfo) -> None:
    # Stores item for the next steps.
    item = db.scalar(select(Category).where(Category.id == category_id, Category.company_id == current_user.company_id))
    # Checks whether this condition is true.
    if not item: raise HTTPException(status_code=404, detail="Category not found.")
    # Checks whether this condition is true.
    if db.scalar(select(func.count(Product.id)).where(Product.category_id == item.id)):
        # Stops here and reports the problem.
        raise HTTPException(status_code=409, detail="Delete or move products in this category first.")
    # Applies this change to the database session.
    db.delete(item)
    audit_log_service.create_log(db, company_id=current_user.company_id, user_id=current_user.id, action=AuditAction.CATEGORY_DELETED, ip_address=client_ip, browser=browser)
    # Applies this change to the database session.
    db.commit()
