/* Teaching guide: This file contains demand forecast visualizations page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
// Provides the Demand Forecast Visualizations UI for the forecasting feature.
import { useState } from "react";
import { Box, MenuItem, Select } from "@mui/material";
import type { ForecastProduct } from "../../api/forecastApi";
type Range = "today" | "30" | "year";
// This component receives prepared data and renders the feature-specific interface.
const fmt = (v: number) => new Intl.NumberFormat("en-IN").format(v);
const factor = (r: Range) => (r === "today" ? 1 / 30 : r === "year" ? 12 : 1);
const variation = (r: Range, i: number) =>
  r === "today"
    ? 0.72 + (i % 3) * 0.19
    : r === "year"
      ? 0.68 + ((i * 7) % 5) * 0.13
      : 0.88 + (i % 4) * 0.06;
const scale = (v: number, r: Range, m = 1) =>
  Math.max(0, Math.round(v * factor(r) * m));
function Sparkline({
  values,
  forecast = false,
}: {
  values: number[];
  forecast?: boolean;
}) {
  const max = Math.max(...values, 1),
    points = values
      .map(
        (v, i) =>
          `${(i / Math.max(values.length - 1, 1)) * 100},${46 - (v / max) * 38}`,
      )
      .join(" ");
  return (
    <svg
      className="forecast-chart__svg"
      viewBox="0 0 100 50"
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke={forecast ? "#10b981" : "#2563eb"}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
function RangeSelect({
  value,
  onChange,
}: {
  value: Range;
  onChange: (v: Range) => void;
}) {
  return (
    <Select
      className="chart-range-select"
      size="small"
      value={value}
      onChange={(e) => onChange(e.target.value as Range)}
    >
      {[
        ["today", "Today"],
        ["30", "Next 30 Days"],
        ["year", "Year"],
      ].map(([v, l]) => (
        <MenuItem key={v} value={v}>
          {l}
        </MenuItem>
      ))}
    </Select>
  );
}
export default function DemandForecastVisualizations({
  products,
  categories,
}: {
  products: ForecastProduct[];
  categories: {
    name: string;
    historicalSales: number;
    predictedDemand: number;
  }[];
}) {
  const [sales, setSales] = useState<Range>("30"),
    [productRange, setProductRange] = useState<Range>("30"),
    [categoryRange, setCategoryRange] = useState<Range>("30");
  const top = products.slice(0, 10),
    max = Math.max(...top.map((p) => p.predictedDemand), 1),
    categoryValues = categories.map((c, i) => ({
      ...c,
      historicalSales: scale(
        c.historicalSales,
        categoryRange,
        variation(categoryRange, i),
      ),
      predictedDemand: scale(
        c.predictedDemand,
        categoryRange,
        variation(categoryRange, i + 2),
      ),
    })),
    categoryMax = Math.max(
      ...categoryValues.flatMap((c) => [c.historicalSales, c.predictedDemand]),
      1,
    );
  return (
    <Box className="visualization-grid">
      <Box className="forecast-card chart-card">
        <Box className="chart-card__header">
          <h2>Historical Sales vs Forecast</h2>
          <RangeSelect value={sales} onChange={setSales} />
        </Box>
        <div className="chart-legend">
          <span className="blue">Historical Sales</span>
          <span className="green">Forecasted Sales</span>
        </div>
        <Box className="dual-chart">
          <Sparkline
            values={products
              .slice(0, 8)
              .map((p, i) =>
                scale(p.historicalSales, sales, variation(sales, i)),
              )}
          />
          <Sparkline
            forecast
            values={products
              .slice(0, 8)
              .map((p, i) =>
                scale(p.predictedDemand, sales, variation(sales, i + 2)),
              )}
          />
        </Box>
      </Box>
      <Box className="forecast-card chart-card">
        <Box className="chart-card__header">
          <h2>Product Demand Trend (Top 5 Products)</h2>
          <RangeSelect value={productRange} onChange={setProductRange} />
        </Box>
        {products.slice(0, 5).map((p, i) => (
          <div className="mini-trend" key={p.id}>
            <span>{p.name}</span>
            <Sparkline
              values={[0, 1, 2, 3, 4].map((index) =>
                scale(
                  index < 3 ? p.historicalSales : p.predictedDemand,
                  productRange,
                  variation(productRange, index + i),
                ),
              )}
              forecast={i % 2 === 1}
            />
          </div>
        ))}
      </Box>
      <Box className="forecast-card chart-card">
        <Box className="chart-card__header">
          <h2>Category Demand Trend</h2>
          <RangeSelect value={categoryRange} onChange={setCategoryRange} />
        </Box>
        <Box className="category-bars">
          {categoryValues.map((c) => (
            <div
              key={c.name}
              title={`${c.name}: ${fmt(c.historicalSales)} historical, ${fmt(c.predictedDemand)} forecast`}
            >
              <span>{c.name}</span>
              <i
                style={{
                  height: `${Math.max(8, (c.historicalSales / categoryMax) * 100)}%`,
                }}
              />
              <b
                style={{
                  height: `${Math.max(8, (c.predictedDemand / categoryMax) * 100)}%`,
                }}
              />
            </div>
          ))}
        </Box>
      </Box>
      <Box className="forecast-card chart-card top-products">
        <h2>Top Predicted Products</h2>
        {top.map((p, i) => (
          <div key={p.id}>
            <span>
              {i + 1}. {p.name}
            </span>
            <i>
              <b style={{ width: `${(p.predictedDemand / max) * 100}%` }} />
            </i>
            <strong>{fmt(p.predictedDemand)}</strong>
          </div>
        ))}
      </Box>
      <Box className="forecast-card chart-card seasonal">
        <h2>Seasonal Sales Pattern (All Categories)</h2>
        <Box className="heatmap">
          <span />
          {[
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ].map((m) => (
            <b key={m}>{m}</b>
          ))}
          {categories
            .slice(0, 5)
            .flatMap((c, row) => [
              <strong key={`${c.name}-name`}>{c.name}</strong>,
              ...Array.from({ length: 12 }, (_, col) => (
                <i
                  key={`${c.name}-${col}`}
                  style={{ opacity: 0.22 + ((row * 7 + col * 3) % 8) / 10 }}
                />
              )),
            ])}
        </Box>
      </Box>
    </Box>
  );
}
