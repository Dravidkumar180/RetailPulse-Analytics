// Coordinates data, state, and child components for the Analytics Page screen.
import { useMemo, useState } from "react";
import { Box, Button } from "@mui/material";
import WarningIcon from "@mui/icons-material/WarningAmber";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAnalyticsDashboard,
  logAnalyticsAction,
  type AnalyticsFilters,
} from "../../api/analyticsApi";
import { createPdfReport } from "../../utils/createPdfReport";
import AnalyticsDashboardPanels from "./AnalyticsDashboardPanels";
import AnalyticsFiltersPanel from "./AnalyticsFiltersPanel";
import AnalyticsHeader from "./AnalyticsHeader";
import AnalyticsKpis from "./AnalyticsKpis";
import {
  analyticsErrorMessage,
  csvCell,
  dateRange,
  localDate,
  notify,
  title,
  today,
} from "./analyticsUtils";
import "./AnalyticsPage.css";
import "./DonutCharts.css";
import "./TrendChart.css";
import "./FilterControls.css";

// This component receives prepared data and renders the feature-specific interface.
const defaultFilters = (): AnalyticsFilters => ({
  interval: "daily",
  ...dateRange(30),
});

export default function AnalyticsPage() {
  const queryClient = useQueryClient();
  // Draft filters can be edited without immediately changing dashboard results.
  const [draft, setDraft] = useState<AnalyticsFilters>(defaultFilters);
  const [filters, setFilters] = useState<AnalyticsFilters>(draft);
  const [sort, setSort] = useState<"revenue" | "units">("revenue");
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState<"CSV" | "PDF" | null>(null);
  // Only applied filters are included in the query key and backend request.
  const query = useQuery({
    queryKey: ["sales-analytics", filters],
    queryFn: () => getAnalyticsDashboard(filters),
    staleTime: 30000,
    retry: 1,
  });
  const data = query.data;
  // Sort a copied product array so cached API data stays immutable.
  const products = useMemo(
    () =>
      [...(data?.topProducts || [])].sort(
        (left, right) => right[sort] - left[sort],
      ),
    [data, sort],
  );

  const update = (key: keyof AnalyticsFilters, value: string) =>
    setDraft((current) => ({ ...current, [key]: value || undefined }));
  const preset = (kind: string) => {
    const now = new Date();
    let dates: Partial<AnalyticsFilters>;
    if (kind === "today") dates = { startDate: today(), endDate: today() };
    else if (kind === "7") dates = dateRange(7);
    else if (kind === "30") dates = dateRange(30);
    else if (kind === "month")
      dates = {
        startDate: localDate(new Date(now.getFullYear(), now.getMonth(), 1)),
        endDate: today(),
      };
    else
      dates = {
        startDate: localDate(
          new Date(now.getFullYear(), now.getMonth() - 1, 1),
        ),
        endDate: localDate(new Date(now.getFullYear(), now.getMonth(), 0)),
      };
    setDraft((current) => ({ ...current, ...dates }));
  };
  const clear = () => {
    const defaults = defaultFilters();
    setDraft(defaults);
    setFilters(defaults);
    setError("");
  };
  const apply = async () => {
    if (draft.startDate && draft.endDate && draft.startDate > draft.endDate) {
      setError("Start date must be on or before end date.");
      return;
    }
    setError("");
    setFilters({ ...draft });
    try {
      await logAnalyticsAction(
        "filters",
        `Sales analytics filters applied: ${JSON.stringify(draft)}`,
      );
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
      notify(
        "Sales filters applied",
        "Dashboard results now reflect the selected filters.",
      );
    } catch {
      notify(
        "Filters applied",
        "Results updated, but the audit entry could not be recorded.",
      );
    }
  };
  const refresh = async () => {
    const result = await query.refetch();
    notify(
      result.isError ? "Refresh failed" : "Analytics refreshed",
      result.isError
        ? "Sales analytics could not be refreshed. Please try again."
        : "The dashboard is showing the latest available sales data.",
    );
  };
  const download = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  // Assemble the visible analytics data into a downloadable report.
  const exportReport = async (format: "CSV" | "PDF") => {
    if (!data || exporting) return;
    setExporting(format);
    try {
      const rows: unknown[][] = [
        ["Sales Analytics Report"],
        ["Filters", JSON.stringify(filters)],
        [],
        ["KPI", "Value"],
        ...Object.entries(data.kpis),
        [],
        ["Product", "SKU", "Units", "Revenue"],
        ...products.map((item) => [
          item.name,
          item.sku,
          item.units,
          item.revenue,
        ]),
        [],
        ["Customer", "Orders", "Spend", "Average Order Value"],
        ...data.topCustomers.map((item) => [
          item.name,
          item.orders,
          item.totalSpend,
          item.averageOrderValue,
        ]),
        [],
        ["Payment Method", "Transactions", "Revenue"],
        ...data.paymentMethods.map((item) => [
          title(item.name),
          item.transactions,
          item.revenue,
        ]),
      ];
      if (format === "PDF")
        download(
          createPdfReport(
            "Sales Analytics Report",
            rows.map((row) => row.join(" | ")),
          ),
          `sales-analytics-${today()}.pdf`,
        );
      else
        download(
          new Blob([rows.map((row) => row.map(csvCell).join(",")).join("\n")], {
            type: "text/csv;charset=utf-8",
          }),
          `sales-analytics-${today()}.csv`,
        );
      try {
        await logAnalyticsAction(
          "export",
          `Sales analytics ${format} exported; Filters: ${JSON.stringify(filters)}`,
        );
        await queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
        notify(
          "Report exported",
          `${format} report downloaded and recorded in Audit Logs.`,
          "/audit-logs",
        );
      } catch {
        notify(
          "Report downloaded",
          `${format} was downloaded, but its audit entry could not be recorded.`,
        );
      }
    } catch {
      notify(
        "Export failed",
        `The ${format} report could not be generated. Please try again.`,
      );
    } finally {
      setExporting(null);
    }
  };

  const loading = query.isLoading;
  return (
    <Box className="analytics-page">
      <AnalyticsHeader
        refreshing={query.isFetching}
        hasData={Boolean(data)}
        exporting={exporting}
        onRefresh={refresh}
        onExport={exportReport}
      />
      <AnalyticsFiltersPanel
        draft={draft}
        options={data?.options}
        error={error}
        onUpdate={update}
        onPreset={preset}
        onClear={clear}
        onApply={apply}
      />
      {query.isError && (
        <Box className="analytics-alert" role="alert">
          <WarningIcon /> {analyticsErrorMessage(query.error)}
          <Button onClick={() => query.refetch()}>Retry</Button>
        </Box>
      )}
      <AnalyticsKpis
        data={data}
        loading={loading}
        updating={query.isFetching && !loading}
      />
      <AnalyticsDashboardPanels
        data={data}
        products={products}
        sort={sort}
        interval={filters.interval}
        loading={loading}
        fetching={query.isFetching}
        onSort={setSort}
        onInterval={(interval) => {
          setDraft((current) => ({ ...current, interval }));
          setFilters((current) => ({ ...current, interval }));
        }}
      />
      {data && (
        <Box className="analytics-updated">
          Cached for 30 seconds · Last updated{" "}
          {new Date(data.lastUpdated).toLocaleString("en-IN")}
        </Box>
      )}
    </Box>
  );
}
