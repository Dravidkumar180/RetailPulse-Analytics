/* Teaching guide: This file contains API requests and responses for audit log api.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Imports the needed tools from ./axiosInstance.
import axiosInstance from "./axiosInstance";

// Defines the audit action type.
export type AuditAction =
  | "COMPANY_REGISTERED"
  | "USER_LOGIN"
  | "USER_LOGOUT"
  | "PASSWORD_CHANGED"
  | "USER_INVITED"
  | "USER_UPDATED"
  | "CATEGORY_CREATED"
  | "CATEGORY_UPDATED"
  | "CATEGORY_DELETED"
  | "PRODUCT_CREATED"
  | "PRODUCT_UPDATED"
  | "PRODUCT_DELETED"
  | "PRODUCT_ACTIVATED"
  | "PRODUCT_DEACTIVATED"
  | "SALE_CREATED"
  | "SALE_UPDATED"
  | "SALE_DELETED"
  | "INVENTORY_UPDATED"
  | "PRODUCT_OUT_OF_STOCK"
  | "STOCK_ADDED"
  | "STOCK_REMOVED"
  | "STOCK_ADJUSTED"
  | "REORDER_LEVEL_UPDATED"
  | "PRODUCT_LOW_STOCK"
  | "DASHBOARD_VIEWED"
  | "REPORT_EXPORTED"
  | "DASHBOARD_FILTERS_APPLIED"
  | "PROFILE_UPDATED"
  | "SETTINGS_UPDATED"
  | "CUSTOMER_CREATED"
  | "CUSTOMER_UPDATED"
  | "CUSTOMER_DELETED"
  | "CUSTOMER_ACTIVATED"
  | "CUSTOMER_DEACTIVATED"
  | "CUSTOMER_STATUS_CHANGED"
  | "CUSTOMER_EXPORTED"
  | "FORECAST_GENERATED"
  | "FORECAST_EXPORTED"
  | "FORECAST_REFRESHED"
  | "INVENTORY_RECOMMENDATION_GENERATED"
  | "IMPORT_UPLOADED"
  | "IMPORT_COMPLETED"
  | "IMPORT_FAILED";

// Defines the fields allowed in audit log company.
export interface AuditLogCompany {
  id: string;
  name: string;
}

// Defines the fields allowed in audit log user.
export interface AuditLogUser {
  id: string;
  name: string;
  email: string;
}

// Defines the fields allowed in audit log.
export interface AuditLog {
  id: string;
  company: AuditLogCompany;
  user: AuditLogUser | null;
  action: AuditAction;
  ipAddress: string;
  browser: string;
  details?: string | null;
  timestamp: string;
}

// Defines the fields allowed in audit log filters.
export interface AuditLogFilters {
  page?: number;
  pageSize?: number;
  action?: AuditAction;
  userId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  excludeAuthentication?: boolean;
}

// Defines the fields allowed in audit log list response.
export interface AuditLogListResponse {
  items: AuditLog[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

// Gets audit logs.
export const getAuditLogs = async (
  filters: AuditLogFilters = {},
): Promise<AuditLogListResponse> => {
  // Stores response for the steps below.
  const response = await axiosInstance.get<AuditLogListResponse>(
    "/audit-logs",
    {
      params: {
        page: filters.page ?? 1,
        pageSize: filters.pageSize ?? 10,
        action: filters.action,
        userId: filters.userId,
        search: filters.search,
        startDate: filters.startDate,
        endDate: filters.endDate,
        excludeAuthentication: filters.excludeAuthentication,
      },
    },
  );

  // Returns the completed result to the caller.
  return response.data;
};

export interface AuthenticationSummary {
  userId: string;
  name: string;
  email: string;
  loginCount: number;
  logoutCount: number;
  lastLogin: string | null;
  lastLogout: string | null;
  state: "SIGNED_IN" | "SIGNED_OUT";
}

export const getAuthenticationSummary = async (): Promise<
  AuthenticationSummary[]
> => {
  const response = await axiosInstance.get<AuthenticationSummary[]>(
    "/audit-logs/authentication-summary",
  );
  return response.data;
};

// Gets audit log by id.
export const getAuditLogById = async (
  auditLogId: string,
): Promise<AuditLog> => {
  // Stores response for the steps below.
  const response = await axiosInstance.get<AuditLog>(
    `/audit-logs/${auditLogId}`,
  );

  // Returns the completed result to the caller.
  return response.data;
};
