// Renders the dashboard breakdown section for the dashboard feature.
import { Box, Card, CardContent, Typography } from "@mui/material";
import { SALES_CHANNELS, TOP_CATEGORIES } from "./dashboardData";

// This component receives prepared data and renders the feature-specific interface.
export default function DashboardBreakdown() {
  return (
    <Box className="dashboard-analytics-row">
      <Card className="overview-panel channel-card">
        <CardContent>
          <Box className="dashboard-panel-title">
            <Typography component="h2">Sales by Channel</Typography>
            <button>Last 30 Days⌄</button>
          </Box>
          <Box className="sales-channel-bars">
            {SALES_CHANNELS.map(([label, amount, height]) => (
              <Box key={label}>
                <strong>{amount}</strong>
                <i style={{ height: `${height}%` }} />
                <span>{label}</span>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
      <Card className="overview-panel categories-card">
        <CardContent>
          <Typography component="h2">Top Selling Categories</Typography>
          <Box className="categories-content">
            <Box className="categories-donut">
              <Box>
                <strong>2.45M</strong>
                <span>Total</span>
              </Box>
            </Box>
            <Box className="categories-legend">
              {TOP_CATEGORIES.map(([label, value]) => (
                <Box key={label}>
                  <span>
                    <i />
                    {label}
                  </span>
                  <strong>{value}</strong>
                </Box>
              ))}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
