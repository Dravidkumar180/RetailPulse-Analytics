import { useMemo, useState } from "react";
import { Box, Button, Card, CardContent, Skeleton, Typography } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/Download";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAnalyticsDashboard, logAnalyticsAction, type AnalyticsFilters } from "../../api/analyticsApi";
import { getInventory } from "../../api/inventoryApi";
import { getSales } from "../../api/salesApi";
import { createPdfReport } from "../../utils/createPdfReport";
import AnalyticsFiltersPanel from "./AnalyticsFiltersPanel";
import { AnalyticsEmpty, csvCell, dateRange, money, title, today } from "./analyticsUtils";
import "./AnalyticsPage.css";

const defaults = (): AnalyticsFilters => ({ ...dateRange(30), interval: "daily" });

export default function RetailAnalyticsPage() {
  const client = useQueryClient();
  const [draft, setDraft] = useState<AnalyticsFilters>(defaults);
  const [filters, setFilters] = useState<AnalyticsFilters>(draft);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState<"CSV" | "PDF" | null>(null);
  const query = useQuery({
    queryKey: ["retail-analytics", filters],
    queryFn: () => getAnalyticsDashboard(filters),
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });
  const salesQuery = useQuery({
    queryKey: ["retail-analytics-sales-fallback", filters],
    queryFn: () => getSales({ startDate: filters.startDate, endDate: filters.endDate,
      categoryId: filters.categoryId, salesChannel: filters.salesChannel,
      paymentMethod: filters.paymentMethod, sort: "date" }),
  });
  const inventoryQuery = useQuery({
    queryKey: ["retail-analytics-inventory-fallback", filters.categoryId, filters.brand],
    queryFn: () => getInventory({ categoryId: filters.categoryId, brand: filters.brand, sort: "product" }),
  });
  const data = query.data;
  const channelFallback = Object.values((salesQuery.data?.items || []).reduce<Record<string,{name:string;revenue:number;transactions:number}>>((result, sale) => {
    if (filters.productId && !sale.items.some((item) => item.productId === filters.productId)) return result;
    const row = result[sale.salesChannel] ||= { name: sale.salesChannel, revenue: 0, transactions: 0 };
    row.revenue += Number(sale.totalAmount); row.transactions += 1; return result;
  }, {}));
  const inventoryCategoryFallback = (inventoryQuery.data?.summary.inventoryByCategory || []).map((item) => ({ name: item.name, revenue: item.value, transactions: 0 }));
  const channelRows = data?.salesChannels.length ? data.salesChannels : channelFallback;
  const inventoryCategoryRows = data?.inventory.byCategory.length
    ? data.inventory.byCategory.map(x=>({name:x.name,revenue:x.units,transactions:x.products}))
    : inventoryCategoryFallback;
  const lowStockRows = data?.inventory.lowStockProducts.length ? data.inventory.lowStockProducts
    : (inventoryQuery.data?.items || []).filter((item) => item.stockStatus === "LOW_STOCK").map((item) => ({ id:item.id, name:item.productName, sku:item.sku, stock:item.availableStock, reorderLevel:item.reorderLevel, category:item.categoryName, value:0 }));
  const maxRevenue = Math.max(...(data?.trend.map((x) => x.revenue) || [1]), 1);
  const maxProduct = Math.max(...(data?.topProducts.map((x) => x.units) || [1]), 1);
  const cards = useMemo(() => data ? [
    ["Total Revenue", money(data.kpis.totalRevenue)], ["Total Orders", data.kpis.totalOrders],
    ["Average Order Value", money(data.kpis.averageOrderValue)], ["Total Products Sold", data.kpis.totalItemsSold],
    ["Total Inventory Value", money(data.kpis.totalInventoryValue)], ["Low Stock Products", data.kpis.lowStockProducts],
    ["Out of Stock", data.kpis.outOfStockProducts], ["Total Categories", data.kpis.totalCategories],
  ] : [], [data]);
  const apply = async () => {
    if (draft.startDate && draft.endDate && draft.startDate > draft.endDate) return setError("Start date must be on or before end date.");
    setError(""); setFilters({ ...draft });
    await logAnalyticsAction("filters", `Retail analytics filters applied: ${JSON.stringify(draft)}`);
    client.invalidateQueries({ queryKey: ["audit-logs"] });
  };
  const exportReport = async (format: "CSV" | "PDF") => {
    if (!data) return; setExporting(format);
    const rows: unknown[][] = [["Retail Analytics Dashboard"], ["Filters", JSON.stringify(filters)], [], ["KPI", "Value"], ...cards,
      [], ["Product", "Units", "Revenue"], ...data.topProducts.map(x => [x.name, x.units, x.revenue]),
      [], ["Category", "Inventory Units", "Inventory Value"], ...data.inventory.byCategory.map(x => [x.name, x.units, x.value]),
      [], ["Low Stock Product", "Available Stock", "Reorder Level"], ...data.inventory.lowStockProducts.map(x => [x.name, x.stock, x.reorderLevel])];
    const blob = format === "PDF" ? createPdfReport("Retail Analytics Dashboard", rows.map(row => row.join(" | "))) : new Blob([rows.map(row => row.map(csvCell).join(",")).join("\n")], {type:"text/csv"});
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `retail-analytics-${today()}.${format.toLowerCase()}`; link.click(); URL.revokeObjectURL(url);
    await logAnalyticsAction("export", `Retail analytics report exported; Export Type: ${format}; Filters: ${JSON.stringify(filters)}`);
    client.invalidateQueries({ queryKey: ["audit-logs"] }); setExporting(null);
  };
  return <Box className="analytics-page retail-analytics-page">
    <Box className="analytics-header"><Box><Typography component="h1">Retail Analytics Dashboard</Typography><Typography>Comprehensive business insights, trends, and drill-downs.</Typography></Box>
      <Box className="analytics-actions"><Button startIcon={<RefreshIcon />} disabled={query.isFetching} onClick={() => query.refetch()}>Refresh</Button><Button startIcon={<DownloadIcon />} disabled={!data || !!exporting} onClick={() => exportReport("CSV")}>CSV</Button><Button variant="contained" startIcon={<DownloadIcon />} disabled={!data || !!exporting} onClick={() => exportReport("PDF")}>PDF</Button></Box></Box>
    <AnalyticsFiltersPanel draft={draft} options={data?.options} error={error} onUpdate={(key,value) => setDraft(old => ({...old,[key]:value || undefined}))} onPreset={(kind) => { const ranges:Record<string,AnalyticsFilters>={today:{startDate:today(),endDate:today()},"7":dateRange(7),"30":dateRange(30)}; setDraft(old => ({...old,...(ranges[kind] || defaults())})); }} onClear={() => { const value=defaults(); setDraft(value); setFilters(value); }} onApply={apply} />
    {query.isError && <Box className="analytics-alert">Unable to load retail analytics. <Button onClick={() => query.refetch()}>Retry</Button></Box>}
    <Box className="retail-kpis">{query.isLoading ? Array.from({length:8},(_,i)=><Skeleton key={i} variant="rounded" height={88}/>) : cards.map(([label,value],index)=><Card key={String(label)} className={`retail-kpi retail-kpi--${index}`}><CardContent><small>{label}</small><strong>{value}</strong></CardContent></Card>)}</Box>
    <Box className="retail-chart-grid">
      <Card className="analytics-panel retail-wide"><CardContent><h3>Revenue Trend</h3>{data?.trend.length ? <Box className="retail-line-bars">{data.trend.map(x=><div key={x.label} title={`${x.label}: ${money(x.revenue)}`}><i style={{height:`${Math.max(x.revenue/maxRevenue*100,3)}%`}}/><span>{x.label}</span></div>)}</Box>:<AnalyticsEmpty text="No revenue data for the selected filters."/>}</CardContent></Card>
      <Card className="analytics-panel"><CardContent><h3>Top Selling Products</h3>{data?.topProducts.length ? <Box className="retail-horizontal-bars">{data.topProducts.slice(0,10).map(x=><div key={x.id}><span>{x.name}</span><i><b style={{width:`${x.units/maxProduct*100}%`}}/></i><strong>{x.units}</strong></div>)}</Box>:<AnalyticsEmpty kind="products" text="No products found."/>}</CardContent></Card>
      <Breakdown title="Sales by Payment Method" rows={data?.paymentMethods || []}/><Breakdown title="Sales by Channel" rows={channelRows}/><Breakdown title="Inventory by Category" rows={inventoryCategoryRows}/>
    </Box>
    <Card className="critical-stock-card"><CardContent><h3>Critical Low Stock Products</h3>{lowStockRows.length ? <Box className="critical-stock-table"><div><b>Product Name</b><b>Available Stock</b><b>Reorder Level</b><b>Status</b></div>{lowStockRows.map(x=><div key={x.id}><span>{x.name}</span><strong>{x.stock}</strong><span>{x.reorderLevel}</span><em>Low Stock</em></div>)}</Box>:<AnalyticsEmpty kind="products" text="No critical low-stock products."/>}</CardContent></Card>
    {data && <Box className="analytics-updated">Auto-refreshes every 30 seconds · Last updated {new Date(data.lastUpdated).toLocaleString("en-IN")}</Box>}
  </Box>;
}

function Breakdown({title: heading, rows}:{title:string;rows:{name:string;revenue:number;transactions:number}[]}) { const max=Math.max(...rows.map(x=>x.revenue),1); return <Card className="analytics-panel"><CardContent><h3>{heading}</h3>{rows.length?<Box className="retail-horizontal-bars">{rows.map(x=><div key={x.name}><span>{title(x.name)}</span><i><b style={{width:`${x.revenue/max*100}%`}}/></i><strong>{typeof x.revenue === "number" ? x.revenue.toLocaleString("en-IN") : x.revenue}</strong></div>)}</Box>:<AnalyticsEmpty text={`No ${heading.toLowerCase()} data.`}/>}</CardContent></Card>; }
