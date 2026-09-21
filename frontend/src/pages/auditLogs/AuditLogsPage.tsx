/* Connects audit page data to the filters, statistics, table, timeline, and dialogs. */
import { Box } from "@mui/material";
import AuditLogFilters from "./AuditLogFilters";
import AuditLogTable from "./AuditLogTable";
import AuditLogsHeader from "./AuditLogsHeader";
import AuditLogStats from "./AuditLogStats";
import AuditLogTimeline from "./AuditLogTimeline";
import AuditLogDetails from "./AuditLogDetails";
import ClearAuditLogsDialog from "./ClearAuditLogsDialog";
import { useAuditLogsPage } from "./useAuditLogsPage";
import "./AuditLogsPage.css";

export default function AuditLogsPage() {
  const {
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
    exporting,
    exportCsv,
    exportPdf,
  } = useAuditLogsPage();
  return (
    <Box className="audit-logs-page">
      <AuditLogsHeader
        exporting={exporting}
        exportCsv={exportCsv}
        exportPdf={exportPdf}
        onClear={() => setConfirmClear(true)}
      />
      <AuditLogFilters
        {...filters}
        users={users.data?.items ?? []}
        onChange={change}
        onClear={resetFilters}
      />
      <AuditLogStats stats={stats} />
      <Box
        className={`audit-logs-page__workspace ${selected ? "audit-logs-page__workspace--details" : ""}`}
      >
        <Box>
          <Box className="audit-logs-page__section-title">
            <strong>Audit Logs</strong>
            <span>{logs.data?.totalItems ?? 0} records found</span>
          </Box>
          <AuditLogTable
            data={logs.data}
            loading={logs.isLoading || (logs.isFetching && !logs.data)}
            failed={logs.isError}
            page={page}
            pageSize={pageSize}
            onPage={setPage}
            onSelect={setSelected}
            onRetry={() => logs.refetch()}
          />
          <AuditLogTimeline logs={logs.data?.items.slice(0, 7) ?? []} />
        </Box>
        {selected && (
          <AuditLogDetails log={selected} onClose={() => setSelected(null)} />
        )}
      </Box>
      <ClearAuditLogsDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        failed={clearMutation.isError}
        loading={clearMutation.isPending}
        onConfirm={() => clearMutation.mutate()}
      />
    </Box>
  );
}
