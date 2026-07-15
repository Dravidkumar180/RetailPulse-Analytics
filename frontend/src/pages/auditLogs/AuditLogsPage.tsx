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
  getAuditLogs,
  type AuditAction,
} from "../../api/auditLogApi";
import Button from "../../components/common/Button/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner/LoadingSpinner";
import PageHeader from "../../components/common/PageHeader/PageHeader";

import "./AuditLogsPage.css";

const formatDateTime = (date: string): string => {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
};

const formatAction = (action: string): string => {
  return action
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const getActionClassName = (action: AuditAction): string => {
  return `audit-logs-page__action audit-logs-page__action--${action.toLowerCase()}`;
};

const AuditLogsPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState<AuditAction | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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
            setSearch(event.target.value);
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
              setAction(
                event.target.value as AuditAction | "",
              );
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
          </Select>
        </FormControl>

        <TextField
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(event) => {
            setStartDate(event.target.value);
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
            setEndDate(event.target.value);
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
                    <TableCell colSpan={6}>
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