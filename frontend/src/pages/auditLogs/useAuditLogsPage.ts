/* Keeps audit filters and selection together with queries and the clear-logs action. */
import { useDeferredValue, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  clearOldAuditLogs,
  getAuditLogs,
  getAuditLogSummary,
  type AuditLog,
} from "../../api/auditLogApi";
import { getCompanyUsers } from "../../api/userApi";
import type { AuditFilters } from "./AuditLogFilters";
import { initialFilters } from "./auditLogConstants";
import { useAuditLogExport } from "./useAuditLogExport";

export function useAuditLogsPage() {
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [filters, setFilters] = useState(initialFilters);
  const [selected, setSelected] = useState<AuditLog | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  // Let the search input update before React works on the matching results.
  const deferredSearch = useDeferredValue(filters.search);
  // Send filled-in filters; undefined values leave a filter unset.
  const params = {
    page,
    pageSize,
    search: deferredSearch || undefined,
    action: filters.action || undefined,
    userId: filters.userId || undefined,
    resourceType: filters.resourceType || undefined,
    status: filters.status || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    sortOrder: filters.sortOrder,
  };
  // Fetch the current page and refresh it every 15 seconds.
  const logs = useQuery({
    queryKey: ["audit-logs", params],
    queryFn: () => getAuditLogs(params),
    refetchInterval: 15000,
  });
  // Fetch the overall counts independently of the current table filters.
  const summary = useQuery({
    queryKey: ["audit-log-summary"],
    queryFn: getAuditLogSummary,
    refetchInterval: 15000,
  });
  // Load user choices for the filter dropdown.
  const users = useQuery({
    queryKey: ["audit-log-users"],
    queryFn: () => getCompanyUsers({ page: 1, pageSize: 100 }),
  });
  // After clearing old logs, close the dialog and reload the list and counts.
  const clearMutation = useMutation({
    mutationFn: clearOldAuditLogs,
    onSuccess: () => {
      setConfirmClear(false);
      client.invalidateQueries({ queryKey: ["audit-logs"] });
      client.invalidateQueries({ queryKey: ["audit-log-summary"] });
    },
  });
  // Update one filter and restart pagination.
  const change = <K extends keyof AuditFilters>(
    key: K,
    value: AuditFilters[K],
  ) => {
    setFilters((old) => ({ ...old, [key]: value }));
    setPage(1);
  };
  const stats = summary.data ?? {
    total: 0,
    successful: 0,
    failed: 0,
    today: 0,
  };
  const exports = useAuditLogExport(params);
  // Restore the default filters and return to the first page.
  function resetFilters() {
    setFilters(initialFilters);
    setPage(1);
  }
  return {
    page,
    setPage,
    pageSize,
    filters,
    selected,
    setSelected,
    confirmClear,
    setConfirmClear,
    logs,
    users,
    clearMutation,
    change,
    stats,
    resetFilters,
    ...exports,
  };
}
