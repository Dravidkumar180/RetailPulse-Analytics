/* Teaching guide: This file contains customer analytics page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
// Renders the customer analytics section for the customers feature.
import { useState } from "react";
import { Box } from "@mui/material";
import type {
  Customer,
  CustomerAnalytics as CustomerAnalyticsData,
} from "../../api/customerApi";
import {
  Donut,
  GrowthLine,
  LocationMap,
  MiniBars,
  money,
} from "./customerShared";
// This component receives prepared data and renders the feature-specific interface.
export default function CustomerAnalytics({
  data,
  customers,
}: {
  data?: CustomerAnalyticsData;
  customers: Customer[];
}) {
  const [growthPeriod, setGrowthPeriod] = useState<"day" | "month" | "year">(
    "month",
  );
  const [comparisonPeriod, setComparisonPeriod] = useState<
    "day" | "month" | "year"
  >("month");
  const [topRevenuePeriod, setTopRevenuePeriod] = useState<
    "day" | "month" | "year"
  >("month");
  if (!data) return <Box className="customer-empty">Loading analyticsâ€¦</Box>;
  const k = [
    ["Total Customers", data.kpis.totalCustomers],
    ["Active Customers", data.kpis.activeCustomers],
    ["New Customers (This Month)", data.kpis.newCustomers],
    ["Returning Customers", data.kpis.returningCustomers],
    ["Average Customer Spend", money(data.kpis.averageCustomerSpend)],
    ["Total Revenue Generated", money(data.kpis.totalRevenue)],
    [
      "Average Purchase Frequency",
      `${data.kpis.averagePurchaseFrequency.toFixed(1)} / Month`,
    ],
  ];
  const now = new Date();
  const growthBuckets = (() => {
    if (growthPeriod === "day")
      return Array.from({ length: 7 }, (_, offset) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (6 - offset));
        return {
          name: d.toLocaleDateString("en-IN", { weekday: "short" }),
          year: d.getFullYear(),
          month: d.getMonth(),
          day: d.getDate(),
        };
      });
    if (growthPeriod === "year")
      return Array.from({ length: 5 }, (_, offset) => {
        const year = now.getFullYear() - (4 - offset);
        return { name: String(year), year, month: -1, day: -1 };
      });
    return Array.from({ length: 6 }, (_, offset) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - offset), 1);
      return {
        name: d.toLocaleDateString("en-IN", { month: "short" }),
        year: d.getFullYear(),
        month: d.getMonth(),
        day: -1,
      };
    });
  })();
  const growthData = growthBuckets.map((bucket) => ({
    name: bucket.name,
    value: customers.filter((customer) => {
      const d = new Date(customer.createdAt);
      return (
        d.getFullYear() === bucket.year &&
        (bucket.month < 0 || d.getMonth() === bucket.month) &&
        (bucket.day < 0 || d.getDate() === bucket.day)
      );
    }).length,
  }));
  const isInComparisonPeriod = (value?: string) => {
    if (!value) return false;
    const d = new Date(value);
    if (comparisonPeriod === "day")
      return d.toDateString() === now.toDateString();
    if (comparisonPeriod === "year")
      return d.getFullYear() === now.getFullYear();
    return (
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    );
  };
  const comparisonData = [
    {
      name: "New Customers",
      value: customers.filter((customer) =>
        isInComparisonPeriod(customer.createdAt),
      ).length,
    },
    {
      name: "Returning Customers",
      value: customers.filter(
        (customer) =>
          customer.summary.totalOrders > 1 &&
          isInComparisonPeriod(customer.summary.lastPurchaseDate),
      ).length,
    },
  ];
  const frequency = [
    {
      name: "0-1",
      value: customers.filter((x) => x.summary.totalOrders <= 1).length,
    },
    {
      name: "2-3",
      value: customers.filter(
        (x) => x.summary.totalOrders >= 2 && x.summary.totalOrders <= 3,
      ).length,
    },
    {
      name: "4-6",
      value: customers.filter(
        (x) => x.summary.totalOrders >= 4 && x.summary.totalOrders <= 6,
      ).length,
    },
    {
      name: "7-10",
      value: customers.filter(
        (x) => x.summary.totalOrders >= 7 && x.summary.totalOrders <= 10,
      ).length,
    },
    {
      name: "11+",
      value: customers.filter((x) => x.summary.totalOrders >= 11).length,
    },
  ];
  const spending = [
    {
      name: "â‚¹0 - â‚¹1K",
      value: customers.filter((x) => x.summary.totalRevenue <= 1000).length,
    },
    {
      name: "â‚¹1K - â‚¹5K",
      value: customers.filter(
        (x) => x.summary.totalRevenue > 1000 && x.summary.totalRevenue <= 5000,
      ).length,
    },
    {
      name: "â‚¹5K - â‚¹10K",
      value: customers.filter(
        (x) => x.summary.totalRevenue > 5000 && x.summary.totalRevenue <= 10000,
      ).length,
    },
    {
      name: "â‚¹10K+",
      value: customers.filter((x) => x.summary.totalRevenue > 10000).length,
    },
  ];
  return (
    <>
      <Box className="customer-kpis">
        {k.map(([label, value]) => (
          <Box key={String(label)}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>â†— Live company data</small>
          </Box>
        ))}
      </Box>
      <Box className="customer-charts customer-charts--reference">
        <article>
          <Box className="chart-title">
            <h3>Customer Growth Trend</h3>
            <select
              aria-label="Customer growth period"
              value={growthPeriod}
              onChange={(event) =>
                setGrowthPeriod(event.target.value as "day" | "month" | "year")
              }
            >
              <option value="day">Last 7 Days</option>
              <option value="month">Last 6 Months</option>
              <option value="year">Last 5 Years</option>
            </select>
          </Box>
          <GrowthLine data={growthData} />
        </article>
        <article>
          <Box className="chart-title">
            <h3>New vs Returning Customers</h3>
            <select
              aria-label="Customer comparison period"
              value={comparisonPeriod}
              onChange={(event) =>
                setComparisonPeriod(
                  event.target.value as "day" | "month" | "year",
                )
              }
            >
              <option value="day">Today</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </Box>
          <Donut data={comparisonData} centerLabel="Total Customers" />
        </article>
        <article>
          <h3>Revenue by Customer Type</h3>
          <Donut
            data={data.revenueByType}
            centerLabel="Total Revenue"
            moneyTotal
          />
        </article>
        <article>
          <Box className="chart-title">
            <h3>Top 10 Customers by Revenue</h3>
            <select
              aria-label="Top customer revenue period"
              value={topRevenuePeriod}
              onChange={(event) =>
                setTopRevenuePeriod(
                  event.target.value as "day" | "month" | "year",
                )
              }
            >
              <option value="day">Today</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </Box>
          <MiniBars
            data={
              data.topCustomersByPeriod?.[topRevenuePeriod] ?? data.topCustomers
            }
            moneyValue
          />
        </article>
        <article>
          <h3>Customer Purchase Frequency</h3>
          <MiniBars data={frequency} />
        </article>
        <article>
          <h3>Customer Distribution by Location</h3>
          <LocationMap data={data.locations} />
        </article>
        <article>
          <h3>Monthly Customer Acquisition</h3>
          <MiniBars data={data.acquisition.slice(-6)} />
        </article>
        <article>
          <h3>Customer Spending Distribution</h3>
          <Donut data={spending} centerLabel="Total Customers" />
        </article>
        <article>
          <h3>Customer Segmentation</h3>
          <Donut data={data.segments} centerLabel="Total Customers" />
        </article>
      </Box>
    </>
  );
}
