// Coordinates data, state, and child components for the Demand Forecasting Page screen.

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  CircularProgress,
  MenuItem,
  Pagination,
  Select,
  Snackbar,
  Typography,
} from "@mui/material";
import AutoGraphOutlinedIcon from "@mui/icons-material/AutoGraphOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import Button from "../../components/common/Button/Button";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import {
  generateForecast,
  getForecasts,
  recordForecastExport,
  type Recommendation,
} from "../../api/forecastApi";
import { createPdfReport } from "../../utils/createPdfReport";
import DemandForecastTable from "./DemandForecastTable";
import DemandForecastVisualizations from "./DemandForecastVisualizations";
import DemandForecastHistory from "./DemandForecastHistory";
import "./DemandForecastingPage.css";

const recommendationLabel: Record<Recommendation, string> = {
  IMMEDIATE_RESTOCK: "Immediate Restock",
  REORDER_SOON: "Reorder Soon",
  STOCK_HEALTHY: "Stock Level Healthy",
  OVERSTOCK_RISK: "Overstock Risk",
};
// This component receives prepared data and renders the feature-specific interface.
const periods = [
  { value: "7", label: "Next 7 Days" },
  { value: "30", label: "Next 30 Days" },
  { value: "90", label: "Next 90 Days" },
  { value: "custom", label: "Custom Date Range" },
];
const tabs = ["Forecast Views", "Visualizations", "History"] as const;
const fmt = (value: number) => new Intl.NumberFormat("en-IN").format(value);

const DemandForecastingPage = () => {
  const queryClient = useQueryClient();
  // Store the active view, filters, pagination, and user feedback.
  const [tab, setTab] = useState<(typeof tabs)[number]>("Forecast Views");
  const [period, setPeriod] = useState("30");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [sort, setSort] = useState("demand");
  const [forecastView, setForecastView] = useState<"products" | "categories">(
    "products",
  );
  const [productPage, setProductPage] = useState(1);
  const [categoryPage, setCategoryPage] = useState(1);
  const [message, setMessage] = useState("");
  // Forecast data is loaded again whenever the selected period changes.
  const query = useQuery({
    queryKey: ["forecasts", period],
    queryFn: () => getForecasts(period),
  });
  const mutation = useMutation({
    mutationFn: (refresh: boolean) => generateForecast(period, refresh),
    onSuccess: (data) => {
      queryClient.setQueryData(["forecasts", period], data);
      setMessage(
        "Forecast and inventory recommendations generated successfully.",
      );
      window.dispatchEvent(
        new CustomEvent("retailpulse:notification", {
          detail: {
            title: "Demand forecast ready",
            message: `Forecast for the next ${period} days has been generated.`,
            path: "/demand-forecasting",
          },
        }),
      );
    },
  });
  // Apply the product filters and selected sort order without changing API data.
  const products = useMemo(() => {
    const rows = (query.data?.products ?? []).filter(
      (p) =>
        (!search || p.name.toLowerCase().includes(search.toLowerCase())) &&
        (!category || p.category === category) &&
        (!brand || p.brand === brand),
    );
    return [...rows].sort((a, b) =>
      sort === "stock"
        ? a.currentStock - b.currentStock
        : sort === "growth"
          ? b.growth - a.growth
          : sort === "accuracy"
            ? b.confidence - a.confidence
            : b.predictedDemand - a.predictedDemand,
    );
  }, [query.data, search, category, brand, sort]);
  const categoryOptions = useMemo(
    () =>
      [
        ...new Set(
          (query.data?.products ?? []).map((product) => product.category),
        ),
      ]
        .filter(Boolean)
        .sort(),
    [query.data?.products],
  );
  const brandOptions = useMemo(
    () =>
      [...new Set((query.data?.products ?? []).map((product) => product.brand))]
        .filter((value): value is string => Boolean(value))
        .sort(),
    [query.data?.products],
  );
  const totals = useMemo(
    () => ({
      demand: products.reduce((sum, p) => sum + p.predictedDemand, 0),
      runOut: products.filter((p) => p.predictedDemand > p.currentStock).length,
      growth: products.filter((p) => p.growth >= 20).length,
      slow: products.filter(
        (p) => p.growth < 0 || p.recommendation === "OVERSTOCK_RISK",
      ).length,
      accuracy: products.length
        ? products.reduce((sum, p) => sum + p.confidence, 0) / products.length
        : 0,
    }),
    [products],
  );
  const pageSize = 10;
  const pagedProducts = products.slice(
    (productPage - 1) * pageSize,
    productPage * pageSize,
  );
  const categoryRows = useMemo(
    () =>
      (query.data?.categories ?? []).filter(
        (item) => !category || item.name === category,
      ),
    [query.data?.categories, category],
  );
  const pagedCategories = categoryRows.slice(
    (categoryPage - 1) * pageSize,
    categoryPage * pageSize,
  );
  const hasActiveFilters =
    period !== "30" ||
    Boolean(search) ||
    Boolean(category) ||
    Boolean(brand) ||
    sort !== "demand";
  const applyFilters = () => {
    setProductPage(1);
    setCategoryPage(1);
    setMessage("Forecast filters applied.");
  };
  const clearFilters = () => {
    setPeriod("30");
    setSearch("");
    setCategory("");
    setBrand("");
    setSort("demand");
    setProductPage(1);
    setCategoryPage(1);
    setMessage("Forecast filters cleared.");
  };
  // Export the currently filtered forecast as a CSV or PDF report.
  const exportReport = async (
    kind: "csv" | "pdf",
    scope = "Demand Forecast",
  ) => {
    const headings =
      scope === "Category Forecast"
        ? [
            "Category",
            "Historical Sales",
            "Predicted Demand",
            "Growth",
            "Accuracy",
          ]
        : [
            "Product",
            "Category",
            "Current Stock",
            "Historical Sales",
            "Predicted Demand",
            "Confidence",
            "Recommendation",
          ];
    const rows =
      scope === "Category Forecast"
        ? categoryRows.map((c) => [
            c.name,
            c.historicalSales,
            c.predictedDemand,
            `${c.growth}%`,
            `${c.confidence}%`,
          ])
        : products.map((p) => [
            p.name,
            p.category,
            p.currentStock,
            p.historicalSales,
            p.predictedDemand,
            `${p.confidence}%`,
            recommendationLabel[p.recommendation],
          ]);
    const content = [headings, ...rows]
      .map((r) => r.map((v) => `"${v}"`).join(","))
      .join("\n");
    const blob =
      kind === "pdf"
        ? createPdfReport(`${scope} Report`, [
            `Forecast period: ${period} days`,
            `Generated: ${new Date().toLocaleString("en-IN")}`,
            "",
            headings.join(" | "),
            ...rows.map((row) => row.join(" | ")),
          ])
        : new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${scope.toLowerCase().replaceAll(" ", "-")}.${kind}`;
    link.click();
    URL.revokeObjectURL(link.href);
    await recordForecastExport(`${scope} (${kind.toUpperCase()})`, period);
    setMessage(`${scope} exported successfully.`);
  };
  const history = [...products]
    .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))
    .slice(0, 5);

  return (
    <Box className="forecast-page">
      <PageHeader
        title="Demand Forecasting"
        subtitle="Predict demand, identify inventory risks, and plan stock with confidence."
        icon={<AutoGraphOutlinedIcon />}
        actions={
          <Box className="forecast-header-actions">
            <Button
              variant="outlined"
              startIcon={<RefreshOutlinedIcon />}
              disabled={mutation.isPending}
              onClick={() => mutation.mutate(true)}
            >
              Refresh Forecast
            </Button>
            <Button
              startIcon={<AddOutlinedIcon />}
              disabled={mutation.isPending}
              onClick={() => mutation.mutate(false)}
            >
              Generate Forecast
            </Button>
          </Box>
        }
      />
      <Box className="forecast-tabs">
        {tabs.map((item) => (
          <button
            className={tab === item ? "active" : ""}
            onClick={() => setTab(item)}
            key={item}
          >
            {item}
          </button>
        ))}
      </Box>
      <Box className="forecast-toolbar">
        <label>
          Forecast Period
          <Select
            size="small"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            {periods.map((p) => (
              <MenuItem value={p.value} key={p.value}>
                {p.label}
              </MenuItem>
            ))}
          </Select>
        </label>
        <label>
          Product
          <input
            placeholder="Search products..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setProductPage(1);
            }}
          />
        </label>
        <label>
          Category
          <Select
            displayEmpty
            size="small"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setProductPage(1);
              setCategoryPage(1);
            }}
          >
            <MenuItem value="">All Categories</MenuItem>
            {categoryOptions.map((x) => (
              <MenuItem key={x} value={x}>
                {x}
              </MenuItem>
            ))}
          </Select>
        </label>
        <label>
          Brand
          <Select
            displayEmpty
            size="small"
            value={brand}
            onChange={(e) => {
              setBrand(e.target.value);
              setProductPage(1);
            }}
          >
            <MenuItem value="">All Brands</MenuItem>
            {brandOptions.map((x) => (
              <MenuItem key={x} value={x}>
                {x}
              </MenuItem>
            ))}
          </Select>
        </label>
        <label>
          Sort By
          <Select
            size="small"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setProductPage(1);
            }}
          >
            <MenuItem value="demand">Highest Predicted Demand</MenuItem>
            <MenuItem value="stock">Lowest Stock</MenuItem>
            <MenuItem value="growth">Highest Growth</MenuItem>
            <MenuItem value="accuracy">Forecast Accuracy</MenuItem>
          </Select>
        </label>
        <Box className="forecast-toolbar__actions">
          <Button
            variant="outlined"
            startIcon={<FilterAltOutlinedIcon />}
            onClick={applyFilters}
          >
            Filters
          </Button>
          <Button
            variant="outlined"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
          >
            Clear Filters
          </Button>
        </Box>
      </Box>
      {query.isLoading ? (
        <Box className="forecast-loading">
          <CircularProgress />
          <span>Loading company forecast...</span>
        </Box>
      ) : query.isError ? (
        <Alert severity="error">Unable to load forecasts.</Alert>
      ) : !query.data?.products.length ? (
        <Box className="forecast-empty">
          <AutoGraphOutlinedIcon />
          <Typography component="h2">No forecast for this period</Typography>
          <Typography>
            Generate a forecast from your companyâ€™s historical sales.
            Inactive and deleted products are automatically excluded.
          </Typography>
          <Button onClick={() => mutation.mutate(false)}>
            Generate Forecast
          </Button>
        </Box>
      ) : (
        <>
          {tab === "Forecast Views" && (
            <Box className="forecast-kpis">
              {[
                [
                  "Total Predicted Demand",
                  fmt(totals.demand),
                  "demand",
                  <AutoGraphOutlinedIcon />,
                ],
                [
                  "Products Expected to Run Out",
                  totals.runOut,
                  "danger",
                  <WarningAmberOutlinedIcon />,
                ],
                [
                  "High Growth Products",
                  totals.growth,
                  "growth",
                  <TrendingUpOutlinedIcon />,
                ],
                [
                  "Slow Moving Products",
                  totals.slow,
                  "slow",
                  <Inventory2OutlinedIcon />,
                ],
                [
                  "Forecast Accuracy",
                  `${totals.accuracy.toFixed(1)}%`,
                  "accuracy",
                  <CheckCircleOutlineIcon />,
                ],
              ].map(([label, value, type, icon]) => (
                <Box className={`forecast-kpi ${type}`} key={String(label)}>
                  <Box className="forecast-kpi__icon">{icon}</Box>
                  <Box className="forecast-kpi__copy">
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
          {tab === "Forecast Views" && (
            <Box className="forecast-view-section">
              <Box className="forecast-level-header">
                <Box className="forecast-level-tabs">
                  <button
                    className={forecastView === "products" ? "active" : ""}
                    onClick={() => setForecastView("products")}
                  >
                    Product Level Forecast <span>{products.length}</span>
                  </button>
                  <button
                    className={forecastView === "categories" ? "active" : ""}
                    onClick={() => setForecastView("categories")}
                  >
                    Category Level Forecast <span>{categoryRows.length}</span>
                  </button>
                </Box>
                <Box className="forecast-level-exports">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DownloadOutlinedIcon />}
                    onClick={() =>
                      exportReport(
                        "csv",
                        forecastView === "products"
                          ? "Product Forecast"
                          : "Category Forecast",
                      )
                    }
                  >
                    Export CSV
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DownloadOutlinedIcon />}
                    onClick={() =>
                      exportReport(
                        "pdf",
                        forecastView === "products"
                          ? "Product Forecast"
                          : "Category Forecast",
                      )
                    }
                  >
                    Export PDF
                  </Button>
                </Box>
              </Box>
              {forecastView === "products" ? (
                <>
                  <DemandForecastTable
                    title="Product Level Forecast"
                    products={pagedProducts}
                  />
                  <Box className="forecast-pagination">
                    <Typography>
                      {products.length
                        ? [
                            (productPage - 1) * pageSize + 1,
                            Math.min(productPage * pageSize, products.length),
                          ].join("–") +
                          ` of ${products.length} products`
                        : "No products"}
                    </Typography>
                    <Pagination
                      page={productPage}
                      count={Math.max(1, Math.ceil(products.length / pageSize))}
                      onChange={(_, page) => setProductPage(page)}
                      color="primary"
                    />
                  </Box>
                </>
              ) : (
                <>
                  <Box className="forecast-card forecast-card--wide">
                    <Box className="forecast-card__title">
                      <Typography component="h2">
                        Category Level Forecast
                      </Typography>
                      <span>{categoryRows.length} categories</span>
                    </Box>
                    <div className="forecast-table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Category</th>
                            <th>Total Historical Sales</th>
                            <th>Predicted Demand</th>
                            <th>Expected Growth</th>
                            <th>Confidence</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagedCategories.map((c) => (
                            <tr key={c.name}>
                              <td>
                                <strong>{c.name}</strong>
                              </td>
                              <td>{fmt(c.historicalSales)}</td>
                              <td>
                                <strong>{fmt(c.predictedDemand)}</strong>
                              </td>
                              <td
                                className={
                                  c.growth >= 0 ? "positive" : "negative"
                                }
                              >
                                {c.growth >= 0 ? "â†‘" : "â†“"}{" "}
                                {Math.abs(c.growth)}%
                              </td>
                              <td>{c.confidence}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Box>
                  <Box className="forecast-pagination">
                    <Typography>
                      {categoryRows.length
                        ? [
                            (categoryPage - 1) * pageSize + 1,
                            Math.min(
                              categoryPage * pageSize,
                              categoryRows.length,
                            ),
                          ].join("–") +
                          ` of ${categoryRows.length} categories`
                        : "No categories"}
                    </Typography>
                    <Pagination
                      page={categoryPage}
                      count={Math.max(
                        1,
                        Math.ceil(categoryRows.length / pageSize),
                      )}
                      onChange={(_, page) => setCategoryPage(page)}
                      color="primary"
                    />
                  </Box>
                </>
              )}
            </Box>
          )}
          {tab === "Visualizations" && (
            <DemandForecastVisualizations
              products={products}
              categories={query.data.categories}
            />
          )}
          {tab === "History" && (
            <DemandForecastHistory products={products} history={history} />
          )}
        </>
      )}
      {mutation.isError && (
        <Snackbar open autoHideDuration={6000} onClose={() => mutation.reset()}>
          <Alert severity="error">
            {(mutation.error as any)?.response?.data?.detail ??
              "Forecast generation failed."}
          </Alert>
        </Snackbar>
      )}
      <Snackbar
        open={Boolean(message)}
        autoHideDuration={4000}
        onClose={() => setMessage("")}
        message={message}
      />
    </Box>
  );
};

export default DemandForecastingPage;
