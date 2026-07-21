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
  | "SALE_CREATED"
  | "SALE_UPDATED"
  | "SALE_DELETED"
  | "INVENTORY_UPDATED"
  | "PRODUCT_OUT_OF_STOCK";

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
      },
    },
  );

  // Returns the completed result to the caller.
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
