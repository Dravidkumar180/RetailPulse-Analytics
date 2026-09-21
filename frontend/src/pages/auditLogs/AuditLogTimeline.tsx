/* Shows the recent events passed in from the current audit results. */
import { Box } from "@mui/material";
import type { AuditLog } from "../../api/auditLogApi";
import { auditResource, formatAuditAction } from "./auditLogUtils";

export default function AuditLogTimeline({ logs }: { logs: AuditLog[] }) {
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
