# Teaching guide: This file contains API requests and responses for api router.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from fastapi import APIRouter

# Imports the needed names from app.api.v1.endpoints.
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
    # Imports the Inventory Management API routes.
    inventory,
)


# Stores api router for the next steps.
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
# =========================================================
# Inventory Management routes
# =========================================================

# Mount overview, movements, adjustments and notifications under /inventory.
api_router.include_router(inventory.router, prefix="/inventory", tags=["Inventory"])
