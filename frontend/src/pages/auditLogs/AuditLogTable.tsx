import {
  Alert,
  Box,
  Pagination,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import SearchOffOutlinedIcon from "@mui/icons-material/SearchOffOutlined";
import type { AuditLog, AuditLogListResponse } from "../../api/auditLogApi";
import {
  auditResource,
  auditResourceId,
  auditStatus,
  formatAuditAction,
  formatAuditDateTime,
} from "./auditLogUtils";
type Props = {
  data?: AuditLogListResponse;
  loading: boolean;
  failed: boolean;
  page: number;
  pageSize: number;
  onPage: (p: number) => void;
  onSelect: (l: AuditLog) => void;
  onRetry: () => void;
};
export default function AuditLogTable({
  data,
  loading,
  failed,
  page,
  pageSize,
  onPage,
  onSelect,
  onRetry,
}: Props) {
  if (failed)
    return (
      <Alert severity="error" action={<button onClick={onRetry}>Retry</button>}>
        Failed to load audit logs. Please try again.
      </Alert>
    );
  return (
    <Box className="audit-logs-page__table-card">
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {[
                "User",
                "Action",
                "Resource",
                "Resource ID",
                "Description",
                "IP Address",
                "Timestamp",
                "Status",
              ].map((h) => (
                <TableCell key={h}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 7 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data?.items.length ? (
              data.items.map((log) => (
                <TableRow
                  hover
                  tabIndex={0}
                  className="audit-logs-page__row"
                  key={log.id}
                  onClick={() => onSelect(log)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSelect(log);
                  }}
                >
                  <TableCell>
                    <Box className="audit-logs-page__user">
                      <strong>{log.user?.name ?? "System"}</strong>
                      <span>{log.user?.email ?? "Automated event"}</span>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`audit-logs-page__action audit-logs-page__action--${log.action.toLowerCase()}`}
                    >
                      {formatAuditAction(log.action)}
                    </span>
                  </TableCell>
                  <TableCell>{auditResource(log.action)}</TableCell>
                  <TableCell>{auditResourceId(log) ?? "—"}</TableCell>
                  <TableCell className="audit-logs-page__details">
                    {log.details || "—"}
                  </TableCell>
                  <TableCell>{log.ipAddress}</TableCell>
                  <TableCell>{formatAuditDateTime(log.timestamp)}</TableCell>
                  <TableCell>
                    <span
                      className={`audit-logs-page__status audit-logs-page__status--${auditStatus(log).toLowerCase()}`}
                    >
                      {auditStatus(log)}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8}>
                  <Box className="audit-logs-page__empty">
                    <SearchOffOutlinedIcon />
                    <Typography component="h3">No activity found</Typography>
                    <Typography>
                      No activity matches the selected filters.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box className="audit-logs-page__pagination">
        <span>
          Showing {data?.totalItems ? (page - 1) * pageSize + 1 : 0}–
          {Math.min(page * pageSize, data?.totalItems ?? 0)} of{" "}
          {data?.totalItems ?? 0} logs
        </span>
        <Pagination
          page={page}
          count={data?.totalPages || 1}
          onChange={(_, p) => onPage(p)}
          color="primary"
        />
      </Box>
    </Box>
  );
}
