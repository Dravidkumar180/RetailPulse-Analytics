/* Shows the selected audit event, including its user, description, changes, and company. */
import { Box, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { AuditLog } from "../../api/auditLogApi";
import AuditLogChanges from "./AuditLogChanges";
import {
  auditResource,
  auditResourceId,
  auditStatus,
  formatAuditAction,
  formatAuditDateTime,
} from "./auditLogUtils";

export default function AuditLogDetails({
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
      {/* Overview identifies the action, the user, and where the request came from. */}
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
        <AuditLogChanges before={log.beforeValues} after={log.afterValues} />
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
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <Box className="audit-logs-page__detail-row">
      <Typography variant="caption">{label}</Typography>
      <Typography title={value}>{value}</Typography>
    </Box>
  );
}
