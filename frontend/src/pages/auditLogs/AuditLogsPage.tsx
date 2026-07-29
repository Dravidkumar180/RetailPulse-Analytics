import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import SearchOffOutlinedIcon from "@mui/icons-material/SearchOffOutlined";

import {
  getAuthenticationSummary,
  getAuditLogs,
  type AuthenticationSummary,
  type AuditAction,
} from "../../api/auditLogApi";
import Button from "../../components/common/Button/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner/LoadingSpinner";
import PageHeader from "../../components/common/PageHeader/PageHeader";

import "./AuditLogsPage.css";

const auditActions: AuditAction[] = [
  "COMPANY_REGISTERED",
  "USER_LOGIN",
  "USER_LOGOUT",
  "PASSWORD_CHANGED",
  "USER_INVITED",
  "USER_UPDATED",
  "PROFILE_UPDATED",
  "SETTINGS_UPDATED",
  "CATEGORY_CREATED",
  "CATEGORY_UPDATED",
  "CATEGORY_DELETED",
  "PRODUCT_CREATED",
  "PRODUCT_UPDATED",
  "PRODUCT_DELETED",
  "PRODUCT_ACTIVATED",
  "PRODUCT_DEACTIVATED",
  "SALE_CREATED",
  "SALE_UPDATED",
  "SALE_DELETED",
  "INVENTORY_UPDATED",
  "STOCK_ADDED",
  "STOCK_REMOVED",
  "STOCK_ADJUSTED",
  "REORDER_LEVEL_UPDATED",
  "PRODUCT_LOW_STOCK",
  "PRODUCT_OUT_OF_STOCK",
  "REPORT_EXPORTED",
  "CUSTOMER_CREATED",
  "CUSTOMER_UPDATED",
  "CUSTOMER_DELETED",
  "CUSTOMER_ACTIVATED",
  "CUSTOMER_DEACTIVATED",
  "CUSTOMER_STATUS_CHANGED",
  "CUSTOMER_EXPORTED",
  "FORECAST_GENERATED",
  "FORECAST_EXPORTED",
  "FORECAST_REFRESHED",
  "INVENTORY_RECOMMENDATION_GENERATED",
];

const formatDateTime = (date: string): string =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));

const formatAction = (action: string): string =>
  action
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const AuditLogsPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState<AuditAction | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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

  const resetPage = () => setPage(1);

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

      <Box className="audit-logs-page__filters">
        <TextField
          label="Search"
          placeholder="User, company, details, IP or browser"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            resetPage();
          }}
        />
        <FormControl>
          <InputLabel id="audit-action-label">Action</InputLabel>
          <Select
            labelId="audit-action-label"
            label="Action"
            value={action}
            onChange={(event) => {
              setAction(event.target.value as AuditAction | "");
              resetPage();
            }}
          >
            <MenuItem value="">All Actions</MenuItem>
            {auditActions.map((auditAction) => (
              <MenuItem key={auditAction} value={auditAction}>
                {formatAction(auditAction)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(event) => {
            setStartDate(event.target.value);
            resetPage();
          }}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="End Date"
          type="date"
          value={endDate}
          onChange={(event) => {
            setEndDate(event.target.value);
            resetPage();
          }}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Box>

      <Box className="audit-logs-page__auth-section">
        <Box className="audit-logs-page__auth-heading">
          <Box>
            <Typography component="h2">Authentication Monitor</Typography>
            <Typography component="p">
              Login and logout events are retained individually and summarized
              here to keep the activity table readable.
            </Typography>
          </Box>
          <Button
            size="small"
            variant="outlined"
            onClick={() => authenticationSummaryQuery.refetch()}
          >
            Refresh summary
          </Button>
        </Box>
        {authenticationSummaryQuery.isError ? (
          <Alert severity="error">
            Unable to load authentication totals.
          </Alert>
        ) : (
          <Box className="audit-logs-page__auth-grid">
            {(authenticationSummaryQuery.data ?? []).map(
              (summary: AuthenticationSummary) => (
                <Box
                  className="audit-logs-page__auth-card"
                  key={summary.userId}
                >
                  <Box className="audit-logs-page__auth-user">
                    <Box>{summary.name.charAt(0).toUpperCase()}</Box>
                    <Box>
                      <Typography component="strong">
                        {summary.name}
                      </Typography>
                      <Typography component="span">
                        {summary.email}
                      </Typography>
                    </Box>
                    <span
                      className={`audit-logs-page__auth-state audit-logs-page__auth-state--${summary.state.toLowerCase()}`}
                    >
                      {summary.state === "SIGNED_IN"
                        ? "Signed in"
                        : "Signed out"}
                    </span>
                  </Box>
                  <Box className="audit-logs-page__auth-counts">
                    <Box>
                      <Typography component="strong">
                        {summary.loginCount}
                      </Typography>
                      <Typography component="span">Total logins</Typography>
                      <Typography component="small">
                        Last:{" "}
                        {summary.lastLogin
                          ? formatDateTime(summary.lastLogin)
                          : "Never"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography component="strong">
                        {summary.logoutCount}
                      </Typography>
                      <Typography component="span">Total logouts</Typography>
                      <Typography component="small">
                        Last:{" "}
                        {summary.lastLogout
                          ? formatDateTime(summary.lastLogout)
                          : "Never"}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ),
            )}
            {!authenticationSummaryQuery.isLoading &&
              !authenticationSummaryQuery.data?.length && (
                <Typography className="audit-logs-page__auth-empty">
                  No login or logout activity has been recorded.
                </Typography>
              )}
          </Box>
        )}
      </Box>

      {auditLogsQuery.isLoading ? (
        <LoadingSpinner message="Loading audit logs..." />
      ) : auditLogsQuery.isError ? (
        <Alert severity="error">Unable to load audit logs.</Alert>
      ) : (
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
                {auditLogsQuery.data?.items.length ? (
                  auditLogsQuery.data.items.map((log) => (
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
                          {formatAction(log.action)}
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
                      <TableCell>{formatDateTime(log.timestamp)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Box className="audit-logs-page__empty">
                        <SearchOffOutlinedIcon />
                        <Typography component="h3">
                          No audit logs found
                        </Typography>
                        <Typography component="p">
                          New login, create, edit, delete and download activity
                          will appear here.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {(auditLogsQuery.data?.totalPages ?? 0) > 1 && (
            <Box className="audit-logs-page__pagination">
              <Pagination
                page={page}
                count={auditLogsQuery.data?.totalPages ?? 1}
                onChange={(_, selectedPage) => setPage(selectedPage)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default AuditLogsPage;
