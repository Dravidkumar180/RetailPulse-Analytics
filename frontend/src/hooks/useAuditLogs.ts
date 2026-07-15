import {
  keepPreviousData,
  useQuery,
} from "@tanstack/react-query";

import {
  getAuditLogs,
  type AuditLogFilters,
  type AuditLogListResponse,
} from "../api/auditLogApi";
import { useAuth } from "./useAuth";

export const auditLogsQueryKey = (
  filters: AuditLogFilters,
) => ["audit-logs", filters] as const;

export const useAuditLogs = (
  filters: AuditLogFilters = {},
) => {
  const {
    isAuthenticated,
    isLoading: authLoading,
    user,
  } = useAuth();

  const canViewAuditLogs =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "COMPANY_ADMIN";

  return useQuery<AuditLogListResponse, Error>({
    queryKey: auditLogsQueryKey(filters),
    queryFn: () => getAuditLogs(filters),
    enabled:
      isAuthenticated &&
      !authLoading &&
      canViewAuditLogs,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
    retry: 1,
  });
};