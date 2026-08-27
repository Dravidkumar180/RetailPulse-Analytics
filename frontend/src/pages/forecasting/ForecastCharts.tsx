// Renders the forecast charts section for the forecasting feature.
import { useEffect, useMemo, useState } from "react";
import { Box } from "@mui/material";
import type {
  InventoryForecastItem,
  StockRisk,
} from "../../api/inventoryForecastApi";
import "./ForecastCharts.css";

type Summary = Record<StockRisk, number> & { total: number };
type Series = {
  values: number[];
  color: string;
  dashed?: boolean;
  markers?: boolean;
};
const riskMeta: [StockRisk, string, string][] = [
  ["OUT_OF_STOCK", "Out of Stock", "#ef4444"],
  ["STOCKOUT_RISK", "Stockout Risk", "#f97316"],
  ["LOW_STOCK", "Low Stock", "#fbbf24"],
  ["HEALTHY", "Healthy", "#10b981"],
  ["OVERSTOCK", "Overstock", "#8b5cf6"],
];
// This component receives prepared data and renders the feature-specific interface.
const shortDate = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

export default function ForecastCharts({
  items,
  summary,
  selectedProductId,
}: {
  items: InventoryForecastItem[];
  summary: Summary;
  selectedProductId?: string;
}) {
  const initial = selectedProductId ?? items[0]?.productId ?? "";
  const [demandId, setDemandId] = useState(initial),
    [stockId, setStockId] = useState(initial);
  useEffect(() => {
    if (selectedProductId) {
      setDemandId(selectedProductId);
      setStockId(selectedProductId);
    }
  }, [selectedProductId]);
  const demand = items.find((x) => x.productId === demandId) ?? items[0],
    stock = items.find((x) => x.productId === stockId) ?? items[0];
  return (
    <Box className="forecast-charts">
      <DemandCard
        item={demand}
        items={items}
        value={demandId}
        onChange={setDemandId}
      />
      <StockCard
        item={stock}
        items={items}
        value={stockId}
        onChange={setStockId}
      />
      <SummaryCard summary={summary} />
    </Box>
  );
}

function ProductSelect({
  items,
  value,
  onChange,
}: {
  items: InventoryForecastItem[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <label className="fc-product">
      <span>Product:</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {items.map((x) => (
          <option key={x.productId} value={x.productId}>
            {x.product} ({x.sku})
          </option>
        ))}
      </select>
    </label>
  );
}

function DemandCard({
  item,
  items,
  value,
  onChange,
}: {
  item: InventoryForecastItem;
  items: InventoryForecastItem[];
  value: string;
  onChange: (id: string) => void;
}) {
  const history = item?.historicalDemand ?? [],
    forecast = item?.forecastDemand ?? [];
  const historyValues = history.map((x) => x.quantity),
    forecastValues = forecast.map((x) => x.quantity);
  const dates = [...history.map((x) => x.date), ...forecast.map((x) => x.date)];
  const combinedHistory = [...historyValues, ...forecastValues.map(() => NaN)],
    combinedForecast = [
      ...historyValues.map((_, i) =>
        i === historyValues.length - 1 ? historyValues[i] : NaN,
      ),
      ...forecastValues,
    ];
  return (
    <section className="fc-card">
      <header>
        <h3>Demand Forecast</h3>
        <ProductSelect items={items} value={value} onChange={onChange} />
      </header>
      <div className="fc-legend">
        <span className="historical">Historical Demand</span>
        <span className="forecast">Forecasted Demand</span>
      </div>
      <p className="fc-axis-title">Units Sold</p>
      <Chart
        series={[
          { values: combinedHistory, color: "#2563eb", markers: true },
          {
            values: combinedForecast,
            color: "#10b981",
            dashed: true,
            markers: true,
          },
        ]}
        dates={dates}
      />
      <div className="fc-periods">
        <span>Past (Historical)</span>
        <span>Future (Forecast)</span>
      </div>
      {!item?.hasSalesHistory && (
        <div className="fc-empty-note">
          No sales history is available for this product.
        </div>
      )}
    </section>
  );
}

function StockCard({
  item,
  items,
  value,
  onChange,
}: {
  item: InventoryForecastItem;
  items: InventoryForecastItem[];
  value: string;
  onChange: (id: string) => void;
}) {
  const projection = item?.stockProjection?.length
    ? item.stockProjection
    : [
        {
          date: new Date().toISOString().slice(0, 10),
          stock: item.currentStock,
        },
        {
          date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
          stock: Math.max(0, item.currentStock - item.forecastedDemand),
        },
      ];
  const values = projection.map((x) => x.stock),
    dates = projection.map((x) => x.date);
  return (
    <section className="fc-card">
      <header>
        <h3>Stock Projection</h3>
        <ProductSelect items={items} value={value} onChange={onChange} />
      </header>
      <div className="fc-legend">
        <span className="projected">Projected Stock</span>
        <span className="reorder">Reorder Point</span>
        <span className="safety">Safety Stock</span>
      </div>
      <p className="fc-axis-title">Stock (Units)</p>
      <Chart
        series={[{ values, color: "#2563eb", markers: true }]}
        dates={dates}
        thresholds={[
          {
            value: item.reorderPoint,
            color: "#f97316",
            label: "Reorder Point",
          },
          { value: item.safetyStock, color: "#ef4444", label: "Safety Stock" },
        ]}
      />
    </section>
  );
}

function Chart({
  series,
  dates,
  thresholds = [],
}: {
  series: Series[];
  dates: string[];
  thresholds?: { value: number; color: string; label: string }[];
}) {
  const w = 560,
    h = 230,
    left = 44,
    right = 18,
    top = 12,
    bottom = 35;
  const finite = series.flatMap((s) => s.values.filter(Number.isFinite));
  const max = Math.max(10, ...finite, ...thresholds.map((t) => t.value));
  const niceMax = Math.ceil(max / 10) * 10;
  const x = (i: number, n: number) =>
      left + (i * (w - left - right)) / Math.max(n - 1, 1),
    y = (v: number) => top + ((niceMax - v) * (h - top - bottom)) / niceMax;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((n) => Math.round(niceMax * n));
  return (
    <svg className="fc-svg" viewBox={`0 0 ${w} ${h}`} role="img">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={left} y1={y(t)} x2={w - right} y2={y(t)} className="grid" />
          <text x={left - 9} y={y(t) + 4} textAnchor="end">
            {t}
          </text>
        </g>
      ))}
      {thresholds.map((t) => (
        <g key={t.label}>
          <line
            x1={left}
            y1={y(t.value)}
            x2={w - right}
            y2={y(t.value)}
            stroke={t.color}
            strokeWidth="2"
            strokeDasharray="9 6"
          />
          <text
            x={w - right - 3}
            y={y(t.value) - 5}
            textAnchor="end"
            fill={t.color}
          >
            {t.label}
          </text>
        </g>
      ))}
      {series.map((s, index) => {
        const segments: string[] = [];
        let current = "";
        s.values.forEach((v, i) => {
          if (Number.isFinite(v))
            current += `${current ? " " : ""}${x(i, s.values.length)},${y(v)}`;
          else if (current) {
            segments.push(current);
            current = "";
          }
        });
        if (current) segments.push(current);
        return (
          <g key={index}>
            {segments.map((points, i) => (
              <polyline
                key={i}
                points={points}
                fill="none"
                stroke={s.color}
                strokeWidth="2.5"
                strokeDasharray={s.dashed ? "7 5" : undefined}
                strokeLinejoin="round"
              />
            ))}
            {s.markers &&
              s.values.map((v, i) =>
                Number.isFinite(v) &&
                i % Math.max(1, Math.ceil(s.values.length / 14)) === 0 ? (
                  <circle
                    key={i}
                    cx={x(i, s.values.length)}
                    cy={y(v)}
                    r="3"
                    fill={s.color}
                  />
                ) : null,
              )}
          </g>
        );
      })}
      {dates
        .filter(
          (_, i) =>
            i === 0 ||
            i === dates.length - 1 ||
            i % Math.max(1, Math.floor(dates.length / 5)) === 0,
        )
        .map((date) => {
          const i = dates.indexOf(date);
          return (
            <text
              key={`${date}-${i}`}
              x={x(i, dates.length)}
              y={h - 12}
              textAnchor={
                i === 0 ? "start" : i === dates.length - 1 ? "end" : "middle"
              }
            >
              {shortDate(date)}
            </text>
          );
        })}
    </svg>
  );
}

function SummaryCard({ summary }: { summary: Summary }) {
  const gradient = useMemo(() => {
    let offset = 0;
    return riskMeta
      .map(([risk, , color]) => {
        const start = offset;
        offset += (summary[risk] / Math.max(summary.total, 1)) * 360;
        return `${color} ${start}deg ${offset}deg`;
      })
      .join(",");
  }, [summary]);
  return (
    <section className="fc-card fc-summary">
      <header>
        <h3>Recommendation Summary</h3>
      </header>
      <div className="fc-summary-body">
        <div
          className="fc-donut"
          style={{ background: `conic-gradient(${gradient})` }}
        >
          <div>
            <strong>{summary.total}</strong>
            <span>Total Products</span>
          </div>
        </div>
        <ul>
          {riskMeta.map(([risk, label, color]) => (
            <li key={risk}>
              <i style={{ background: color }} />
              <span>{label}</span>
              <strong>{summary[risk]}</strong>
              <em>
                (
                {((summary[risk] / Math.max(summary.total, 1)) * 100).toFixed(
                  1,
                )}
                %)
              </em>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
