/* Teaching guide: This file contains analytics dashboard panels page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
// Renders the charts and ranking panels shown on the analytics dashboard.
import {
  Box,
  Card,
  CardContent,
  MenuItem,
  Skeleton,
  TextField,
} from "@mui/material";
import type {
  AnalyticsDashboard,
  AnalyticsFilters,
} from "../../api/analyticsApi";
import {
  AnalyticsEmpty,
  AnalyticsTableSkeleton,
  money,
  title,
  trendLabel,
} from "./analyticsUtils";

type Product = AnalyticsDashboard["topProducts"][number];
type SortOption = "revenue" | "units";
type Interval = "daily" | "weekly" | "monthly";

type Props = {
  data?: AnalyticsDashboard;
  products: Product[];
  sort: SortOption;
  interval: AnalyticsFilters["interval"];
  loading: boolean;
  fetching: boolean;
  onSort: (sort: SortOption) => void;
  onInterval: (interval: Interval) => void;
};

const chartColors = ["#2563eb", "#14b8a6", "#8b5cf6", "#f59e0b", "#ef4444"];

export default function AnalyticsDashboardPanels({
  data,
  products,
  sort,
  interval,
  loading,
  fetching,
  onSort,
  onInterval,
}: Props) {
  // These maximum values convert revenue and order totals into chart heights.
  const maxRevenue = Math.max(
    ...(data?.trend.map((item) => item.revenue) || [1]),
    1,
  );
  const maxOrders = Math.max(
    ...(data?.trend.map((item) => item.orders) || [1]),
    1,
  );

  const totalPayment =
    data?.paymentMethods.reduce((sum, item) => sum + item.revenue, 0) || 0;

  // Build one conic-gradient segment for each payment method.
  let gradientCursor = 0;
  const paymentGradient = data?.paymentMethods
    .map((item, index) => {
      const start = gradientCursor;
      gradientCursor += totalPayment ? (item.revenue / totalPayment) * 100 : 0;

      const color = chartColors[index % chartColors.length];
      return `${color} ${start}% ${gradientCursor}%`;
    })
    .join(",");

  return (
    <Box className="analytics-grid sales-bi-grid">
      <Card className="analytics-panel analytics-panel--wide">
        <CardContent>
          <Box className="panel-title">
            <Box>
              <h3>Sales Overview</h3>
              <small className="chart-subtitle">
                Revenue grouped by {interval}
              </small>
            </Box>

            <Box
              className="trend-periods"
              role="group"
              aria-label="Sales overview interval"
            >
              {(["daily", "weekly", "monthly"] as const).map((value) => (
                <button
                  type="button"
                  className={interval === value ? "active" : ""}
                  aria-pressed={interval === value}
                  disabled={fetching}
                  key={value}
                  onClick={() => onInterval(value)}
                >
                  {title(value)}
                </button>
              ))}
            </Box>
          </Box>

          {loading ? (
            <Skeleton variant="rounded" height={210} />
          ) : data?.trend.length ? (
            <Box className="trend-chart">
              {data.trend.map((item) => (
                <Box
                  key={item.label}
                  title={`${trendLabel(item.label, interval)}: ${money(item.revenue)} · ${item.orders} orders`}
                >
                  <i
                    style={{
                      height: `${Math.max(
                        (item.revenue / maxRevenue) * 100,
                        4,
                      )}%`,
                    }}
                  />
                  <span>{trendLabel(item.label, interval)}</span>
                </Box>
              ))}
            </Box>
          ) : (
            <AnalyticsEmpty text="No sales data available for the selected period." />
          )}
        </CardContent>
      </Card>

      <Card className="analytics-panel">
        <CardContent>
          <h3>Sales vs Orders</h3>

          {loading ? (
            <Skeleton variant="rounded" height={210} />
          ) : data?.trend.length ? (
            <Box className="dual-chart">
              {data.trend.map((item) => (
                <Box
                  key={item.label}
                  title={`${trendLabel(item.label, interval)}: ${money(item.revenue)} · ${item.orders} orders`}
                >
                  <i
                    style={{
                      height: `${Math.max(
                        (item.revenue / maxRevenue) * 100,
                        3,
                      )}%`,
                    }}
                  />
                  <b
                    style={{
                      height: `${Math.max(
                        (item.orders / maxOrders) * 100,
                        3,
                      )}%`,
                    }}
                  />
                  <span>{trendLabel(item.label, interval)}</span>
                </Box>
              ))}
            </Box>
          ) : (
            <AnalyticsEmpty text="Revenue and order volume will appear here." />
          )}
        </CardContent>
      </Card>

      <Card className="analytics-panel">
        <CardContent>
          <Box className="panel-title">
            <h3>Top Performing Products</h3>
            <TextField
              select
              size="small"
              value={sort}
              onChange={(event) => onSort(event.target.value as SortOption)}
            >
              <MenuItem value="revenue">Revenue</MenuItem>
              <MenuItem value="units">Quantity</MenuItem>
            </TextField>
          </Box>

          {loading ? (
            <AnalyticsTableSkeleton />
          ) : products.length ? (
            <Box className="analytics-table">
              <div>
                <b>Product</b>
                <b>Units</b>
                <b>Revenue</b>
              </div>
              {products.slice(0, 10).map((item) => (
                <div key={item.id}>
                  <span>
                    {item.name}
                    <small>{item.sku}</small>
                  </span>
                  <span>{item.units}</span>
                  <span>{money(item.revenue)}</span>
                </div>
              ))}
            </Box>
          ) : (
            <AnalyticsEmpty
              kind="products"
              text="No products found with the selected filters."
            />
          )}
        </CardContent>
      </Card>

      <Card className="analytics-panel analytics-panel--wide">
        <CardContent>
          <h3>Top Customers</h3>

          {loading ? (
            <AnalyticsTableSkeleton columns={4} />
          ) : data?.topCustomers.length ? (
            <Box className="analytics-table customer-table">
              <div>
                <b>Customer</b>
                <b>Orders</b>
                <b>Total Spend</b>
                <b>Avg Order</b>
              </div>
              {data.topCustomers.slice(0, 10).map((item, index) => (
                <div key={`${item.id}-${index}`}>
                  <span>{item.name}</span>
                  <span>{item.orders}</span>
                  <span>{money(item.totalSpend)}</span>
                  <span>{money(item.averageOrderValue)}</span>
                </div>
              ))}
            </Box>
          ) : (
            <AnalyticsEmpty
              kind="customers"
              text="No customers found with the selected filters."
            />
          )}
        </CardContent>
      </Card>

      <Card className="analytics-panel">
        <CardContent>
          <h3>Payment Method Analysis</h3>

          {loading ? (
            <Skeleton
              variant="circular"
              width={150}
              height={150}
              className="donut-skeleton"
            />
          ) : data?.paymentMethods.length ? (
            <Box className="donut-layout">
              <Box
                className="donut-chart"
                style={{
                  background: `conic-gradient(${paymentGradient})`,
                }}
              >
                <Box>
                  <span>Total Revenue</span>
                  <strong>{money(totalPayment)}</strong>
                </Box>
              </Box>

              <Box className="payment-legend">
                {data.paymentMethods.map((item, index) => (
                  <div key={item.name}>
                    <i
                      style={{
                        background: chartColors[index % chartColors.length],
                      }}
                    />
                    <span>
                      {title(item.name)}
                      <small>{item.transactions} transactions</small>
                    </span>
                    <strong>{money(item.revenue)}</strong>
                  </div>
                ))}
              </Box>
            </Box>
          ) : (
            <AnalyticsEmpty
              kind="payments"
              text="No payment transactions in this period."
            />
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
