# Teaching guide: This file contains constants application logic.
# Read the short comments beside each step to follow the complete flow.
# The comments explain the code only; they do not change how it runs.

from enum import StrEnum


# Stores default page for the next steps.
DEFAULT_PAGE = 1
# Stores default page size for the next steps.
DEFAULT_PAGE_SIZE = 10
# Stores max page size for the next steps.
MAX_PAGE_SIZE = 100

# Stores min password length for the next steps.
MIN_PASSWORD_LENGTH = 8
# Stores max password length for the next steps.
MAX_PASSWORD_LENGTH = 72

# Stores access token type for the next steps.
ACCESS_TOKEN_TYPE = "access"
# Stores refresh token type for the next steps.
REFRESH_TOKEN_TYPE = "refresh"
# Stores password reset token type for the next steps.
PASSWORD_RESET_TOKEN_TYPE = "password_reset"

# Stores bearer token prefix for the next steps.
BEARER_TOKEN_PREFIX = "Bearer"


# Groups user role behavior.
class UserRole(StrEnum):
    # Stores super admin for the next steps.
    SUPER_ADMIN = "SUPER_ADMIN"
    # Stores company admin for the next steps.
    COMPANY_ADMIN = "COMPANY_ADMIN"
    # Stores analyst for the next steps.
    ANALYST = "ANALYST"
    # Stores viewer for the next steps.
    VIEWER = "VIEWER"


# Groups user status behavior.
class UserStatus(StrEnum):
    # Stores active for the next steps.
    ACTIVE = "ACTIVE"
    # Stores inactive for the next steps.
    INACTIVE = "INACTIVE"
    # Stores suspended for the next steps.
    SUSPENDED = "SUSPENDED"


# Groups audit action behavior.
class AuditAction(StrEnum):
    # Stores company registered for the next steps.
    COMPANY_REGISTERED = "COMPANY_REGISTERED"
    # Stores user login for the next steps.
    USER_LOGIN = "USER_LOGIN"
    # Stores user logout for the next steps.
    USER_LOGOUT = "USER_LOGOUT"
    # Stores password changed for the next steps.
    PASSWORD_CHANGED = "PASSWORD_CHANGED"
    # Stores category created for the next steps.
    CATEGORY_CREATED = "CATEGORY_CREATED"
    # Stores category updated for the next steps.
    CATEGORY_UPDATED = "CATEGORY_UPDATED"
    # Stores category deleted for the next steps.
    CATEGORY_DELETED = "CATEGORY_DELETED"
    # Stores product created for the next steps.
    PRODUCT_CREATED = "PRODUCT_CREATED"
    # Stores product updated for the next steps.
    PRODUCT_UPDATED = "PRODUCT_UPDATED"
    # Stores product deleted for the next steps.
    PRODUCT_DELETED = "PRODUCT_DELETED"
    # Stores product activated for the next steps.
    PRODUCT_ACTIVATED = "PRODUCT_ACTIVATED"
    # Stores product deactivated for the next steps.
    PRODUCT_DEACTIVATED = "PRODUCT_DEACTIVATED"
    # Stores sale created for the next steps.
    SALE_CREATED = "SALE_CREATED"
    # Stores sale updated for the next steps.
    SALE_UPDATED = "SALE_UPDATED"
    # Stores sale deleted for the next steps.
    SALE_DELETED = "SALE_DELETED"
    # Stores inventory updated for the next steps.
    INVENTORY_UPDATED = "INVENTORY_UPDATED"
    # Stores product out of stock for the next steps.
    PRODUCT_OUT_OF_STOCK = "PRODUCT_OUT_OF_STOCK"
    # =====================================================
    # Inventory Management audit actions
    # =====================================================

    # Records stock received through the Add Stock action.
    STOCK_ADDED = "STOCK_ADDED"
    # Records stock removed through the Remove Stock action.
    STOCK_REMOVED = "STOCK_REMOVED"
    # Records an exact manual inventory count correction.
    STOCK_ADJUSTED = "STOCK_ADJUSTED"
    # Records changes made to the product reorder threshold.
    REORDER_LEVEL_UPDATED = "REORDER_LEVEL_UPDATED"
    # Records the transition from healthy stock to low stock.
    PRODUCT_LOW_STOCK = "PRODUCT_LOW_STOCK"


# Stores company management roles for the next steps.
COMPANY_MANAGEMENT_ROLES = {
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_ADMIN,
}

# Stores all authenticated roles for the next steps.
ALL_AUTHENTICATED_ROLES = {
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_ADMIN,
    UserRole.ANALYST,
    UserRole.VIEWER,
}
