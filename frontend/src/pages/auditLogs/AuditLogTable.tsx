/* Teaching guide: This file contains audit log table page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
// Renders audit rows, request states, the empty state, and pagination.
import {
  Alert,
  Box,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import SearchOffOutlinedIcon from "@mui/icons-material/SearchOffOutlined";
import type { AuditLogListResponse } from "../../api/auditLogApi";
import LoadingSpinner from "../../components/common/LoadingSpinner/LoadingSpinner";
import { formatAuditAction, formatAuditDateTime } from "./auditLogUtils";

type Props = {
  data?: AuditLogListResponse;
  loading: boolean;
  failed: boolean;
  page: number;
  onPage: (page: number) => void;
};

// This component receives prepared data and renders the feature-specific interface.
export default function AuditLogTable({
  data,
  loading,
  failed,
  page,
  onPage,
}: Props) {
  if (loading) return <LoadingSpinner message="Loading audit logs..." />;
  if (failed) return <Alert severity="error">Unable to load audit logs.</Alert>;

  return (
    <>
      <TableContainer className="audit-logs-page__table-container">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Company</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>IP Address</TableCell>
              <TableCell>Browser</TableCell>
              <TableCell>Details</TableCell>
              <TableCell>Timestamp</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.items.length ? (
              data.items.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell>
                    <Typography
                      component="strong"
                      className="audit-logs-page__company"
                    >
                      {log.company.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {log.user ? (
                      <Box className="audit-logs-page__user">
                        <Typography component="strong">
                          {log.user.name}
                        </Typography>
                        <Typography component="span">
                          {log.user.email}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography className="audit-logs-page__system-user">
                        System
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`audit-logs-page__action audit-logs-page__action--${log.action.toLowerCase()}`}
                    >
                      {formatAuditAction(log.action)}
                    </span>
                  </TableCell>
                  <TableCell>{log.ipAddress}</TableCell>
                  <TableCell>
                    <Typography
                      component="span"
                      className="audit-logs-page__browser"
                      title={log.browser}
                    >
                      {log.browser}
                    </Typography>
                  </TableCell>
                  <TableCell className="audit-logs-page__details">
                    {log.details || "—"}
                  </TableCell>
                  <TableCell>{formatAuditDateTime(log.timestamp)}</TableCell>
                </TableRow>
              ))
            ) : (
              <AuditLogEmptyRow />
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {(data?.totalPages ?? 0) > 1 && (
        <Box className="audit-logs-page__pagination">
          <Pagination
            page={page}
            count={data?.totalPages ?? 1}
            onChange={(_, selectedPage) => onPage(selectedPage)}
            color="primary"
          />
        </Box>
      )}
    </>
  );
}

function AuditLogEmptyRow() {
  return (
    <TableRow>
      <TableCell colSpan={7}>
        <Box className="audit-logs-page__empty">
          <SearchOffOutlinedIcon />
          <Typography component="h3">No audit logs found</Typography>
          <Typography component="p">
            New login, create, edit, delete and download activity will appear
            here.
          </Typography>
        </Box>
      </TableCell>
    </TableRow>
  );
}
