import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from "@mui/material";
import {
  AssessmentOutlined,
  Inventory2Outlined,
  PeopleOutlined,
  TrendingUp,
  SwapVert,
  Download,
  Add,
  Refresh,
  Schedule,
  History,
  ShieldOutlined,
} from "@mui/icons-material";
import api from "../../api/axiosInstance";
import { useAuth } from "../../hooks/useAuth";
import "./ReportsPage.css";

type Filters = Record<string, string>;
type Run = {
  id: string;
  name: string;
  report_type: string;
  generated_by: string;
  created_at: string;
  filters: Filters;
  context: Record<string, string>;
  columns: string[];
  rows?: Record<string, string | number | null>[];
  total: number;
  format: string;
  status: string;
  error?: string;
  delivery_status?: string;
};
type ScheduleRecord = {
  id?: string;
  name: string;
  report_type: string;
  filters: Filters;
  format: string;
  frequency: string;
  execution_time: string;
  timezone: string;
  weekday: number;
  month_day: number;
  recipients: string[];
  active: boolean;
  period: string;
  next_run?: string;
  last_run?: string;
  last_report?: Run;
};
type Options = {
  products: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  customers: { id: string; name: string }[];
  users: { id: string; name: string }[];
  brands: string[];
  company: string;
};
const types = [
  {
    id: "sales",
    name: "Sales Report",
    description: "Transactions, revenue and order details",
    icon: AssessmentOutlined,
    color: "green",
  },
  {
    id: "inventory",
    name: "Inventory Report",
    description: "Stock availability, value and reorder levels",
    icon: Inventory2Outlined,
    color: "orange",
  },
  {
    id: "customer",
    name: "Customer Report",
    description: "Customer details and purchase analysis",
    icon: PeopleOutlined,
    color: "purple",
  },
  {
    id: "product_performance",
    name: "Product Performance Report",
    description: "Sales performance and product revenue",
    icon: TrendingUp,
    color: "purple",
  },
  {
    id: "stock_movement",
    name: "Stock Movement Report",
    description: "Stock in, stock out and adjustment history",
    icon: SwapVert,
    color: "green",
  },
];
const clean = (filters: Filters) =>
  Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
const applicable = (type: string, filters: Filters) =>
  clean(
    Object.fromEntries(
      Object.entries(filters).filter(
        ([k]) =>
          !(
            type === "inventory" &&
            ["customer_id", "sales_status", "user_id"].includes(k)
          ) &&
          !(
            type === "stock_movement" &&
            ["customer_id", "sales_status", "stock_status"].includes(k)
          ) &&
          !(
            !["inventory", "stock_movement"].includes(type) &&
            k === "stock_status"
          ),
      ),
    ),
  );
const errorMessage = (error: unknown): string => {
  const e = error as {
    response?: {
      data?: {
        detail?: unknown;
        message?: string;
        errors?: Record<string, string[]>;
      };
    };
  };
  const fieldErrors = e.response?.data?.errors;
  if (fieldErrors && Object.keys(fieldErrors).length) {
    return Object.entries(fieldErrors)
      .map(([field, messages]) => `${field.replaceAll("_", " ")}: ${messages.join("; ")}`)
      .join("\n");
  }
  const detail = e.response?.data?.detail;
  return typeof detail === "string"
    ? detail
    : Array.isArray(detail)
      ? detail.map((x) => x.msg).join("; ")
      : e.response?.data?.message ||
        "Unable to complete the request. Please try again.";
};
const dateTime = (value?: string) =>
  value
    ? new Date(
        value.endsWith("Z") || /[+-]\d\d:\d\d$/.test(value)
          ? value
          : value + "Z",
      ).toLocaleString()
    : "Not yet run";
const statusChip = (status: string) => (
  <Chip
    size="small"
    label={status.replaceAll("_", " ")}
    color={
      ["COMPLETED", "SENT"].includes(status)
        ? "success"
        : status === "FAILED"
          ? "error"
          : "default"
    }
    variant="outlined"
  />
);

export default function ReportsPage() {
  const { user } = useAuth();
  const canSchedule =
    !!user && ["SUPER_ADMIN", "COMPANY_ADMIN", "ANALYST"].includes(user.role);
  const [tab, setTab] = useState(0);
  const [type, setType] = useState("sales");
  const [filters, setFilters] = useState<Filters>({});
  const [options, setOptions] = useState<Options>();
  const [run, setRun] = useState<Run>();
  const [busy, setBusy] = useState(false);
  const [tableBusy, setTableBusy] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [sort, setSort] = useState("");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");
  const [schedules, setSchedules] = useState<ScheduleRecord[]>([]);
  const [history, setHistory] = useState<{ items: Run[]; total: number }>({
    items: [],
    total: 0,
  });
  const [historyPage, setHistoryPage] = useState(0);
  const [historyType, setHistoryType] = useState("");
  const [historyStatus, setHistoryStatus] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [scheduleFilter, setScheduleFilter] = useState("");
  const [edit, setEdit] = useState<ScheduleRecord>();
  const [recipients, setRecipients] = useState("");
  const [deleteId, setDeleteId] = useState<string>();
  const [refresh, setRefresh] = useState(0);
  const [dialogError, setDialogError] = useState("");
  const [scheduleErrors, setScheduleErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    api
      .get<Options>("/reports/options")
      .then((r) => setOptions(r.data))
      .catch((e) => setError(errorMessage(e)));
  }, [refresh]);
  useEffect(() => {
    let active = true;
    if (tab === 1 && canSchedule) {
      // This effect starts a new API request; reset its loading indicator.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTableBusy(true);
      api
        .get<ScheduleRecord[]>("/reports/schedules")
        .then((r) => {
          if (active) setSchedules(r.data);
        })
        .catch((e) => {
          if (active) setError(errorMessage(e));
        })
        .finally(() => {
          if (active) setTableBusy(false);
        });
    }
    if (tab === 2) {
      setTableBusy(true);
      api
        .get("/reports/history", {
          params: {
            page: historyPage + 1,
            page_size: 10,
            report_type: historyType || undefined,
            status: historyStatus || undefined,
            search: historySearch,
            schedule_id: scheduleFilter || undefined,
          },
        })
        .then((r) => {
          if (active) setHistory(r.data);
        })
        .catch((e) => {
          if (active) setError(errorMessage(e));
        })
        .finally(() => {
          if (active) setTableBusy(false);
        });
    }
    return () => {
      active = false;
    };
  }, [
    tab,
    canSchedule,
    historyPage,
    historyType,
    historyStatus,
    historySearch,
    scheduleFilter,
    refresh,
  ]);
  const runId = run?.id;
  useEffect(() => {
    if (!runId) return;
    let active = true;
    // This effect starts a new API request; reset its loading indicator.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTableBusy(true);
    api
      .get<Run>(`/reports/${runId}`, {
        params: {
          page: page + 1,
          page_size: size,
          sort_by: sort || undefined,
          direction,
        },
      })
      .then((r) => {
        if (active) setRun(r.data);
      })
      .catch((e) => {
        if (active) setError(errorMessage(e));
      })
      .finally(() => {
        if (active) setTableBusy(false);
      });
    return () => {
      active = false;
    };
  }, [runId, page, size, sort, direction, refresh]);
  async function generate() {
    setError("");
    setBusy(true);
    try {
      const response = await api.post<Run>("/reports/generate", {
        report_type: type,
        filters: applicable(type, filters),
        format: "CSV",
      });
      setPage(0);
      setSort("");
      setRun(response.data);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function download(item: Run, format: string) {
    setBusy(true);
    setError("");
    try {
      const response = await api.get(`/reports/${item.id}/download`, {
        params: { format },
        responseType: "blob",
      });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${item.report_type}-${item.id}.${format.toLowerCase()}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setRefresh((v) => v + 1);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  function openSchedule(item?: ScheduleRecord) {
    const value = item || {
      name: "",
      report_type: type,
      filters: applicable(type, filters),
      format: "PDF",
      frequency: "Daily",
      execution_time: "09:00",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      weekday: 0,
      month_day: 1,
      recipients: [],
      active: true,
      period: "previous_period",
    };
    setEdit(value);
    setRecipients(value.recipients.join(", "));
    setDialogError("");
    setScheduleErrors({});
  }
  function payload(item: ScheduleRecord) {
    return {
      name: item.name,
      report_type: item.report_type,
      filters: applicable(item.report_type, item.filters),
      format: item.format,
      frequency: item.frequency,
      execution_time: item.execution_time,
      timezone: item.timezone,
      weekday: item.weekday,
      month_day: item.month_day,
      recipients: item.recipients,
      active: item.active,
      period: item.period,
    };
  }
  async function saveSchedule() {
    if (!edit) return;
    const recipientList = recipients.split(",").map((s) => s.trim()).filter(Boolean);
    const validationErrors: Record<string, string> = {};
    if (!edit.name.trim()) validationErrors.name = "Enter a schedule name.";
    if (!recipientList.length) {
      validationErrors.recipients = "Enter at least one recipient email address.";
    } else if (recipientList.length > 20) {
      validationErrors.recipients = "Enter no more than 20 recipient email addresses.";
    }
    setScheduleErrors(validationErrors);
    setDialogError("");
    if (Object.keys(validationErrors).length) return;
    setBusy(true);
    try {
      const value = payload({
        ...edit,
        recipients: recipientList,
      });
      if (edit.id) await api.put(`/reports/schedules/${edit.id}`, value);
      else await api.post("/reports/schedules", value);
      setEdit(undefined);
      setRefresh((v) => v + 1);
    } catch (e) {
      setDialogError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function toggle(item: ScheduleRecord) {
    setBusy(true);
    try {
      await api.put(
        `/reports/schedules/${item.id}`,
        payload({ ...item, active: !item.active }),
      );
      setRefresh((v) => v + 1);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  function view(item: Run) {
    setPage(0);
    setSort("");
    setRun(item);
    setTab(0);
  }
  function filterFields(
    selected: string,
    value: Filters,
    change: (f: Filters) => void,
    rolling = false,
  ) {
    const field = (
      key: string,
      label: string,
      choices?: { id: string; name: string }[],
      inputType = "text",
    ) => (
      <TextField
        key={key}
        size="small"
        label={label}
        select={!!choices}
        type={inputType}
        value={value[key] || ""}
        onChange={(e) => change({ ...value, [key]: e.target.value })}
        slotProps={{ inputLabel: { shrink: true } }}
      >
        {choices && [
          <MenuItem key="all" value="">
            All {label.toLowerCase()}
          </MenuItem>,
          ...choices.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.name}
            </MenuItem>
          )),
        ]}
      </TextField>
    );
    return (
      <div className="report-filter-grid">
        {!rolling &&
          field(
            "start_date",
            selected === "inventory" ? "Updated from" : "Start date",
            undefined,
            "date",
          )}
        {!rolling &&
          field(
            "end_date",
            selected === "inventory" ? "Updated through" : "End date",
            undefined,
            "date",
          )}
        {field("product_id", "Products", options?.products || [])}
        {field("category_id", "Categories", options?.categories || [])}
        {field(
          "brand",
          "Brands",
          options?.brands.map((b) => ({ id: b, name: b })) || [],
        )}
        {!["inventory", "stock_movement"].includes(selected) &&
          field("customer_id", "Customers", options?.customers || [])}
        {!["inventory", "stock_movement"].includes(selected) &&
          field(
            "sales_status",
            "Sales status",
            ["PAID", "PENDING", "FAILED"].map((s) => ({ id: s, name: s })),
          )}
        {selected === "inventory" &&
          field(
            "stock_status",
            "Stock status",
            ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"].map((s) => ({
              id: s,
              name: s.replaceAll("_", " "),
            })),
          )}
        {selected !== "inventory" &&
          field("user_id", "Users", options?.users || [])}
      </div>
    );
  }
  const context = (item: Run) =>
    Object.entries(item.context)
      .filter(([k]) => !["company", "note"].includes(k))
      .map(([k, v]) => `${k.replaceAll("_", " ")}: ${v}`)
      .join(" · ");
  return (
    <Box className="reports-page">
      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 750 }}>
            Reports
          </Typography>
          <Typography color="text.secondary">
            Turn your business data into clear, actionable reports.
          </Typography>
        </Box>
        <Chip
          icon={<ShieldOutlined />}
          label={options?.company || "Company reports"}
          color="success"
          variant="outlined"
        />
      </Stack>
      <Tabs
        value={tab}
        onChange={(_, v) => {
          setTab(v);
          setError("");
        }}
        className="reports-tabs"
      >
        <Tab
          icon={<AssessmentOutlined />}
          iconPosition="start"
          label="Generate reports"
        />
        {
          <Tab
            disabled={!canSchedule}
            icon={<Schedule />}
            iconPosition="start"
            label="Scheduled reports"
          />
        }
        <Tab icon={<History />} iconPosition="start" label="Report history" />
      </Tabs>
      {error && (
        <Alert
          severity="error"
          action={
            <Button
              onClick={() => {
                setError("");
                setRefresh((v) => v + 1);
              }}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      {tab === 0 && (
        <>
          <div className="report-types">
            {types.map((t) => (
              <button
                key={t.id}
                className={`report-type ${type === t.id ? "selected" : ""}`}
                onClick={() => setType(t.id)}
                aria-pressed={type === t.id}
              >
                <span className={`report-icon ${t.color}`}>
                  <t.icon />
                </span>
                <strong>{t.name}</strong>
                <span>{t.description}</span>
                <b>{type === t.id ? "Selected" : "Select report"} &rarr;</b>
              </button>
            ))}
          </div>
          <Paper variant="outlined" className="report-panel">
            <Stack
              direction="row"
              sx={{ justifyContent: "space-between", mb: 3 }}
            >
              <Typography variant="h6">
                {types.find((t) => t.id === type)?.name} · Filters
              </Typography>
              <Button onClick={() => setFilters({})}>Reset filters</Button>
            </Stack>
            {filterFields(type, filters, setFilters)}
            {type === "inventory" && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Current inventory snapshot. Date range filters the last stock
                update.
              </Typography>
            )}
            <Stack
              direction="row"
              sx={{
                justifyContent: "space-between",
                mt: 3,
                alignItems: "center",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Filters work together. Leave fields blank to include all
                available data.
              </Typography>
              <Button
                variant="contained"
                disabled={busy || !options}
                onClick={generate}
                startIcon={
                  busy ? <CircularProgress size={16} /> : <AssessmentOutlined />
                }
              >
                {busy ? "Preparing report…" : "Generate report"}
              </Button>
            </Stack>
          </Paper>
          <Paper variant="outlined" className="report-panel">
            <Stack
              direction="row"
              sx={{ justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}
            >
              <Box>
                <Typography variant="h6">
                  {run?.name || "Your report will appear here"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {run
                    ? `Generated ${dateTime(run.created_at)} · ${run.total} records`
                    : "Select a report, apply filters and generate to get started."}
                </Typography>
              </Box>
              {run?.status === "COMPLETED" && (
                <Stack direction="row" sx={{ gap: 1 }}>
                  <Button
                    startIcon={<Download />}
                    disabled={busy}
                    onClick={() => download(run, "CSV")}
                  >
                    Export CSV
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    disabled={busy}
                    onClick={() => download(run, "PDF")}
                  >
                    Export PDF
                  </Button>
                </Stack>
              )}
            </Stack>
            {run && (
              <>
                <Typography className="report-context" variant="body2">
                  {context(run)}
                </Typography>
                {run.context.note && (
                  <Typography variant="caption" color="text.secondary">
                    {run.context.note}
                  </Typography>
                )}
                {run.error && <Alert severity="error">{run.error}</Alert>}
              </>
            )}
            {(tableBusy || busy) && (
              <Stack
                direction="row"
                role="status"
                sx={{ gap: 2, alignItems: "center", p: 3 }}
              >
                <CircularProgress size={22} />
                Fetching and preparing report data…
              </Stack>
            )}
            {run?.status === "COMPLETED" && !tableBusy && (
              <>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {run.columns.map((c) => (
                          <TableCell key={c}>
                            <TableSortLabel
                              active={sort === c}
                              direction={sort === c ? direction : "asc"}
                              onClick={() => {
                                setSort(c);
                                setDirection(
                                  sort === c && direction === "asc"
                                    ? "desc"
                                    : "asc",
                                );
                                setPage(0);
                              }}
                            >
                              {c}
                            </TableSortLabel>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {run.rows?.map((row, i) => (
                        <TableRow key={i}>
                          {run.columns.map((c) => (
                            <TableCell key={c}>{row[c] ?? "—"}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {run.total === 0 && (
                  <div className="report-empty">
                    <AssessmentOutlined />
                    <Typography variant="h6">No records found</Typography>
                    <Typography color="text.secondary">
                      Try a different date range or clear your filters.
                    </Typography>
                    <Button onClick={() => setFilters({})}>
                      Clear filters
                    </Button>
                  </div>
                )}
                <TablePagination
                  component="div"
                  count={run.total}
                  page={page}
                  rowsPerPage={size}
                  rowsPerPageOptions={[5, 10, 25, 50, 100]}
                  onPageChange={(_, v) => setPage(v)}
                  onRowsPerPageChange={(e) => {
                    setSize(Number(e.target.value));
                    setPage(0);
                  }}
                />
              </>
            )}
            {!run && !busy && !tableBusy && (
              <div className="report-empty">
                <AssessmentOutlined />
                <Typography variant="h6">No report generated yet</Typography>
                <Typography sx={{ mt: 1, mb: 2 }}>
                  Generate the selected report using the filters above. Leave
                  filters blank to include all available data.
                </Typography>
                <Button
                  variant="contained"
                  disabled={!options}
                  onClick={generate}
                  startIcon={<AssessmentOutlined />}
                >
                  Generate report
                </Button>
              </div>
            )}
          </Paper>
        </>
      )}
      {tab === 1 && (
        <Paper variant="outlined" className="report-panel">
          <Stack
            direction="row"
            sx={{ justifyContent: "space-between", mb: 3 }}
          >
            <Box>
              <Typography variant="h6">Scheduled Reports</Typography>
              <Typography color="text.secondary">
                Automate recurring reports and email delivery.
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => openSchedule()}
            >
              Create schedule
            </Button>
          </Stack>
          {tableBusy ? (
            <CircularProgress />
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {[
                      "Name / Report",
                      "Frequency / Time",
                      "Recipients",
                      "Format",
                      "Status",
                      "Last run / Next run",
                      "Actions",
                    ].map((h) => (
                      <TableCell key={h}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schedules.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <strong>{s.name}</strong>
                        <br />
                        {types.find((t) => t.id === s.report_type)?.name}
                      </TableCell>
                      <TableCell>
                        {s.frequency} · {s.execution_time}
                        <br />
                        <small>{s.timezone}</small>
                      </TableCell>
                      <TableCell>{s.recipients.join(", ")}</TableCell>
                      <TableCell>{s.format}</TableCell>
                      <TableCell>
                        <Switch
                          checked={s.active}
                          disabled={busy}
                          onChange={() => toggle(s)}
                          slotProps={{
                            input: { "aria-label": `Enable ${s.name}` },
                          }}
                        />
                        {s.active ? "Active" : "Inactive"}
                      </TableCell>
                      <TableCell>
                        {s.last_report ? (
                          <>
                            {statusChip(s.last_report.status)}{" "}
                            {s.last_report.delivery_status &&
                              statusChip(s.last_report.delivery_status)}
                            <br />
                            {s.last_report.error && (
                              <Typography variant="caption" color="error">
                                {s.last_report.error}
                              </Typography>
                            )}
                          </>
                        ) : (
                          "Not yet run"
                        )}
                        <br />
                        <small>
                          Last: {dateTime(s.last_run)}
                          <br />
                          Next: {s.active ? dateTime(s.next_run) : "Paused"}
                        </small>
                      </TableCell>
                      <TableCell>
                        <Button onClick={() => openSchedule(s)}>Edit</Button>
                        <Button
                          onClick={() => {
                            setScheduleFilter(s.id!);
                            setHistoryPage(0);
                            setTab(2);
                          }}
                        >
                          Runs
                        </Button>
                        <Button color="error" onClick={() => setDeleteId(s.id)}>
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {!tableBusy && !schedules.length && (
            <div className="report-empty">
              <Schedule />
              <Typography variant="h6">No scheduled reports yet</Typography>
              <Typography>Create your first recurring report above.</Typography>
            </div>
          )}
        </Paper>
      )}
      {tab === 2 && (
        <Paper variant="outlined" className="report-panel">
          <Stack direction="row" sx={{ justifyContent: "space-between" }}>
            <Box>
              <Typography variant="h6">Report History</Typography>
              <Typography color="text.secondary">
                View saved reports and schedule execution results.
              </Typography>
            </Box>
            <Button
              startIcon={<Refresh />}
              onClick={() => setRefresh((v) => v + 1)}
            >
              Refresh
            </Button>
          </Stack>
          <div className="report-history-filters">
            <TextField
              select
              size="small"
              label="Report type"
              value={historyType}
              onChange={(e) => {
                setHistoryType(e.target.value);
                setHistoryPage(0);
              }}
            >
              <MenuItem value="">All reports</MenuItem>
              {types.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              select
              label="Status"
              value={historyStatus}
              onChange={(e) => {
                setHistoryStatus(e.target.value);
                setHistoryPage(0);
              }}
            >
              <MenuItem value="">All statuses</MenuItem>
              {["COMPLETED", "FAILED", "GENERATING"].map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              label="Search reports"
              value={historySearch}
              onChange={(e) => {
                setHistorySearch(e.target.value);
                setHistoryPage(0);
              }}
            />
            {scheduleFilter && (
              <Chip
                label="Selected schedule"
                onDelete={() => {
                  setScheduleFilter("");
                  setHistoryPage(0);
                }}
              />
            )}
          </div>
          {tableBusy ? (
            <CircularProgress />
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {[
                      "Report",
                      "Generated by",
                      "Date / Time",
                      "Applied filters",
                      "Format",
                      "Status / Delivery",
                      "Actions",
                    ].map((c) => (
                      <TableCell key={c}>{c}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.items.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.name}</TableCell>
                      <TableCell>{r.generated_by}</TableCell>
                      <TableCell>{dateTime(r.created_at)}</TableCell>
                      <TableCell sx={{ maxWidth: 300 }}>{context(r)}</TableCell>
                      <TableCell>{r.format}</TableCell>
                      <TableCell>
                        {statusChip(r.status)}{" "}
                        {r.delivery_status && statusChip(r.delivery_status)}
                        {r.error && (
                          <Typography
                            variant="caption"
                            color="error"
                            sx={{ display: "block" }}
                          >
                            {r.error}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button onClick={() => view(r)}>View</Button>
                        <Button
                          disabled={busy || r.status !== "COMPLETED"}
                          onClick={() => download(r, r.format)}
                        >
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {!tableBusy && !history.total && (
            <div className="report-empty">
              <History />
              <Typography>No reports found</Typography>
            </div>
          )}
          <TablePagination
            component="div"
            count={history.total}
            page={historyPage}
            rowsPerPage={10}
            rowsPerPageOptions={[10]}
            onPageChange={(_, v) => setHistoryPage(v)}
          />
        </Paper>
      )}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mt: 2 }}
      >
        Report data is restricted to your company. All times in the history are
        shown in your local timezone.
      </Typography>
      <Dialog
        open={!!edit}
        onClose={() => !busy && setEdit(undefined)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {edit?.id ? "Edit scheduled report" : "Create scheduled report"}
        </DialogTitle>
        <DialogContent>
          {edit && (
            <Stack sx={{ gap: 3, pt: 1 }}>
              {dialogError && <Alert severity="error" sx={{ whiteSpace: "pre-line" }}>{dialogError}</Alert>}
              <div className="report-filter-grid">
                <TextField
                  label="Schedule name"
                  required
                  error={!!scheduleErrors.name}
                  helperText={scheduleErrors.name}
                  value={edit.name}
                  onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                />
                <TextField
                  select
                  label="Report type"
                  value={edit.report_type}
                  onChange={(e) =>
                    setEdit({ ...edit, report_type: e.target.value })
                  }
                >
                  {types.map((t) => (
                    <MenuItem value={t.id} key={t.id}>
                      {t.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Frequency"
                  value={edit.frequency}
                  onChange={(e) =>
                    setEdit({ ...edit, frequency: e.target.value })
                  }
                >
                  {["Daily", "Weekly", "Monthly"].map((f) => (
                    <MenuItem key={f} value={f}>
                      {f}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  type="time"
                  label="Execution time"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={edit.execution_time}
                  onChange={(e) =>
                    setEdit({ ...edit, execution_time: e.target.value })
                  }
                />
                <TextField
                  label="Timezone"
                  value={edit.timezone}
                  onChange={(e) =>
                    setEdit({ ...edit, timezone: e.target.value })
                  }
                />
                {edit.frequency === "Weekly" && (
                  <TextField
                    select
                    label="Day of week"
                    value={edit.weekday}
                    onChange={(e) =>
                      setEdit({ ...edit, weekday: Number(e.target.value) })
                    }
                  >
                    {[
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                      "Sunday",
                    ].map((d, i) => (
                      <MenuItem key={d} value={i}>
                        {d}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
                {edit.frequency === "Monthly" && (
                  <TextField
                    type="number"
                    label="Day of month (1–28)"
                    value={edit.month_day}
                    onChange={(e) =>
                      setEdit({ ...edit, month_day: Number(e.target.value) })
                    }
                  />
                )}
                <TextField
                  select
                  label="Reporting period"
                  value={edit.period}
                  onChange={(e) => setEdit({ ...edit, period: e.target.value })}
                >
                  <MenuItem value="previous_period">
                    Previous day / 7 days / calendar month
                  </MenuItem>
                  <MenuItem value="fixed">Fixed date range</MenuItem>
                </TextField>
                <TextField
                  select
                  label="Export format"
                  value={edit.format}
                  onChange={(e) => setEdit({ ...edit, format: e.target.value })}
                >
                  <MenuItem value="CSV">CSV</MenuItem>
                  <MenuItem value="PDF">PDF</MenuItem>
                </TextField>
              </div>
              <Typography sx={{ fontWeight: 600 }}>Report filters</Typography>
              {filterFields(
                edit.report_type,
                edit.filters,
                (f) => setEdit({ ...edit, filters: f }),
                edit.period === "previous_period",
              )}
              <TextField
                label="Recipients (comma separated)"
                required
                error={!!scheduleErrors.recipients}
                helperText={scheduleErrors.recipients || "Enter 1–20 email addresses to receive the report."}
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
              />
              <Stack direction="row" sx={{ alignItems: "center" }}>
                <Switch
                  checked={edit.active}
                  onChange={(e) =>
                    setEdit({ ...edit, active: e.target.checked })
                  }
                  slotProps={{ input: { "aria-label": "Schedule active" } }}
                />
                Active
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button disabled={busy} onClick={() => setEdit(undefined)}>
            Cancel
          </Button>
          <Button variant="contained" disabled={busy} onClick={saveSchedule}>
            Save schedule
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={!!deleteId} onClose={() => setDeleteId(undefined)}>
        <DialogTitle>Delete this schedule?</DialogTitle>
        <DialogContent>
          Future deliveries will stop. Previously generated reports remain in
          History.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(undefined)}>Cancel</Button>
          <Button
            color="error"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await api.delete(`/reports/schedules/${deleteId}`);
                setDeleteId(undefined);
                setRefresh((v) => v + 1);
              } catch (e) {
                setError(errorMessage(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            Delete schedule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
