import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Button, Card, CardContent, Dialog, DialogContent, DialogTitle, MenuItem, TextField, Typography } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/Download";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import InventoryIcon from "@mui/icons-material/Inventory2";
import CategoryIcon from "@mui/icons-material/Category";
import PaymentsIcon from "@mui/icons-material/Payments";
import WarningIcon from "@mui/icons-material/WarningAmber";
import { getAnalyticsDashboard, logAnalyticsAction, type AnalyticsFilters, type MetricItem } from "../../api/analyticsApi";
import { createPdfReport } from "../../utils/createPdfReport";
import LoadingSpinner from "../../components/common/LoadingSpinner/LoadingSpinner";
import "./AnalyticsPage.css";
import "./DonutCharts.css";
import "./TrendChart.css";
import "./FilterControls.css";

const money = (value=0) => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(value);
const label = (value:string) => value.replaceAll("_"," ").replace(/\b\w/g, c => c.toUpperCase());
const colors = ["#2563eb","#14b8a6","#8b5cf6","#f59e0b","#ef4444","#06b6d4","#64748b"];
const defaults: AnalyticsFilters = {interval:"daily"};

type ChartValueKey = "value"|"revenue"|"quantity"|"units";
const DonutChart = ({items,valueKey="value",centerLabel="Total",moneyValues=false,onItemClick}:{items:MetricItem[];valueKey?:ChartValueKey;centerLabel?:string;moneyValues?:boolean;onItemClick?:(item:MetricItem)=>void}) => {
  const total=items.reduce((sum,item)=>sum+Number(item[valueKey]||0),0);
  if(!items.length) return <Empty text="No data for the selected filters." />;
  let cursor=0;
  const gradient=items.map((item,index)=>{const start=cursor;cursor+=total?Number(item[valueKey]||0)/total*100:0;return `${colors[index%colors.length]} ${start}% ${cursor}%`;}).join(",");
  return <Box className="donut-layout"><Box className="donut-chart" style={{background:`conic-gradient(${gradient})`}}><Box><span>{centerLabel}</span><strong>{moneyValues?money(total):total.toLocaleString("en-IN")}</strong></Box></Box>
    <Box className="donut-legend">{items.map((item,index)=>{const value=Number(item[valueKey]||0);return <button type="button" key={item.name} onClick={()=>onItemClick?.(item)} className={onItemClick?"clickable":""}>
      <i style={{background:colors[index%colors.length]}}/><span>{label(item.name)}</span><b>{total?`${(value/total*100).toFixed(1)}%`:"0%"}</b><strong>{moneyValues?money(value):value.toLocaleString("en-IN")}</strong>
    </button>})}</Box></Box>;
};
const Empty=({text}:{text:string})=><Box className="analytics-empty"><InventoryIcon/><strong>Nothing to show yet</strong><span>{text}</span></Box>;
const trendLabel=(value:string,interval:string)=>{
  if(interval==="monthly"){const [year,month]=value.split("-");return new Intl.DateTimeFormat("en-IN",{month:"short",year:"2-digit"}).format(new Date(Number(year),Number(month)-1,1));}
  if(interval==="weekly")return value.replace("-W"," W");
  return new Intl.DateTimeFormat("en-IN",{day:"2-digit",month:"short"}).format(new Date(`${value}T00:00:00`));
};

export default function AnalyticsPage(){
  const queryClient=useQueryClient();
  const [draft,setDraft]=useState<AnalyticsFilters>(defaults);
  const [filters,setFilters]=useState<AnalyticsFilters>(defaults);
  const [detail,setDetail]=useState<{title:string;rows:Record<string,unknown>[]} | null>(null);
  const query=useQuery({queryKey:["analytics-dashboard",filters],queryFn:()=>getAnalyticsDashboard(filters),refetchInterval:30000});
  const data=query.data;
  useEffect(()=>{ if(data?.options && !draft.interval) setDraft(v=>({...v,interval:"daily"})); },[data?.options,draft.interval]);
  const update=(key:keyof AnalyticsFilters,value:string)=>setDraft(v=>({...v,[key]:value||undefined}));
  const apply=()=>{setFilters({...draft});};
  const clear=()=>{setDraft(defaults);setFilters(defaults);};
  const exportReport=async(type:"CSV"|"PDF")=>{
    if(!data)return;
    try {
      await logAnalyticsAction(
        "export",
        `Analytics report downloaded; Export Type: ${type}; Filters: ${JSON.stringify(filters)}`,
      );
      await queryClient.invalidateQueries({queryKey:["audit-logs"]});
      window.dispatchEvent(new CustomEvent("retailpulse:notification",{
        detail:{
          title:"Report download recorded",
          message:`The ${type} analytics report was saved to Audit Logs.`,
          path:"/audit-logs",
        },
      }));
    } catch {
      window.dispatchEvent(new CustomEvent("retailpulse:notification",{
        detail:{
          title:"Download not recorded",
          message:"The audit entry could not be saved. Please retry the download.",
          path:"/analytics",
        },
      }));
      return;
    }
    if(type==="PDF"){
      const filterSummary=Object.entries(filters).filter(([,value])=>value).map(([key,value])=>`${label(key)}: ${value}`);
      const lines=[
        `Generated: ${new Date().toLocaleString("en-IN")}`,
        `Filters: ${filterSummary.join(" | ")||"All data"}`,
        "",
        "KEY PERFORMANCE INDICATORS",
        `Total Revenue: ${money(data.kpis.totalRevenue)}`,
        `Total Orders: ${data.kpis.totalOrders}`,
        `Total Products Sold: ${data.kpis.totalProductsSold}`,
        `Average Order Value: ${money(data.kpis.averageOrderValue)}`,
        `Total Inventory Value: ${money(data.kpis.totalInventoryValue)}`,
        `Low Stock Products: ${data.kpis.lowStockProducts}`,
        `Out of Stock Products: ${data.kpis.outOfStockProducts}`,
        `Total Categories: ${data.kpis.totalCategories}`,
        "",
        "TOP SELLING PRODUCTS",
        ...data.topProducts.map((item,index)=>`${index+1}. ${item.name} | Units: ${item.units} | Revenue: ${money(item.revenue)}`),
        "",
        "TOP PERFORMING CATEGORIES",
        ...data.topCategories.map(item=>`${item.name} | Units: ${item.units} | Revenue: ${money(item.revenue)}`),
        "",
        "SALES BY PAYMENT METHOD",
        ...data.paymentMethods.map(item=>`${label(item.name)}: ${money(item.value)}`),
        "",
        "SALES BY CHANNEL",
        ...data.salesChannels.map(item=>`${label(item.name)}: ${money(item.value)}`),
        "",
        "INVENTORY VALUE BY CATEGORY",
        ...data.inventoryByCategory.map(item=>`${item.name} | Quantity: ${item.quantity||0} | Value: ${money(item.value)}`),
        "",
        "LOW STOCK PRODUCTS",
        ...data.lowStock.map(item=>`${item.name} (${item.sku}) | Available: ${item.stock} | Reorder level: ${item.reorderLevel}`),
        "",
        "OUT OF STOCK PRODUCTS",
        ...data.outOfStock.map(item=>`${item.name} (${item.sku}) | Out of stock`),
      ];
      const pdf=createPdfReport("Retail Analytics Dashboard Report",lines);
      const url=URL.createObjectURL(pdf);
      window.open(url,"_blank","noopener,noreferrer");
      const anchor=document.createElement("a");anchor.href=url;anchor.download=`retail-analytics-${new Date().toISOString().slice(0,10)}.pdf`;document.body.appendChild(anchor);anchor.click();anchor.remove();
      window.setTimeout(()=>URL.revokeObjectURL(url),60000);
      return;
    }
    const rows=[["KPI","Value"],...Object.entries(data.kpis),[],["Top Product","Units","Revenue"],...data.topProducts.map(x=>[x.name,x.units,x.revenue])];
    const csv=rows.map(row=>row.map(cell=>`"${String(cell??"").replaceAll('"','""')}"`).join(",")).join("\n");
    const url=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));const a=document.createElement("a");a.href=url;a.download="retail-analytics-report.csv";a.click();URL.revokeObjectURL(url);
  };
  const kpis=useMemo(()=>data?[["Total Revenue",money(data.kpis.totalRevenue),<PaymentsIcon/>],["Total Orders",data.kpis.totalOrders?.toLocaleString("en-IN"),<ShoppingCartIcon/>],["Total Products Sold",data.kpis.totalProductsSold?.toLocaleString("en-IN"),<InventoryIcon/>],["Average Order Value",money(data.kpis.averageOrderValue),<TrendingUpIcon/>],["Total Inventory Value",money(data.kpis.totalInventoryValue),<PaymentsIcon/>],["Low Stock Products",data.kpis.lowStockProducts,<WarningIcon/>],["Out of Stock Products",data.kpis.outOfStockProducts,<WarningIcon/>],["Total Categories",data.kpis.totalCategories,<CategoryIcon/>]]:[],[data]);
  if(query.isLoading)return <LoadingSpinner message="Building your analytics dashboard..." />;
  if(query.isError)return <Box className="analytics-error"><WarningIcon/><h2>Analytics could not be loaded</h2><p>Please confirm the API is running, then try again.</p><Button onClick={()=>query.refetch()}>Try again</Button></Box>;
  if(!data)return null;
  const maxTrend=Math.max(...data.trend.map(x=>x.revenue),1);
  const maxSales=Math.max(...data.trend.map(x=>x.sales),1);
  const activeInterval=filters.interval||"daily";
  const changeInterval=(interval:string)=>{setDraft(v=>({...v,interval}));setFilters(v=>({...v,interval}));};
  return <Box className="analytics-page">
    <Box className="analytics-header"><Box><Typography component="h1">Retail Analytics</Typography><Typography>Sales and inventory performance for your company</Typography></Box>
      <Box className="analytics-actions"><Button startIcon={<RefreshIcon/>} onClick={()=>query.refetch()}>Refresh</Button><Button startIcon={<DownloadIcon/>} onClick={()=>exportReport("CSV")}>CSV</Button><Button variant="contained" startIcon={<DownloadIcon/>} onClick={()=>exportReport("PDF")}>PDF</Button></Box>
    </Box>
    <Card className="analytics-filter-card"><CardContent>
      <TextField type="date" label="From" slotProps={{inputLabel:{shrink:true}}} value={draft.startDate||""} onChange={e=>update("startDate",e.target.value)}/>
      <TextField type="date" label="To" slotProps={{inputLabel:{shrink:true}}} value={draft.endDate||""} onChange={e=>update("endDate",e.target.value)}/>
      <TextField select label="Product" value={draft.productId||""} onChange={e=>update("productId",e.target.value)}><MenuItem value="">All Products</MenuItem>{data.options.products.map(x=><MenuItem key={x.id} value={x.id}>{x.name}</MenuItem>)}</TextField>
      <TextField select label="Category" value={draft.categoryId||""} onChange={e=>update("categoryId",e.target.value)}><MenuItem value="">All Categories</MenuItem>{data.options.categories.map(x=><MenuItem key={x.id} value={x.id}>{x.name}</MenuItem>)}</TextField>
      <TextField select label="Brand" value={draft.brand||""} onChange={e=>update("brand",e.target.value)}><MenuItem value="">All Brands</MenuItem>{data.options.brands.map(x=><MenuItem key={x} value={x}>{x}</MenuItem>)}</TextField>
      <TextField select label="Sales Channel" value={draft.salesChannel||""} onChange={e=>update("salesChannel",e.target.value)}><MenuItem value="">All Channels</MenuItem>{["RETAIL_STORE","ONLINE_STORE","MARKETPLACE"].map(x=><MenuItem key={x} value={x}>{label(x)}</MenuItem>)}</TextField>
      <TextField className="analytics-payment-filter" select label="Payment" value={draft.paymentMethod||""} onChange={e=>update("paymentMethod",e.target.value)}><MenuItem value="">All Methods</MenuItem>{["CASH","CARD","UPI","BANK_TRANSFER"].map(x=><MenuItem key={x} value={x}>{label(x)}</MenuItem>)}</TextField>
      <Box className="filter-buttons"><Button variant="contained" onClick={apply}>Apply Filters</Button><Button onClick={clear}>Clear</Button></Box>
    </CardContent></Card>
    <Box className="analytics-kpis">{kpis.map(([name,value,icon])=><Card key={String(name)} role="button" tabIndex={0} onClick={()=>setDetail({title:String(name),rows: name==="Low Stock Products"?data.lowStock:name==="Out of Stock Products"?data.outOfStock:data.topProducts})}><CardContent><i>{icon}</i><Box><span>{name}</span><strong>{value}</strong><small>Click to view details</small></Box></CardContent></Card>)}</Box>
    <Typography component="h2" className="analytics-section-title">Sales Analytics</Typography>
    <Box className="analytics-grid analytics-grid--sales">
      <Card className={`analytics-panel analytics-panel--wide ${query.isFetching?"trend-loading":""}`}><CardContent><Box className="panel-title"><Box><h3>Revenue & Sales Trend</h3><Box className="trend-legend"><span>Revenue</span><span>Units sold</span></Box></Box><TextField className="trend-period-select" select size="small" value={activeInterval} onChange={event=>changeInterval(event.target.value)} inputProps={{"aria-label":"Trend period"}}>{["daily","weekly","monthly"].map(interval=><MenuItem value={interval} key={interval}>{label(interval)}</MenuItem>)}</TextField></Box>
        {data.trend.length?<Box className="trend-chart">{data.trend.map(x=><Box className="trend-point" key={x.label} title={`${trendLabel(x.label,activeInterval)}: ${money(x.revenue)}, ${x.sales} units, ${x.orders} orders`}><Box className="trend-columns"><i className="trend-revenue" style={{height:`${Math.max(x.revenue/maxTrend*100,4)}%`}}/><i className="trend-sales" style={{height:`${Math.max(x.sales/maxSales*100,4)}%`}}/></Box><strong>{money(x.revenue)}</strong><span>{trendLabel(x.label,activeInterval)}</span></Box>)}</Box>:<Empty text="Record a sale or broaden the date range."/ >}</CardContent></Card>
      <Card className="analytics-panel"><CardContent><h3>Top 10 Best Selling Products</h3>{data.topProducts.length?<Box className="rank-list">{data.topProducts.map((x,i)=><button key={x.name} onClick={()=>setDetail({title:`${x.name} transactions`,rows:x.transactions})}><b>{i+1}</b><span>{x.name}<small>{money(x.revenue)}</small></span><strong>{x.units}</strong></button>)}</Box>:<Empty text="No products were sold in this period."/>}</CardContent></Card>
      <Card className="analytics-panel"><CardContent><h3>Top Performing Categories</h3><DonutChart items={data.topCategories} valueKey="revenue" centerLabel="Revenue" moneyValues onItemClick={item=>setDetail({title:`${item.name} category`,rows:[{...item}]})}/></CardContent></Card>
      <Card className="analytics-panel"><CardContent><h3>Sales by Payment Method</h3><DonutChart items={data.paymentMethods} centerLabel="Revenue" moneyValues/></CardContent></Card>
      <Card className="analytics-panel"><CardContent><h3>Sales by Sales Channel</h3><DonutChart items={data.salesChannels} centerLabel="Revenue" moneyValues/></CardContent></Card>
    </Box>
    <Typography component="h2" className="analytics-section-title">Inventory Analytics</Typography>
    <Box className="analytics-grid">
      <Card className="analytics-panel"><CardContent><h3>Inventory Distribution by Category</h3><DonutChart items={data.inventoryByCategory} valueKey="quantity" centerLabel="Units"/></CardContent></Card>
      <Card className="analytics-panel"><CardContent><h3>Stock Status Summary</h3><DonutChart items={data.stockStatus} centerLabel="Products"/></CardContent></Card>
      <Card className="analytics-panel"><CardContent><h3>Inventory Value by Category</h3><DonutChart items={data.inventoryByCategory} centerLabel="Total Value" moneyValues/></CardContent></Card>
      <Card className="analytics-panel"><CardContent><h3>Top Low Stock Products</h3>{data.lowStock.length?<Box className="stock-table">{data.lowStock.map(x=><button key={x.productId} onClick={()=>setDetail({title:x.name,rows:[x]})}><span>{x.name}<small>{x.sku}</small></span><b>{x.stock} / {x.reorderLevel}</b></button>)}</Box>:<Empty text="No low-stock products."/ >}</CardContent></Card>
      <Card className="analytics-panel"><CardContent><h3>Out of Stock Products</h3>{data.outOfStock.length?<Box className="stock-table">{data.outOfStock.map(x=><button key={x.productId} onClick={()=>setDetail({title:x.name,rows:[x]})}><span>{x.name}<small>{x.sku}</small></span><b className="danger">Out of stock</b></button>)}</Box>:<Empty text="No products are out of stock."/ >}</CardContent></Card>
    </Box>
    <Box className="analytics-updated">Auto-refreshes every 30 seconds · Last updated {new Date(data.lastUpdated).toLocaleString("en-IN")}</Box>
    <Dialog open={Boolean(detail)} onClose={()=>setDetail(null)} fullWidth maxWidth="md"><DialogTitle>{detail?.title}</DialogTitle><DialogContent>{detail?.rows.length?<Box className="detail-table">{detail.rows.map((row,i)=><Box key={i}>{Object.entries(row).filter(([key])=>key!=="transactions"&&key!=="id"&&key!=="productId").map(([key,value])=><span key={key}><small>{label(key)}</small>{typeof value==="number"?value.toLocaleString("en-IN"):String(value)}</span>)}</Box>)}</Box>:<Empty text="No matching detail records."/>}</DialogContent></Dialog>
  </Box>;
}
