/* Teaching guide: This file contains the audit logs page page.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Imports the needed tools from react.
import { useState } from "react";
// Imports the needed tools from @tanstack/react-query.
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
// Imports the needed tools from @mui/icons-material/HistoryOutlined.
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
// Imports the needed tools from @mui/icons-material/RefreshOutlined.
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
// Imports the needed tools from @mui/icons-material/SearchOffOutlined.
import SearchOffOutlinedIcon from "@mui/icons-material/SearchOffOutlined";

import {
  getAuditLogs,
  // Defines the audit action type.
  type AuditAction,
} from "../../api/auditLogApi";
// Imports the needed tools from ../../components/common/Button/Button.
import Button from "../../components/common/Button/Button";
// Imports the needed tools from ../../components/common/LoadingSpinner/LoadingSpinner.
import LoadingSpinner from "../../components/common/LoadingSpinner/LoadingSpinner";
// Imports the needed tools from ../../components/common/PageHeader/PageHeader.
import PageHeader from "../../components/common/PageHeader/PageHeader";

// Loads ./AuditLogsPage.css styles or setup.
import "./AuditLogsPage.css";

// Runs format date time logic.
const formatDateTime = (date: string): string => {
  // Returns the completed result to the caller.
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
};

// Runs format action logic.
const formatAction = (action: string): string => {
  // Returns the completed result to the caller.
  return action
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

// Gets action class name.
const getActionClassName = (action: AuditAction): string => {
  // Returns the completed result to the caller.
  return `audit-logs-page__action audit-logs-page__action--${action.toLowerCase()}`;
};

// Shows the audit logs page.
const AuditLogsPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState<AuditAction | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Stores audit logs query for the steps below.
  const auditLogsQuery = useQuery({
    queryKey: [
      "audit-logs",
      page,
      search,
      action,
      startDate,
      endDate,
    ],
    queryFn: () =>
      getAuditLogs({
        page,
        pageSize: 10,
        search,
        action: action || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
  });

  // Builds the visible interface below.
  return (
    <Box className="audit-logs-page">
      <PageHeader
        title="Audit Logs"
        subtitle="Review authentication and company account activities."
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
          placeholder="Search user, company or browser"
          value={search}
          onChange={(event) => {
            // Updates the page or stored state with this result.
            setSearch(event.target.value);
            // Updates the page or stored state with this result.
            setPage(1);
          }}
        />

        <FormControl>
          <InputLabel id="audit-action-label">
            Action
          </InputLabel>

          <Select
            labelId="audit-action-label"
            label="Action"
            value={action}
            onChange={(event) => {
              // Updates the page or stored state with this result.
              setAction(
                event.target.value as AuditAction | "",
              );
              // Updates the page or stored state with this result.
              setPage(1);
            }}
          >
            <MenuItem value="">All Actions</MenuItem>

            <MenuItem value="COMPANY_REGISTERED">
              Company Registered
            </MenuItem>

            <MenuItem value="USER_LOGIN">
              User Login
            </MenuItem>

            <MenuItem value="USER_LOGOUT">
              User Logout
            </MenuItem>

            <MenuItem value="PASSWORD_CHANGED">
              Password Changed
            </MenuItem>
            {[
              "SALE_CREATED",
              "SALE_UPDATED",
              "SALE_DELETED",
              "INVENTORY_UPDATED",
              "PRODUCT_OUT_OF_STOCK",
            ].map((saleAction) => (
              <MenuItem key={saleAction} value={saleAction}>
                {formatAction(saleAction)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(event) => {
            // Updates the page or stored state with this result.
            setStartDate(event.target.value);
            // Updates the page or stored state with this result.
            setPage(1);
          }}
          slotProps={{
  inputLabel: {
    shrink: true,
  },
}}
        />

        <TextField
          label="End Date"
          type="date"
          value={endDate}
          onChange={(event) => {
            // Updates the page or stored state with this result.
            setEndDate(event.target.value);
            // Updates the page or stored state with this result.
            setPage(1);
          }}
          slotProps={{
  inputLabel: {
    shrink: true,
  },
}}
        />
      </Box>

      {auditLogsQuery.isLoading ? (
        <LoadingSpinner message="Loading audit logs..." />
      ) : auditLogsQuery.isError ? (
        <Alert severity="error">
          Unable to load audit logs.
        </Alert>
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

                      <TableCell>{log.details ?? "—"}</TableCell>

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
                          <Typography
                            component="span"
                            className="audit-logs-page__system-user"
                          >
                            System
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        <span
                          className={getActionClassName(
                            log.action,
                          )}
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

                      <TableCell>
                        {formatDateTime(log.timestamp)}
                      </TableCell>
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
                          No activities match the selected filters.
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
                onChange={(_, selectedPage) =>
                  // Updates the page or stored state with this result.
                  setPage(selectedPage)
                }
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
