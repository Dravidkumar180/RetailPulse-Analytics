import axiosInstance from "./axiosInstance";

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

export interface AuditLogCompany {
  id: string;
  name: string;
}

export interface AuditLogUser {
  id: string;
  name: string;
  email: string;
}

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

export interface AuditLogFilters {
  page?: number;
  pageSize?: number;
  action?: AuditAction;
  userId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface AuditLogListResponse {
  items: AuditLog[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export const getAuditLogs = async (
  filters: AuditLogFilters = {},
): Promise<AuditLogListResponse> => {
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

  return response.data;
};

export const getAuditLogById = async (
  auditLogId: string,
): Promise<AuditLog> => {
  const response = await axiosInstance.get<AuditLog>(
    `/audit-logs/${auditLogId}`,
  );

  return response.data;
};
