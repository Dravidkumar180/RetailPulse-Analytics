/* Shows the old and new values recorded for an audit event. */
import { Box, Typography } from "@mui/material";
import { formatAuditAction } from "./auditLogUtils";

export default function AuditLogChanges({
  before,
  after,
}: {
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}) {
  // Include fields found in either version so added and removed values both appear.
  const keys = Array.from(
    new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]),
  );
  if (!keys.length)
    return (
      <Typography className="audit-logs-page__no-changes">
        No structured changes were captured for this older event.
      </Typography>
    );
  // Use readable field names in the before-and-after JSON display.
  const oldValues = Object.fromEntries(
    keys.map((key) => [formatAuditAction(key), before?.[key] ?? null]),
  );
  const newValues = Object.fromEntries(
    keys.map((key) => [formatAuditAction(key), after?.[key] ?? null]),
  );
  return (
    <Box className="audit-logs-page__change-json">
      <div>
        <strong>Before (Old Values)</strong>
        <pre>{JSON.stringify(oldValues, null, 2)}</pre>
      </div>
      <div>
        <strong>After (New Values)</strong>
        <pre>{JSON.stringify(newValues, null, 2)}</pre>
      </div>
    </Box>
  );
}
