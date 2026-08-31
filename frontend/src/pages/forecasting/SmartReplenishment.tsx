/* Teaching guide: This file contains smart replenishment page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
// Coordinates data, state, and child components for the Smart Replenishment screen.
import { useEffect, useMemo, useState } from "react";
import { Alert, Box, CircularProgress } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import Button from "../../components/common/Button/Button";
import { getInventoryForecast } from "../../api/inventoryForecastApi";
import ForecastCharts from "./ForecastCharts";
import ReplenishmentFilters from "./ReplenishmentFilters";
import ReplenishmentSummary from "./ReplenishmentSummary";
import ReplenishmentTable from "./ReplenishmentTable";
import {
  RecommendationComparison,
  ReplenishmentMethod,
} from "./ReplenishmentDetails";
import { REPLENISHMENT_PAGE_SIZE, riskOrder } from "./SmartReplenishmentShared";
import "./SmartReplenishment.css";
import "./SmartReplenishmentBadges.css";
import "./SmartReplenishmentOverrides.css";
import "./InventoryForecastTheme.css";

// This component receives prepared data and renders the feature-specific interface.
export default function SmartReplenishment() {
  // Store the forecast period, combined filters, sorting, and current page.
  const [days, setDays] = useState(30),
    [risk, setRisk] = useState(""),
    [category, setCategory] = useState(""),
    [supplier, setSupplier] = useState(""),
    [search, setSearch] = useState(""),
    [reorder, setReorder] = useState(""),
    [sort, setSort] = useState("risk"),
    [direction, setDirection] = useState("asc"),
    [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Forecast calculations come from the backend and are cached for five minutes.
  const query = useQuery({
    queryKey: ["inventory-forecast", days],
    queryFn: () => getInventoryForecast(days),
    staleTime: 300000,
    retry: 1,
  });
  useEffect(
    () => setPage(1),
    [risk, category, supplier, search, reorder, sort, direction],
  );
  // Apply all filters together before sorting the recommendation rows.
  const rows = useMemo(
    () =>
      [...(query.data?.items ?? [])]
        .filter(
          (item) =>
            (!risk || item.risk === risk) &&
            (!category || item.category === category) &&
            (!supplier || item.supplier === supplier) &&
            (!search ||
              `${item.product} ${item.sku}`
                .toLowerCase()
                .includes(search.toLowerCase())) &&
            (!reorder || item.reorderRequired === (reorder === "yes")),
        )
        .sort((a, b) => {
          const value =
            sort === "stock"
              ? a.currentStock - b.currentStock
              : sort === "demand"
                ? a.forecastedDemand - b.forecastedDemand
                : sort === "days"
                  ? (a.daysRemaining ?? Infinity) -
                    (b.daysRemaining ?? Infinity)
                  : sort === "quantity"
                    ? a.recommendedQuantity - b.recommendedQuantity
                    : riskOrder[a.risk] - riskOrder[b.risk];
          return direction === "asc" ? value : -value;
        }),
    [query.data, risk, category, supplier, search, reorder, sort, direction],
  );
  const categories = [
    ...new Set((query.data?.items ?? []).map((item) => item.category)),
  ];
  const suppliers = [
    ...new Set((query.data?.items ?? []).map((item) => item.supplier)),
  ];
  const shown = rows.slice(
    (page - 1) * REPLENISHMENT_PAGE_SIZE,
    page * REPLENISHMENT_PAGE_SIZE,
  );
  const selected =
    (query.data?.items ?? []).find((item) => item.productId === selectedId) ??
    shown[0] ??
    null;
  const clear = () => {
    setRisk("");
    setCategory("");
    setSupplier("");
    setSearch("");
    setReorder("");
    setSort("risk");
    setDirection("asc");
  };
  const view = (productId: string) => {
    setSelectedId(productId);
    window.setTimeout(
      () =>
        document
          .getElementById("recommendation-comparison")
          ?.scrollIntoView({ behavior: "smooth", block: "center" }),
      0,
    );
  };
  if (query.isLoading)
    return (
      <Box className="sr-state">
        <CircularProgress />
        <span>Calculating forecasts and recommendations...</span>
      </Box>
    );
  if (query.isError)
    return (
      <Alert
        severity="error"
        action={
          <Button size="small" onClick={() => query.refetch()}>
            Retry
          </Button>
        }
      >
        Failed to load forecast data. Check the backend service and try again.
      </Alert>
    );
  if (!query.data?.items.length)
    return (
      <Box className="sr-state">
        <h2>No products found</h2>
        <p>Add active products and inventory to generate a forecast.</p>
      </Box>
    );
  return (
    <Box className="sr-page">
      <div className="sr-heading">
        <div>
          <h2>Inventory Forecast Dashboard</h2>
          <p>
            Backend-calculated demand, stock risk, and replenishment
            recommendations.
          </p>
        </div>
        <small>
          Updated {new Date(query.data.generatedAt).toLocaleString("en-IN")}
        </small>
      </div>
      <ReplenishmentSummary summary={query.data.summary} />
      <ReplenishmentFilters
        days={days}
        setDays={setDays}
        risk={risk}
        setRisk={setRisk}
        category={category}
        setCategory={setCategory}
        supplier={supplier}
        setSupplier={setSupplier}
        search={search}
        setSearch={setSearch}
        reorder={reorder}
        setReorder={setReorder}
        sort={sort}
        setSort={setSort}
        direction={direction}
        setDirection={setDirection}
        categories={categories}
        suppliers={suppliers}
        onClear={clear}
      />
      <ReplenishmentTable
        rows={rows}
        shown={shown}
        selectedId={selected?.productId}
        page={page}
        onPage={setPage}
        onSelect={setSelectedId}
        onView={view}
      />
      <ForecastCharts
        items={query.data.items}
        summary={query.data.summary}
        selectedProductId={selected?.productId}
      />
      <Box className="sr-lower">
        <RecommendationComparison item={selected} />
        <ReplenishmentMethod data={query.data.method} />
      </Box>
    </Box>
  );
}
