/* Manages report requests, pagination, exports, and schedule editing for all report tabs. */
import { useEffect, useState } from "react";
import api from "../../api/axiosInstance";
import { useAuth } from "../../hooks/useAuth";
import type { Filters, Run, ScheduleRecord, Options } from "./reportTypes";
import { applicable, errorMessage } from "./reportUtils";

// Keep state here so switching tabs preserves filters, results, and pagination.
export function useReports() {
  const { user } = useAuth();
  // Only these roles can open the scheduling tab.
  const canSchedule =
    !!user && ["SUPER_ADMIN", "COMPANY_ADMIN", "ANALYST"].includes(user.role);
  // Keep tab selections, report results, table settings, and dialog values in one place.
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
  const [scheduleErrors, setScheduleErrors] = useState<Record<string, string>>(
    {},
  );
  // Load the product, customer, and other choices needed by report filters.
  useEffect(() => {
    api
      .get<Options>("/reports/options")
      .then((r) => setOptions(r.data))
      .catch((e) => setError(errorMessage(e)));
  }, [refresh]);
  // Fetch schedules or history for the active tab. Ignore responses after this effect is cleaned up.
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
  // Reload report rows when the selected report, page, sort order, or refresh counter changes.
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
  // Generate a report using only filters supported by the selected report type.
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
  // Download the selected format, then release the temporary browser file URL.
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
  // Load an existing schedule or start a daily schedule using the current report filters.
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
  // Send only editable schedule fields; omit saved run details and other response data.
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
  // Check the name and recipient count before creating or updating the schedule.
  async function saveSchedule() {
    if (!edit) return;
    const recipientList = recipients
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const validationErrors: Record<string, string> = {};
    if (!edit.name.trim()) validationErrors.name = "Enter a schedule name.";
    if (!recipientList.length) {
      validationErrors.recipients =
        "Enter at least one recipient email address.";
    } else if (recipientList.length > 20) {
      validationErrors.recipients =
        "Enter no more than 20 recipient email addresses.";
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
  // Switch a schedule between active and paused, then refresh the list.
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
  // Open a saved report in the generate tab with pagination and sorting reset.
  function view(item: Run) {
    setPage(0);
    setSort("");
    setRun(item);
    setTab(0);
  }
  // Delete the schedule selected in the confirmation dialog and reload the list.
  async function deleteSchedule() {
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
  }

  return {
    canSchedule,
    tab,
    setTab,
    type,
    setType,
    filters,
    setFilters,
    options,
    setOptions,
    run,
    setRun,
    busy,
    setBusy,
    tableBusy,
    setTableBusy,
    error,
    setError,
    page,
    setPage,
    size,
    setSize,
    sort,
    setSort,
    direction,
    setDirection,
    schedules,
    setSchedules,
    history,
    setHistory,
    historyPage,
    setHistoryPage,
    historyType,
    setHistoryType,
    historyStatus,
    setHistoryStatus,
    historySearch,
    setHistorySearch,
    scheduleFilter,
    setScheduleFilter,
    edit,
    setEdit,
    recipients,
    setRecipients,
    deleteId,
    setDeleteId,
    refresh,
    setRefresh,
    dialogError,
    setDialogError,
    scheduleErrors,
    setScheduleErrors,
    generate,
    download,
    openSchedule,
    saveSchedule,
    toggle,
    view,
    deleteSchedule,
  };
}

export type ReportsState = ReturnType<typeof useReports>;
