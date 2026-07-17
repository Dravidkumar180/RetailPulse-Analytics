from fastapi import APIRouter

from app.api.v1.endpoints import (
    audit_logs,
    auth,
    companies,
    health,
    profiles,
    users,
    products,
    categories,
    sales,
)


api_router = APIRouter()

api_router.include_router(
    health.router,
    prefix="/health",
    tags=["Health"],
)

api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"],
)

api_router.include_router(
    companies.router,
    prefix="/companies",
    tags=["Companies"],
)

api_router.include_router(
    profiles.router,
    prefix="/profiles",
    tags=["Profiles"],
)

api_router.include_router(
    users.router,
    prefix="/users",
    tags=["Users"],
)

api_router.include_router(
    audit_logs.router,
    prefix="/audit-logs",
    tags=["Audit Logs"],
)

api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(sales.router, prefix="/sales", tags=["Sales"])
