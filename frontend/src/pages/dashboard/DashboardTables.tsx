/* Teaching guide: This file contains dashboard tables page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
// Renders the dashboard tables data and related row actions.
import { Box, Card, CardContent, Typography } from "@mui/material";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import { BEST_SELLERS, RECENT_ORDERS } from "./dashboardData";

// This component receives prepared data and renders the feature-specific interface.
export default function DashboardTables() {
  return (
    <Box className="dashboard-tables-row">
      <Card className="overview-panel products-table-card">
        <CardContent>
          <Typography component="h2">Best Selling Products</Typography>
          <Box className="products-table">
            <Box className="products-row products-head">
              <span>Product</span>
              <span>Category</span>
              <span>Revenue</span>
              <span>Units Sold</span>
              <span>Trend</span>
            </Box>
            {BEST_SELLERS.map((row, index) => (
              <Box className="products-row" key={row[0]}>
                <span>
                  <i className={`product-thumb product-thumb--${index + 1}`}>
                    <Inventory2OutlinedIcon />
                  </i>
                  {row[0]}
                </span>
                <span>{row[1]}</span>
                <strong>{row[2]}</strong>
                <span>{row[3]}</span>
                <svg viewBox="0 0 80 20">
                  <polyline points="0,14 12,10 23,13 34,5 46,11 58,7 70,12 80,9" />
                </svg>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
      <Card className="overview-panel recent-orders-card">
        <CardContent>
          <Typography component="h2">Recent Orders</Typography>
          <Box className="recent-orders-table">
            <Box className="recent-order recent-head">
              <span>Order ID</span>
              <span>Customer</span>
              <span>Amount</span>
              <span>Status</span>
            </Box>
            {RECENT_ORDERS.map((row) => (
              <Box className="recent-order" key={row[0]}>
                {row.map((cell, index) => (
                  <span
                    key={cell}
                    className={
                      index === 3
                        ? `order-status order-status--${cell.toLowerCase()}`
                        : ""
                    }
                  >
                    {cell}
                  </span>
                ))}
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
