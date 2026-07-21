# Teaching guide: This file contains  init  database tables.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from app.models.audit_log import AuditLog
# Imports the needed names from app.models.base.
from app.models.base import Base
# Imports the needed names from app.models.company.
from app.models.company import Company
# Imports the needed names from app.models.refresh_token.
from app.models.refresh_token import RefreshToken
# Imports the needed names from app.models.user.
from app.models.user import User
# Imports the needed names from app.models.catalog.
from app.models.catalog import Category, Product
# Imports the needed names from app.models.sales.
from app.models.sales import Sale, SaleItem
# Imports Inventory Management tables so create_all and metadata can discover them.
from app.models.inventory import Inventory, InventoryMovement, InventoryNotification

# Stores  all  for the next steps.
__all__ = [
    "Base",
    "Company",
    "User",
    "RefreshToken",
    "AuditLog",
    "Category",
    "Product",
    "Sale",
    "SaleItem",
    # Exposes the Inventory Management models to application modules.
    "Inventory",
    "InventoryMovement",
    "InventoryNotification",
]
