import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Box, CircularProgress, MenuItem, Pagination, Select, Snackbar, Typography } from "@mui/material";
import AutoGraphOutlinedIcon from "@mui/icons-material/AutoGraphOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import Button from "../../components/common/Button/Button";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import { generateForecast, getForecasts, recordForecastExport, type ForecastProduct, type Recommendation } from "../../api/forecastApi";
import { createPdfReport } from "../../utils/createPdfReport";
import "./DemandForecastingPage.css";

const recommendationLabel: Record<Recommendation, string> = {
  IMMEDIATE_RESTOCK: "Immediate Restock", REORDER_SOON: "Reorder Soon",
  STOCK_HEALTHY: "Stock Level Healthy", OVERSTOCK_RISK: "Overstock Risk",
};
const periods = [{ value: "7", label: "Next 7 Days" }, { value: "30", label: "Next 30 Days" }, { value: "90", label: "Next 90 Days" }, { value: "custom", label: "Custom Date Range" }];
const tabs = ["Forecast Views", "Visualizations", "History"] as const;
const fmt = (value: number) => new Intl.NumberFormat("en-IN").format(value);

const Sparkline = ({ values, forecast = false }: { values: number[]; forecast?: boolean }) => {
  const max = Math.max(...values, 1);
  const points = values.map((v, i) => `${(i / Math.max(values.length - 1, 1)) * 100},${46 - (v / max) * 38}`).join(" ");
  return <svg className="forecast-chart__svg" viewBox="0 0 100 50" preserveAspectRatio="none"><polyline points={points} fill="none" stroke={forecast ? "#10b981" : "#2563eb"} strokeWidth="2" vectorEffect="non-scaling-stroke" /></svg>;
};

const DemandForecastingPage = () => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Forecast Views");
  const [period, setPeriod] = useState("30");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [sort, setSort] = useState("demand");
  const [forecastView, setForecastView] = useState<"products" | "categories">("products");
  const [productPage, setProductPage] = useState(1);
  const [categoryPage, setCategoryPage] = useState(1);
  const [message, setMessage] = useState("");
  const query = useQuery({ queryKey: ["forecasts", period], queryFn: () => getForecasts(period) });
  const mutation = useMutation({
    mutationFn: (refresh: boolean) => generateForecast(period, refresh),
    onSuccess: (data) => {
      queryClient.setQueryData(["forecasts", period], data);
      setMessage("Forecast and inventory recommendations generated successfully.");
      window.dispatchEvent(new CustomEvent("retailpulse:notification", { detail: { title: "Demand forecast ready", message: `Forecast for the next ${period} days has been generated.`, path: "/demand-forecasting" } }));
    },
  });
  const products = useMemo(() => {
    const rows = (query.data?.products ?? []).filter((p) =>
      (!search || p.name.toLowerCase().includes(search.toLowerCase())) &&
      (!category || p.category === category) && (!brand || p.brand === brand));
    return [...rows].sort((a, b) => sort === "stock" ? a.currentStock - b.currentStock : sort === "growth" ? b.growth - a.growth : sort === "accuracy" ? b.confidence - a.confidence : b.predictedDemand - a.predictedDemand);
  }, [query.data, search, category, brand, sort]);
  const categoryOptions = useMemo(
    () =>
      [...new Set((query.data?.products ?? []).map((product) => product.category))]
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
  const totals = useMemo(() => ({
    demand: products.reduce((sum, p) => sum + p.predictedDemand, 0),
    runOut: products.filter((p) => p.predictedDemand > p.currentStock).length,
    growth: products.filter((p) => p.growth >= 20).length,
    slow: products.filter((p) => p.growth < 0 || p.recommendation === "OVERSTOCK_RISK").length,
    accuracy: products.length ? products.reduce((sum, p) => sum + p.confidence, 0) / products.length : 0,
  }), [products]);
  const pageSize = 10;
  const pagedProducts = products.slice((productPage - 1) * pageSize, productPage * pageSize);
  const categoryRows = useMemo(
    () => (query.data?.categories ?? []).filter((item) => !category || item.name === category),
    [query.data?.categories, category],
  );
  const pagedCategories = categoryRows.slice((categoryPage - 1) * pageSize, categoryPage * pageSize);
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
  const exportReport = async (kind: "csv" | "pdf", scope = "Demand Forecast") => {
    const headings = scope === "Category Forecast" ? ["Category", "Historical Sales", "Predicted Demand", "Growth", "Accuracy"] : ["Product", "Category", "Current Stock", "Historical Sales", "Predicted Demand", "Confidence", "Recommendation"];
    const rows = scope === "Category Forecast"
      ? categoryRows.map((c) => [c.name, c.historicalSales, c.predictedDemand, `${c.growth}%`, `${c.confidence}%`])
      : products.map((p) => [p.name, p.category, p.currentStock, p.historicalSales, p.predictedDemand, `${p.confidence}%`, recommendationLabel[p.recommendation]]);
    const content = [headings, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = kind === "pdf"
      ? createPdfReport(
          `${scope} Report`,
          [
            `Forecast period: ${period} days`,
            `Generated: ${new Date().toLocaleString("en-IN")}`,
            "",
            headings.join(" | "),
            ...rows.map((row) => row.join(" | ")),
          ],
        )
      : new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `${scope.toLowerCase().replaceAll(" ", "-")}.${kind}`; link.click(); URL.revokeObjectURL(link.href);
    await recordForecastExport(`${scope} (${kind.toUpperCase()})`, period);
    setMessage(`${scope} exported successfully.`);
  };
  const history = [...products].sort((a, b) => b.generatedAt.localeCompare(a.generatedAt)).slice(0, 5);

  return <Box className="forecast-page">
    <PageHeader title="Demand Forecasting" subtitle="Predict demand, identify inventory risks, and plan stock with confidence." icon={<AutoGraphOutlinedIcon />}
      actions={<Box className="forecast-header-actions"><Button variant="outlined" startIcon={<RefreshOutlinedIcon />} disabled={mutation.isPending} onClick={() => mutation.mutate(true)}>Refresh Forecast</Button><Button startIcon={<AddOutlinedIcon />} disabled={mutation.isPending} onClick={() => mutation.mutate(false)}>Generate Forecast</Button></Box>} />
    <Box className="forecast-tabs">{tabs.map((item) => <button className={tab === item ? "active" : ""} onClick={() => setTab(item)} key={item}>{item}</button>)}</Box>
    <Box className="forecast-toolbar">
      <label>Forecast Period<Select size="small" value={period} onChange={(e) => setPeriod(e.target.value)}>{periods.map((p) => <MenuItem value={p.value} key={p.value}>{p.label}</MenuItem>)}</Select></label>
      <label>Product<input placeholder="Search products..." value={search} onChange={(e) => { setSearch(e.target.value); setProductPage(1); }} /></label>
      <label>Category<Select displayEmpty size="small" value={category} onChange={(e) => { setCategory(e.target.value); setProductPage(1); setCategoryPage(1); }}><MenuItem value="">All Categories</MenuItem>{categoryOptions.map((x) => <MenuItem key={x} value={x}>{x}</MenuItem>)}</Select></label>
      <label>Brand<Select displayEmpty size="small" value={brand} onChange={(e) => { setBrand(e.target.value); setProductPage(1); }}><MenuItem value="">All Brands</MenuItem>{brandOptions.map((x) => <MenuItem key={x} value={x}>{x}</MenuItem>)}</Select></label>
      <label>Sort By<Select size="small" value={sort} onChange={(e) => { setSort(e.target.value); setProductPage(1); }}><MenuItem value="demand">Highest Predicted Demand</MenuItem><MenuItem value="stock">Lowest Stock</MenuItem><MenuItem value="growth">Highest Growth</MenuItem><MenuItem value="accuracy">Forecast Accuracy</MenuItem></Select></label>
      <Box className="forecast-toolbar__actions">
        <Button variant="outlined" startIcon={<FilterAltOutlinedIcon />} onClick={applyFilters}>Filters</Button>
        <Button variant="outlined" onClick={clearFilters} disabled={!hasActiveFilters}>Clear Filters</Button>
      </Box>
    </Box>
    {query.isLoading ? <Box className="forecast-loading"><CircularProgress /><span>Loading company forecast...</span></Box> : query.isError ? <Alert severity="error">Unable to load forecasts.</Alert> : !query.data?.products.length ? <Box className="forecast-empty"><AutoGraphOutlinedIcon /><Typography component="h2">No forecast for this period</Typography><Typography>Generate a forecast from your company’s historical sales. Inactive and deleted products are automatically excluded.</Typography><Button onClick={() => mutation.mutate(false)}>Generate Forecast</Button></Box> : <>
      {tab === "Forecast Views" && <Box className="forecast-kpis">
        {[
          ["Total Predicted Demand", fmt(totals.demand), "demand", <AutoGraphOutlinedIcon />],
          ["Products Expected to Run Out", totals.runOut, "danger", <WarningAmberOutlinedIcon />],
          ["High Growth Products", totals.growth, "growth", <TrendingUpOutlinedIcon />],
          ["Slow Moving Products", totals.slow, "slow", <Inventory2OutlinedIcon />],
          ["Forecast Accuracy", `${totals.accuracy.toFixed(1)}%`, "accuracy", <CheckCircleOutlineIcon />],
        ].map(([label, value, type, icon]) => (
          <Box className={`forecast-kpi ${type}`} key={String(label)}>
            <Box className="forecast-kpi__icon">{icon}</Box>
            <Box className="forecast-kpi__copy">
              <span>{label}</span>
              <strong>{value}</strong>
            </Box>
          </Box>
        ))}
      </Box>}
      {tab === "Forecast Views" && <Box className="forecast-view-section">
        <Box className="forecast-level-header">
          <Box className="forecast-level-tabs">
            <button className={forecastView === "products" ? "active" : ""} onClick={() => setForecastView("products")}>Product Level Forecast <span>{products.length}</span></button>
            <button className={forecastView === "categories" ? "active" : ""} onClick={() => setForecastView("categories")}>Category Level Forecast <span>{categoryRows.length}</span></button>
          </Box>
          <Box className="forecast-level-exports">
            <Button
              size="small"
              variant="outlined"
              startIcon={<DownloadOutlinedIcon />}
              onClick={() => exportReport("csv", forecastView === "products" ? "Product Forecast" : "Category Forecast")}
            >
              Export CSV
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<DownloadOutlinedIcon />}
              onClick={() => exportReport("pdf", forecastView === "products" ? "Product Forecast" : "Category Forecast")}
            >
              Export PDF
            </Button>
          </Box>
        </Box>
        {forecastView === "products" ? <>
          <ForecastTable title="Product Level Forecast" products={pagedProducts} />
          <Box className="forecast-pagination"><Typography>{products.length ? `${(productPage - 1) * pageSize + 1}–${Math.min(productPage * pageSize, products.length)} of ${products.length} products` : "No products"}</Typography><Pagination page={productPage} count={Math.max(1, Math.ceil(products.length / pageSize))} onChange={(_, page) => setProductPage(page)} color="primary" /></Box>
        </> : <>
          <Box className="forecast-card forecast-card--wide"><Box className="forecast-card__title"><Typography component="h2">Category Level Forecast</Typography><span>{categoryRows.length} categories</span></Box><div className="forecast-table-wrap"><table><thead><tr><th>Category</th><th>Total Historical Sales</th><th>Predicted Demand</th><th>Expected Growth</th><th>Confidence</th></tr></thead><tbody>{pagedCategories.map((c) => <tr key={c.name}><td><strong>{c.name}</strong></td><td>{fmt(c.historicalSales)}</td><td><strong>{fmt(c.predictedDemand)}</strong></td><td className={c.growth >= 0 ? "positive" : "negative"}>{c.growth >= 0 ? "↑" : "↓"} {Math.abs(c.growth)}%</td><td>{c.confidence}%</td></tr>)}</tbody></table></div></Box>
          <Box className="forecast-pagination"><Typography>{categoryRows.length ? `${(categoryPage - 1) * pageSize + 1}–${Math.min(categoryPage * pageSize, categoryRows.length)} of ${categoryRows.length} categories` : "No categories"}</Typography><Pagination page={categoryPage} count={Math.max(1, Math.ceil(categoryRows.length / pageSize))} onChange={(_, page) => setCategoryPage(page)} color="primary" /></Box>
        </>}
      </Box>}
      {tab === "Visualizations" && <Visualizations products={products} categories={query.data.categories} />}
      {tab === "History" && <HistoryView products={products} history={history} />}
    </>}
    {mutation.isError && <Snackbar open autoHideDuration={6000} onClose={() => mutation.reset()}><Alert severity="error">{(mutation.error as any)?.response?.data?.detail ?? "Forecast generation failed."}</Alert></Snackbar>}
    <Snackbar open={Boolean(message)} autoHideDuration={4000} onClose={() => setMessage("")} message={message} />
  </Box>;
};

const ForecastTable = ({ title, products }: { title: string; products: ForecastProduct[] }) => <Box className="forecast-card forecast-card--wide"><Box className="forecast-card__title"><Typography component="h2">{title}</Typography><span>{products.length} products</span></Box><div className="forecast-table-wrap"><table><thead><tr><th>Product Name</th><th>Current Stock</th><th>Historical Sales</th><th>Predicted Demand</th><th>Forecast Period</th><th>Confidence</th><th>Recommendation</th></tr></thead><tbody>{products.map((p) => <tr key={p.id}><td><strong>{p.name}</strong><small>{p.sku} · {p.category}</small></td><td>{p.currentStock}</td><td>{fmt(p.historicalSales)}</td><td><strong>{fmt(p.predictedDemand)}</strong></td><td>Next forecast period</td><td><span className="confidence"><i style={{ width: `${p.confidence}%` }} />{p.confidence}%</span></td><td><span className={`recommendation ${p.recommendation.toLowerCase()}`}>{recommendationLabel[p.recommendation]}</span></td></tr>)}</tbody></table></div></Box>;

type ChartRange = "today" | "30" | "year";
const chartRanges: { value: ChartRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "30", label: "Next 30 Days" },
  { value: "year", label: "Year" },
];
const rangeFactor = (range: ChartRange) =>
  range === "today" ? 1 / 30 : range === "year" ? 12 : 1;
const rangeVariation = (range: ChartRange, index: number) =>
  range === "today"
    ? 0.72 + (index % 3) * 0.19
    : range === "year"
      ? 0.68 + ((index * 7) % 5) * 0.13
      : 0.88 + (index % 4) * 0.06;

const Visualizations = ({ products, categories }: { products: ForecastProduct[]; categories: { name: string; historicalSales: number; predictedDemand: number }[] }) => {
  const [salesRange, setSalesRange] = useState<ChartRange>("30");
  const [productRange, setProductRange] = useState<ChartRange>("30");
  const [categoryRange, setCategoryRange] = useState<ChartRange>("30");
  const top = products.slice(0, 10); const max = Math.max(...top.map((p) => p.predictedDemand), 1);
  const scale = (value: number, range: ChartRange, variation = 1) =>
    Math.max(0, Math.round(value * rangeFactor(range) * variation));
  const categoryChartValues = categories.map((item, index) => ({
    ...item,
    historicalSales: scale(item.historicalSales, categoryRange, rangeVariation(categoryRange, index)),
    predictedDemand: scale(item.predictedDemand, categoryRange, rangeVariation(categoryRange, index + 2)),
  }));
  const categoryMax = Math.max(
    ...categoryChartValues.flatMap((item) => [item.historicalSales, item.predictedDemand]),
    1,
  );
  return <Box className="visualization-grid">
    <Box className="forecast-card chart-card">
      <Box className="chart-card__header"><h2>Historical Sales vs Forecast</h2><ChartRangeSelect value={salesRange} onChange={setSalesRange} /></Box>
      <div className="chart-legend"><span className="blue">Historical Sales</span><span className="green">Forecasted Sales</span></div>
      <Box className="dual-chart"><Sparkline values={products.slice(0, 8).map((p, index) => scale(p.historicalSales, salesRange, rangeVariation(salesRange, index)))} /><Sparkline forecast values={products.slice(0, 8).map((p, index) => scale(p.predictedDemand, salesRange, rangeVariation(salesRange, index + 2)))} /></Box>
    </Box>
    <Box className="forecast-card chart-card">
      <Box className="chart-card__header"><h2>Product Demand Trend (Top 5 Products)</h2><ChartRangeSelect value={productRange} onChange={setProductRange} /></Box>
      {products.slice(0, 5).map((p, i) => <div className="mini-trend" key={p.id}><span>{p.name}</span><Sparkline values={[0, 1, 2, 3, 4].map((index) => scale(index < 3 ? p.historicalSales : p.predictedDemand, productRange, rangeVariation(productRange, index + i)))} forecast={i % 2 === 1} /></div>)}
    </Box>
    <Box className="forecast-card chart-card">
      <Box className="chart-card__header"><h2>Category Demand Trend</h2><ChartRangeSelect value={categoryRange} onChange={setCategoryRange} /></Box>
      <Box className="category-bars">{categoryChartValues.map((c) => <div key={c.name} title={`${c.name}: ${fmt(c.historicalSales)} historical, ${fmt(c.predictedDemand)} forecast`}><span>{c.name}</span><i style={{ height: `${Math.max(8, c.historicalSales / categoryMax * 100)}%` }} /><b style={{ height: `${Math.max(8, c.predictedDemand / categoryMax * 100)}%` }} /></div>)}</Box>
    </Box>
    <Box className="forecast-card chart-card top-products"><h2>Top Predicted Products</h2>{top.map((p, i) => <div key={p.id}><span>{i + 1}. {p.name}</span><i><b style={{ width: `${p.predictedDemand / max * 100}%` }} /></i><strong>{fmt(p.predictedDemand)}</strong></div>)}</Box>
    <Box className="forecast-card chart-card seasonal"><h2>Seasonal Sales Pattern (All Categories)</h2><Box className="heatmap"><span />{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m) => <b key={m}>{m}</b>)}{categories.slice(0, 5).flatMap((c, row) => [<strong key={`${c.name}-name`}>{c.name}</strong>, ...Array.from({ length: 12 }, (_, col) => <i key={`${c.name}-${col}`} style={{ opacity: .22 + ((row * 7 + col * 3) % 8) / 10 }} />)])}</Box></Box>
  </Box>;
};

const ChartRangeSelect = ({ value, onChange }: { value: ChartRange; onChange: (value: ChartRange) => void }) => (
  <Select
    className="chart-range-select"
    size="small"
    value={value}
    onChange={(event) => onChange(event.target.value as ChartRange)}
    aria-label="Chart period"
  >
    {chartRanges.map((range) => <MenuItem key={range.value} value={range.value}>{range.label}</MenuItem>)}
  </Select>
);

const HistoryView = ({ products, history }: { products: ForecastProduct[]; history: ForecastProduct[] }) => {
  const [section, setSection] = useState<"inventory" | "model" | "activity">("inventory");
  const counts = (key: Recommendation) => products.filter((p) => p.recommendation === key).length;
  return <Box className={`history-grid history-grid--${section}`}>
    <Box className="history-section-tabs">
      <button className={section === "inventory" ? "active" : ""} onClick={() => setSection("inventory")}><Inventory2OutlinedIcon />Inventory Recommendation</button>
      <button className={section === "model" ? "active" : ""} onClick={() => setSection("model")}><AutoGraphOutlinedIcon />Forecast Model Overview</button>
      <button className={section === "activity" ? "active" : ""} onClick={() => setSection("activity")}><RefreshOutlinedIcon />Recent Forecast Activity</button>
    </Box>
    <Box className="forecast-card inventory-recommendations"><h2>Inventory Recommendation</h2><Box className="recommendation-kpis">{([["IMMEDIATE_RESTOCK", "Immediate Restock Required", <WarningAmberOutlinedIcon />], ["REORDER_SOON", "Reorder Soon", <Inventory2OutlinedIcon />], ["STOCK_HEALTHY", "Stock Level Healthy", <CheckCircleOutlineIcon />], ["OVERSTOCK_RISK", "Overstock Risk", <TrendingUpOutlinedIcon />]] as const).map(([key, label, icon]) => <Box key={key}>{icon}<span>{label}</span><strong>{counts(key)}</strong><small>Products</small></Box>)}</Box><div className="forecast-table-wrap"><table><thead><tr><th>Product</th><th>Current Stock</th><th>Reorder Level</th><th>Predicted Demand</th><th>Recommendation</th><th>Reason</th></tr></thead><tbody>{products.slice(0, 8).map((p) => <tr key={p.id}><td><strong>{p.name}</strong></td><td>{p.currentStock}</td><td>{p.reorderLevel}</td><td>{p.predictedDemand}</td><td><span className={`recommendation ${p.recommendation.toLowerCase()}`}>{recommendationLabel[p.recommendation]}</span></td><td>{p.recommendation === "IMMEDIATE_RESTOCK" ? "Demand exceeds available stock" : p.recommendation === "REORDER_SOON" ? "Stock will reach reorder level soon" : p.recommendation === "OVERSTOCK_RISK" ? "Stock exceeds predicted demand" : "Stock supports predicted demand"}</td></tr>)}</tbody></table></div></Box>
    <Box className="forecast-card model-overview"><h2>Forecast Model Overview</h2>{[[<StorageOutlinedIcon />, "Aggregates historical sales data", "Daily sales data from the last 60 days"], [<CalculateOutlinedIcon />, "Calculates moving average", "Weighted trend used for prediction"], [<AutoGraphOutlinedIcon />, "Generates forecast", "Predicts demand for the selected period"], [<SecurityOutlinedIcon />, "Company-based access", "Only your company’s sales and inventory are used"], [<RefreshOutlinedIcon />, "Auto refresh ready", "Refresh whenever new sales data is available"]].map(([icon, title, copy]) => <Box key={String(title)}>{icon}<span><strong>{title}</strong><small>{copy}</small></span></Box>)}</Box>
    <Box className="forecast-card recent-activity"><h2>Recent Forecast Activity</h2>{history.map((p, index) => <Box key={p.id}><CheckCircleOutlineIcon /><span><strong>{index === 0 ? "Forecast generated" : "Inventory recommendation generated"}</strong><small>{p.name} · {new Date(p.generatedAt).toLocaleString("en-IN")}</small></span></Box>)}</Box>
  </Box>;
};
export default DemandForecastingPage;
