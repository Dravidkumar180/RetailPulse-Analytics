// Renders the sales overview chart section for the dashboard feature.
import { Box, Card, CardContent, Typography } from "@mui/material";

// This component receives prepared data and renders the feature-specific interface.
const revenuePoints = [
  "0,165 40,190 80,145 120,115 160,135 200,105 240,150",
  "280,175 320,180 360,155 400,125 440,105 480,125 520,78",
  "560,42 600,72 640,112 680,145 720,85 760,35 800,75",
  "840,55 880,98 920,128 960,70 1000,38",
].join(" ");

const orderPoints = [
  "0,210 40,220 80,205 120,175 160,182 200,158 240,175",
  "280,205 320,220 360,205 400,180 440,165 480,188 520,142",
  "560,105 600,138 640,178 680,210 720,170 760,142 800,165",
  "840,148 880,175 920,185 960,125 1000,98",
].join(" ");

export default function SalesOverviewChart() {
  return (
    <Card className="overview-panel sales-overview-card">
      <CardContent>
        <Box className="dashboard-panel-title">
          <Typography component="h2">Sales Overview</Typography>
          <button>Last 30 Days⌄</button>
        </Box>
        <Box className="sales-overview-legend">
          <span>Revenue</span>
          <span>Orders</span>
        </Box>
        <Box className="sales-overview-chart">
          <Box className="sales-axis">
            {["₹100K", "₹80K", "₹60K", "₹40K", "₹20K", "₹0"].map((value) => (
              <span key={value}>{value}</span>
            ))}
          </Box>
          <svg viewBox="0 0 1000 260" preserveAspectRatio="none">
            <path
              className="grid"
              d="M0 10H1000 M0 60H1000 M0 110H1000 M0 160H1000 M0 210H1000 M0 260H1000"
            />
            <polyline
              className="revenue"
              points={revenuePoints}
            />
            <polyline
              className="orders"
              points={orderPoints}
            />
          </svg>
          <Box className="sales-dates">
            {[
              "01 May",
              "05 May",
              "10 May",
              "15 May",
              "20 May",
              "25 May",
              "31 May",
            ].map((date) => (
              <span key={date}>{date}</span>
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
