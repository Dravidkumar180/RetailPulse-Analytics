// Provides labels and formatting shared by the audit-log components.
import type { AuditAction } from "../../api/auditLogApi";

// The shared values below keep formatting and business rules consistent.
export const auditActions: AuditAction[] = [
  "COMPANY_REGISTERED",
  "USER_LOGIN",
  "USER_LOGOUT",
  "PASSWORD_CHANGED",
  "USER_INVITED",
  "USER_UPDATED",
  "PROFILE_UPDATED",
  "SETTINGS_UPDATED",
  "CATEGORY_CREATED",
  "CATEGORY_UPDATED",
  "CATEGORY_DELETED",
  "PRODUCT_CREATED",
  "PRODUCT_UPDATED",
  "PRODUCT_DELETED",
  "PRODUCT_ACTIVATED",
  "PRODUCT_DEACTIVATED",
  "SALE_CREATED",
  "SALE_UPDATED",
  "SALE_DELETED",
  "INVENTORY_UPDATED",
  "STOCK_ADDED",
  "STOCK_REMOVED",
  "STOCK_ADJUSTED",
  "REORDER_LEVEL_UPDATED",
  "PRODUCT_LOW_STOCK",
  "PRODUCT_OUT_OF_STOCK",
  "REPORT_EXPORTED",
  "CUSTOMER_CREATED",
  "CUSTOMER_UPDATED",
  "CUSTOMER_DELETED",
  "CUSTOMER_ACTIVATED",
  "CUSTOMER_DEACTIVATED",
  "CUSTOMER_STATUS_CHANGED",
  "CUSTOMER_EXPORTED",
  "FORECAST_GENERATED",
  "FORECAST_EXPORTED",
  "FORECAST_REFRESHED",
  "INVENTORY_RECOMMENDATION_GENERATED",
  "DASHBOARD_VIEWED",
  "DASHBOARD_FILTERS_APPLIED",
  "IMPORT_UPLOADED",
  "IMPORT_COMPLETED",
  "IMPORT_FAILED",
];

export const formatAuditDateTime = (date: string): string =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));

export const formatAuditAction = (action: string): string =>
  action
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
