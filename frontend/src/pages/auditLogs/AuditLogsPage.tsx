import React, { useDeferredValue, useState } from "react";
import {
  Alert,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import TodayOutlinedIcon from "@mui/icons-material/TodayOutlined";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  clearOldAuditLogs,
  getAuditLogs,
  getAuditLogSummary,
  type AuditLog,
} from "../../api/auditLogApi";
import { getCompanyUsers } from "../../api/userApi";
import Button from "../../components/common/Button/Button";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import AuditLogFilters, { type AuditFilters } from "./AuditLogFilters";
import AuditLogTable from "./AuditLogTable";
import {
  auditResource,
  auditResourceId,
  auditStatus,
  formatAuditAction,
  formatAuditDateTime,
} from "./auditLogUtils";
import "./AuditLogsPage.css";

const initialFilters: AuditFilters = {
  search: "",
  action: "",
  userId: "",
  resourceType: "",
  status: "",
  startDate: "",
  endDate: "",
  sortOrder: "newest",
};
export default function AuditLogsPage() {
  const client = useQueryClient(),
    [page, setPage] = useState(1),
    pageSize = 10,
    [filters, setFilters] = useState(initialFilters),
    [selected, setSelected] = useState<AuditLog | null>(null),
    [exporting, setExporting] = useState(false),
    [confirmClear, setConfirmClear] = useState(false);
  const deferredSearch = useDeferredValue(filters.search);
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
  const logs = useQuery({
    queryKey: ["audit-logs", params],
    queryFn: () => getAuditLogs(params),
    refetchInterval: 15000,
  });
  const summary = useQuery({
    queryKey: ["audit-log-summary"],
    queryFn: getAuditLogSummary,
    refetchInterval: 15000,
  });
  const users = useQuery({
    queryKey: ["audit-log-users"],
    queryFn: () => getCompanyUsers({ page: 1, pageSize: 100 }),
  });
  const clearMutation = useMutation({
    mutationFn: clearOldAuditLogs,
    onSuccess: () => {
      setConfirmClear(false);
      client.invalidateQueries({ queryKey: ["audit-logs"] });
      client.invalidateQueries({ queryKey: ["audit-log-summary"] });
    },
  });
  const change = <K extends keyof AuditFilters>(
    key: K,
    value: AuditFilters[K],
  ) => {
    setFilters((old) => ({ ...old, [key]: value }));
    setPage(1);
  };
  const loadExport = async () => {
    const first = await getAuditLogs({ ...params, page: 1, pageSize: 100 });
    const items = [...first.items];
    for (let p = 2; p <= first.totalPages; p++)
      items.push(
        ...(await getAuditLogs({ ...params, page: p, pageSize: 100 })).items,
      );
    return items;
  };
  const exportCsv = async () => {
    setExporting(true);
    try {
      const items = await loadExport(),
        esc = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`,
        rows = [
          [
            "User",
            "Action",
            "Resource",
            "Resource ID",
            "Description",
            "IP Address",
            "User Agent",
            "Timestamp",
            "Status",
          ]
            .map(esc)
            .join(","),
          ...items.map((l) =>
            [
              l.user?.name ?? "System",
              l.action,
              auditResource(l.action),
              auditResourceId(l) ?? "",
              l.details ?? "",
              l.ipAddress,
              l.browser,
              l.timestamp,
              auditStatus(l),
            ]
              .map(esc)
              .join(","),
          ),
        ];
      const blob = new Blob(["\uFEFF" + rows.join("\n")], {
          type: "text/csv;charset=utf-8",
        }),
        a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setExporting(false);
    }
  };
  const exportPdf = async () => {
    const popup = window.open("", "audit-report");
    if (!popup) return;
    setExporting(true);
    try {
      const items = await loadExport();
      popup.document.write(
        `<title>Audit Logs</title><style>body{font:12px Arial;padding:24px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:7px;text-align:left}th{background:#f3f4f6}</style><h1>Audit Logs</h1><p>Exported ${new Date().toLocaleString()}</p><table><tr><th>User</th><th>Action</th><th>Resource</th><th>Description</th><th>IP</th><th>Timestamp</th><th>Status</th></tr>${items.map((l) => `<tr><td>${safe(l.user?.name ?? "System")}</td><td>${safe(formatAuditAction(l.action))}</td><td>${safe(auditResource(l.action))}</td><td>${safe(l.details ?? "")}</td><td>${safe(l.ipAddress)}</td><td>${safe(formatAuditDateTime(l.timestamp))}</td><td>${auditStatus(l)}</td></tr>`).join("")}</table>`,
      );
      popup.document.close();
      popup.print();
    } finally {
      setExporting(false);
    }
  };
  const stats = summary.data ?? {
    total: 0,
    successful: 0,
    failed: 0,
    today: 0,
  };
  return (
    <Box className="audit-logs-page">
      <PageHeader
        title="Audit Logs & Activity Monitoring"
        subtitle="Review user activities and system events across your company."
        icon={<HistoryOutlinedIcon />}
        actions={
          <Box className="audit-logs-page__header-actions">
            <span className="audit-logs-page__live">
              <i />
              Live updates
            </span>
            <Button
              loading={exporting}
              variant="outlined"
              startIcon={<DownloadOutlinedIcon />}
              onClick={exportCsv}
            >
              Export CSV
            </Button>
            <Button
              loading={exporting}
              color="error"
              variant="outlined"
              startIcon={<DownloadOutlinedIcon />}
              onClick={exportPdf}
            >
              Export PDF
            </Button>
            <Button
              color="error"
              variant="outlined"
              startIcon={<DeleteOutlineIcon />}
              onClick={() => setConfirmClear(true)}
            >
              Clear logs
            </Button>
          </Box>
        }
      />
      <AuditLogFilters
        {...filters}
        users={users.data?.items ?? []}
        onChange={change}
        onClear={() => {
          setFilters(initialFilters);
          setPage(1);
        }}
      />
      <Box className="audit-logs-page__stats">
        <Stat
          icon={<HistoryOutlinedIcon />}
          label="Total Logs"
          value={stats.total}
        />
        <Stat
          icon={<CheckCircleOutlineIcon />}
          label="Successful"
          value={stats.successful}
          tone="green"
        />
        <Stat
          icon={<ErrorOutlineIcon />}
          label="Failed"
          value={stats.failed}
          tone="red"
        />
        <Stat
          icon={<TodayOutlinedIcon />}
          label="Today's Logs"
          value={stats.today}
        />
      </Box>
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
          <Timeline logs={logs.data?.items.slice(0, 7) ?? []} />
        </Box>
        {selected && (
          <AuditDetails log={selected} onClose={() => setSelected(null)} />
        )}
      </Box>
      <Dialog open={confirmClear} onClose={() => setConfirmClear(false)}>
        <DialogTitle>Clear old audit logs?</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            This permanently deletes audit logs older than 90 days for your
            company. This action cannot be undone. The clearing action itself
            will be recorded.
          </Alert>
          {clearMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Unable to clear old logs.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setConfirmClear(false)}>
            Cancel
          </Button>
          <Button
            color="error"
            loading={clearMutation.isPending}
            onClick={() => clearMutation.mutate()}
          >
            Clear logs
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function Stat({
  icon,
  label,
  value,
  tone = "blue",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <Box className={`audit-logs-page__stat audit-logs-page__stat--${tone}`}>
      <i>{icon}</i>
      <span>
        {label}
        <strong>{value.toLocaleString()}</strong>
      </span>
    </Box>
  );
}
function Timeline({ logs }: { logs: AuditLog[] }) {
  return (
    <Box className="audit-logs-page__timeline">
      <strong>Recent Activity Timeline</strong>
      <Box>
        {logs.map((log) => (
          <article key={log.id}>
            <i />
            <b>{formatAuditAction(log.action)}</b>
            <span>{auditResource(log.action)}</span>
            <small>
              {new Date(log.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </small>
          </article>
        ))}
      </Box>
    </Box>
  );
}
const safe = (v: string) =>
  v.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[c]!,
  );
function AuditDetails({
  log,
  onClose,
}: {
  log: AuditLog;
  onClose: () => void;
}) {
  return (
    <aside className="audit-logs-page__side-details">
      <Box className="audit-logs-page__side-heading">
        <strong>Log Details</strong>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      <section>
        <b>Overview</b>
        <Detail label="Time" value={formatAuditDateTime(log.timestamp)} />
        <Detail
          label="User"
          value={`${log.user?.name ?? "System"}${log.user?.email ? ` · ${log.user.email}` : ""}`}
        />
        <Detail label="Action" value={formatAuditAction(log.action)} />
        <Detail label="Resource" value={auditResource(log.action)} />
        <Detail
          label="Resource ID"
          value={auditResourceId(log) ?? "Not recorded"}
        />
        <Detail label="Status" value={auditStatus(log)} />
        <Detail label="IP Address" value={log.ipAddress} />
        <Detail label="User Agent" value={log.browser} />
      </section>
      <section>
        <b>Description</b>
        <Typography>{log.details || "No description was recorded."}</Typography>
      </section>
        <section>
          <b>Changes</b>
          <ChangeComparison before={log.beforeValues} after={log.afterValues} />
      </section>
      <section>
        <b>Additional Info</b>
        <Detail label="Company" value={log.company.name} />
        <Detail label="Log ID" value={log.id} />
        <Detail label="Created At" value={formatAuditDateTime(log.timestamp)} />
      </section>
    </aside>
  );
}
function ChangeComparison({ before, after }: { before?: Record<string, unknown> | null; after?: Record<string, unknown> | null }) {
  const keys = Array.from(new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]));
  if (!keys.length) return <Typography className="audit-logs-page__no-changes">No structured changes were captured for this older event.</Typography>;
  const oldValues = Object.fromEntries(keys.map(key => [formatAuditAction(key), before?.[key] ?? null]));
  const newValues = Object.fromEntries(keys.map(key => [formatAuditAction(key), after?.[key] ?? null]));
  return <Box className="audit-logs-page__change-json">
    <div><strong>Before (Old Values)</strong><pre>{JSON.stringify(oldValues, null, 2)}</pre></div>
    <div><strong>After (New Values)</strong><pre>{JSON.stringify(newValues, null, 2)}</pre></div>
  </Box>;
}
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <Box className="audit-logs-page__detail-row">
      <Typography variant="caption">{label}</Typography>
      <Typography title={value}>{value}</Typography>
    </Box>
  );
}
