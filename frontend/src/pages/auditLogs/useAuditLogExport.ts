/* Loads every matching audit page and creates a CSV download or printable report. */
import { useState } from "react";
import { getAuditLogs, type AuditLogFilters } from "../../api/auditLogApi";
import {
  auditResource,
  auditResourceId,
  auditStatus,
  formatAuditAction,
  formatAuditDateTime,
} from "./auditLogUtils";

// Exports all matching pages using the current filters.
export function useAuditLogExport(params: AuditLogFilters) {
  const [exporting, setExporting] = useState(false);
  // Collect every matching page, not just the rows currently visible.
  const loadExport = async () => {
    const first = await getAuditLogs({ ...params, page: 1, pageSize: 100 });
    const items = [...first.items];
    for (let p = 2; p <= first.totalPages; p++)
      items.push(
        ...(await getAuditLogs({ ...params, page: p, pageSize: 100 })).items,
      );
    return items;
  };
  // Quote CSV values so commas and quotation marks remain inside their cells.
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
  // Open a printable report; the browser print dialog can save it as PDF.
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
  return { exporting, exportCsv, exportPdf };
}

// Escape HTML characters before inserting event text into the printable report.
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
