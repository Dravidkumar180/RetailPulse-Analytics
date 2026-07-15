import { useQuery } from "@tanstack/react-query";
import { Box, Card, CardContent, Typography } from "@mui/material";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";

import { getCompanyDashboardSummary, type CompanyDashboardSummary } from "../../api/companyApi";
import { getCurrentUserProfile, type UserProfile } from "../../api/profileApi";
import LoadingSpinner from "../../components/common/LoadingSpinner/LoadingSpinner";
import "./DashboardPage.css";

const DashboardPage = () => {
  const summaryQuery = useQuery<CompanyDashboardSummary>({ queryKey: ["company-dashboard-summary"], queryFn: getCompanyDashboardSummary });
  const profileQuery = useQuery<UserProfile>({ queryKey: ["current-user-profile"], queryFn: getCurrentUserProfile });
  if (summaryQuery.isLoading || profileQuery.isLoading) return <LoadingSpinner message="Loading dashboard..." />;

  const summary = summaryQuery.data;
  const profile = profileQuery.data;
  const primaryMetrics = [
    [summary?.totalSales ? `₹${summary.totalSales.toLocaleString("en-IN")}` : "₹12.45M", "Total Sales", "+12% from last month"],
    ["8,652", "Total Orders", "+8% from last month"],
    [summary?.totalUsers?.toLocaleString("en-IN") || "1", "Total Customers", "+15% from last month"],
    [summary?.totalProducts?.toLocaleString("en-IN") || "0", "Total Products", "+5% from last month"],
  ];
  const compactMetrics = [
    [<Inventory2OutlinedIcon />, "24", "Low Stock Items"],
    [<ShoppingCartOutlinedIcon />, "18", "Pending Orders"],
    [<PeopleOutlineIcon />, "326", "Repeat Customers"],
    [<AssessmentOutlinedIcon />, summary?.totalReports?.toLocaleString("en-IN") || "0", "Generated Reports"],
  ];

  return <Box className="overview-dashboard">
    <Box className="overview-dashboard__header"><Box><Typography component="h1">Dashboard</Typography><Typography component="p">Welcome back, {profile?.name ?? "Admin"}! Here&apos;s what&apos;s happening at {profile?.company.name ?? "your company"}.</Typography></Box><Box className="overview-dashboard__date">{new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "2-digit", month: "short", year: "numeric" }).format(new Date())}</Box></Box>

    <Box className="overview-dashboard__primary">{primaryMetrics.map(([value, label, change]) => <Card key={String(label)}><CardContent><strong>{value}</strong><span>{label}</span><small>{change}</small></CardContent></Card>)}</Box>
    <Box className="overview-dashboard__compact">{compactMetrics.map(([icon, value, label]) => <Card key={String(label)}><CardContent><i>{icon}</i><Box><strong>{value}</strong><span>{label}</span></Box></CardContent></Card>)}</Box>

    <Box className="dashboard-analytics-row">
      <Card className="overview-panel channel-card"><CardContent><Box className="dashboard-panel-title"><Typography component="h2">Sales by Channel</Typography><button>Last 30 Days⌄</button></Box><Box className="sales-channel-bars">{[["Online Store", "$982K", 100], ["Amazon", "$642K", 68], ["Retail Outlet", "$512K", 54], ["Flipkart", "$314K", 34]].map(([label, amount, height]) => <Box key={String(label)}><strong>{amount}</strong><i style={{ height: `${height}%` }} /><span>{label}</span></Box>)}</Box></CardContent></Card>

      <Card className="overview-panel categories-card"><CardContent><Typography component="h2">Top Selling Categories</Typography><Box className="categories-content"><Box className="categories-donut"><Box><strong>2.45M</strong><span>Total</span></Box></Box><Box className="categories-legend">{[["Electronics", "35%"], ["Fashion", "25%"], ["Home & Kitchen", "20%"], ["Beauty", "10%"], ["Others", "10%"]].map(([label, value]) => <Box key={label}><span><i />{label}</span><strong>{value}</strong></Box>)}</Box></Box></CardContent></Card>
    </Box>

    <Card className="overview-panel sales-overview-card"><CardContent><Box className="dashboard-panel-title"><Typography component="h2">Sales Overview</Typography><button>Last 30 Days⌄</button></Box><Box className="sales-overview-legend"><span>Revenue</span><span>Orders</span></Box><Box className="sales-overview-chart"><Box className="sales-axis"><span>$100K</span><span>$80K</span><span>$60K</span><span>$40K</span><span>$20K</span><span>$0</span></Box><svg viewBox="0 0 1000 260" preserveAspectRatio="none"><path className="grid" d="M0 10H1000 M0 60H1000 M0 110H1000 M0 160H1000 M0 210H1000 M0 260H1000"/><polyline className="revenue" points="0,165 40,190 80,145 120,115 160,135 200,105 240,150 280,175 320,180 360,155 400,125 440,105 480,125 520,78 560,42 600,72 640,112 680,145 720,85 760,35 800,75 840,55 880,98 920,128 960,70 1000,38"/><polyline className="orders" points="0,210 40,220 80,205 120,175 160,182 200,158 240,175 280,205 320,220 360,205 400,180 440,165 480,188 520,142 560,105 600,138 640,178 680,210 720,170 760,142 800,165 840,148 880,175 920,185 960,125 1000,98"/></svg><Box className="sales-dates"><span>01 May</span><span>05 May</span><span>10 May</span><span>15 May</span><span>20 May</span><span>25 May</span><span>31 May</span></Box></Box></CardContent></Card>

    <Box className="dashboard-tables-row">
      <Card className="overview-panel products-table-card"><CardContent><Typography component="h2">Best Selling Products</Typography><Box className="products-table"><Box className="products-row products-head"><span>Product</span><span>Category</span><span>Revenue</span><span>Units Sold</span><span>Trend</span></Box>{[["Sony WH-1000XM5", "Electronics", "$245,800", "1,245"], ["Apple AirPods Pro", "Electronics", "$198,500", "1,103"], ["Nike Air Max 270", "Fashion", "$154,300", "980"], ["Samsung Galaxy S23", "Electronics", "$142,600", "876"], ["Adidas Ultraboost 22", "Fashion", "$112,400", "765"]].map((row, index) => <Box className="products-row" key={row[0]}><span><i className={`product-thumb product-thumb--${index + 1}`}><Inventory2OutlinedIcon /></i>{row[0]}</span><span>{row[1]}</span><strong>{row[2]}</strong><span>{row[3]}</span><svg viewBox="0 0 80 20"><polyline points="0,14 12,10 23,13 34,5 46,11 58,7 70,12 80,9" /></svg></Box>)}</Box></CardContent></Card>

      <Card className="overview-panel recent-orders-card"><CardContent><Typography component="h2">Recent Orders</Typography><Box className="recent-orders-table"><Box className="recent-order recent-head"><span>Order ID</span><span>Customer</span><span>Amount</span><span>Status</span></Box>{[["#ORD-001", "John Smith", "₹12,450", "Delivered"], ["#ORD-002", "Sarah Johnson", "₹8,990", "Processing"], ["#ORD-003", "Mike Brown", "₹15,230", "Shipped"], ["#ORD-004", "Emily Davis", "₹7,450", "Delivered"]].map((row) => <Box className="recent-order" key={row[0]}>{row.map((cell, index) => <span key={cell} className={index === 3 ? `order-status order-status--${cell.toLowerCase()}` : ""}>{cell}</span>)}</Box>)}</Box></CardContent></Card>
    </Box>
  </Box>;
};

export default DashboardPage;
