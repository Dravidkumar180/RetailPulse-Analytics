/* Teaching guide: This file contains audit logs page page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
// Coordinates audit-log filters, API requests, and presentation components.
import { useState } from "react";
import { Box } from "@mui/material";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import { useQuery } from "@tanstack/react-query";
import {
  getAuthenticationSummary,
  getAuditLogs,
  type AuditAction,
} from "../../api/auditLogApi";
import Button from "../../components/common/Button/Button";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import AuditLogFilters from "./AuditLogFilters";
import AuditLogTable from "./AuditLogTable";
import AuthenticationMonitor from "./AuthenticationMonitor";
import "./AuditLogsPage.css";

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState<AuditAction | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Authentication events are excluded from the main table unless selected.
  const auditLogsQuery = useQuery({
    queryKey: ["audit-logs", page, search, action, startDate, endDate],
    queryFn: () =>
      getAuditLogs({
        page,
        pageSize: 15,
        search: search || undefined,
        action: action || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        excludeAuthentication: !action,
      }),
  });
  const authenticationSummaryQuery = useQuery({
    queryKey: ["audit-authentication-summary"],
    queryFn: getAuthenticationSummary,
  });

  // Every filter change returns the table to its first page.
  const updateFilter = (update: () => void) => {
    update();
    setPage(1);
  };

  return (
    <Box className="audit-logs-page">
      <PageHeader
        title="Audit Logs"
        subtitle="A complete history of authentication and company activity."
        icon={<HistoryOutlinedIcon />}
        actions={
          <Button
            variant="outlined"
            startIcon={<RefreshOutlinedIcon />}
            onClick={() => auditLogsQuery.refetch()}
          >
            Refresh
          </Button>
        }
      />

      <AuditLogFilters
        search={search}
        action={action}
        startDate={startDate}
        endDate={endDate}
        onSearch={(value) => updateFilter(() => setSearch(value))}
        onAction={(value) => updateFilter(() => setAction(value))}
        onStartDate={(value) => updateFilter(() => setStartDate(value))}
        onEndDate={(value) => updateFilter(() => setEndDate(value))}
      />

      <AuthenticationMonitor
        summaries={authenticationSummaryQuery.data}
        loading={authenticationSummaryQuery.isLoading}
        failed={authenticationSummaryQuery.isError}
        onRefresh={() => authenticationSummaryQuery.refetch()}
      />

      <AuditLogTable
        data={auditLogsQuery.data}
        loading={auditLogsQuery.isLoading}
        failed={auditLogsQuery.isError}
        page={page}
        onPage={setPage}
      />
    </Box>
  );
}
