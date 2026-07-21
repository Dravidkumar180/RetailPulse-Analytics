/* Teaching guide: This file contains use audit logs application logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

import {
  keepPreviousData,
  useQuery,
} from "@tanstack/react-query";

import {
  getAuditLogs,
  // Defines the audit log filters type.
  type AuditLogFilters,
  // Defines the audit log list response type.
  type AuditLogListResponse,
} from "../api/auditLogApi";
// Imports the needed tools from ./useAuth.
import { useAuth } from "./useAuth";

// Runs audit logs query key logic.
export const auditLogsQueryKey = (
  filters: AuditLogFilters,
) => ["audit-logs", filters] as const;

// Runs use audit logs logic.
export const useAuditLogs = (
  filters: AuditLogFilters = {},
) => {
  const {
    isAuthenticated,
    isLoading: authLoading,
    user,
  } = useAuth();

  // Checks view audit logs.
  const canViewAuditLogs =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "COMPANY_ADMIN";

  // Returns the completed result to the caller.
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