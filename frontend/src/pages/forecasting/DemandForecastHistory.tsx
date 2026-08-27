// Provides the Demand Forecast History UI for the forecasting feature.
import { useState } from "react";
import { Box } from "@mui/material";
import AutoGraphOutlinedIcon from "@mui/icons-material/AutoGraphOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import type { ForecastProduct, Recommendation } from "../../api/forecastApi";
const labels: Record<Recommendation, string> = {
  IMMEDIATE_RESTOCK: "Immediate Restock",
  REORDER_SOON: "Reorder Soon",
  STOCK_HEALTHY: "Stock Level Healthy",
  OVERSTOCK_RISK: "Overstock Risk",
};
// This component receives prepared data and renders the feature-specific interface.
export default function DemandForecastHistory({
  products,
  history,
}: {
  products: ForecastProduct[];
  history: ForecastProduct[];
}) {
  const [section, setSection] = useState<"inventory" | "model" | "activity">(
      "inventory",
    ),
    counts = (key: Recommendation) =>
      products.filter((p) => p.recommendation === key).length;
  return (
    <Box className={`history-grid history-grid--${section}`}>
      <Box className="history-section-tabs">
        <button
          className={section === "inventory" ? "active" : ""}
          onClick={() => setSection("inventory")}
        >
          <Inventory2OutlinedIcon />
          Inventory Recommendation
        </button>
        <button
          className={section === "model" ? "active" : ""}
          onClick={() => setSection("model")}
        >
          <AutoGraphOutlinedIcon />
          Forecast Model Overview
        </button>
        <button
          className={section === "activity" ? "active" : ""}
          onClick={() => setSection("activity")}
        >
          <RefreshOutlinedIcon />
          Recent Forecast Activity
        </button>
      </Box>
      <Box className="forecast-card inventory-recommendations">
        <h2>Inventory Recommendation</h2>
        <Box className="recommendation-kpis">
          {(
            [
              [
                "IMMEDIATE_RESTOCK",
                "Immediate Restock Required",
                <WarningAmberOutlinedIcon />,
              ],
              ["REORDER_SOON", "Reorder Soon", <Inventory2OutlinedIcon />],
              [
                "STOCK_HEALTHY",
                "Stock Level Healthy",
                <CheckCircleOutlineIcon />,
              ],
              ["OVERSTOCK_RISK", "Overstock Risk", <TrendingUpOutlinedIcon />],
            ] as const
          ).map(([key, label, icon]) => (
            <Box key={key}>
              {icon}
              <span>{label}</span>
              <strong>{counts(key)}</strong>
              <small>Products</small>
            </Box>
          ))}
        </Box>
        <div className="forecast-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Current Stock</th>
                <th>Reorder Level</th>
                <th>Predicted Demand</th>
                <th>Recommendation</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {products.slice(0, 8).map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name}</strong>
                  </td>
                  <td>{p.currentStock}</td>
                  <td>{p.reorderLevel}</td>
                  <td>{p.predictedDemand}</td>
                  <td>
                    <span
                      className={`recommendation ${p.recommendation.toLowerCase()}`}
                    >
                      {labels[p.recommendation]}
                    </span>
                  </td>
                  <td>
                    {p.recommendation === "IMMEDIATE_RESTOCK"
                      ? "Demand exceeds available stock"
                      : p.recommendation === "REORDER_SOON"
                        ? "Stock will reach reorder level soon"
                        : p.recommendation === "OVERSTOCK_RISK"
                          ? "Stock exceeds predicted demand"
                          : "Stock supports predicted demand"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Box>
      <Box className="forecast-card model-overview">
        <h2>Forecast Model Overview</h2>
        {[
          [
            <StorageOutlinedIcon />,
            "Aggregates historical sales data",
            "Daily sales data from the last 60 days",
          ],
          [
            <CalculateOutlinedIcon />,
            "Calculates moving average",
            "Weighted trend used for prediction",
          ],
          [
            <AutoGraphOutlinedIcon />,
            "Generates forecast",
            "Predicts demand for the selected period",
          ],
          [
            <SecurityOutlinedIcon />,
            "Company-based access",
            "Only your company’s sales and inventory are used",
          ],
          [
            <RefreshOutlinedIcon />,
            "Auto refresh ready",
            "Refresh whenever new sales data is available",
          ],
        ].map(([icon, heading, copy]) => (
          <Box key={String(heading)}>
            {icon}
            <span>
              <strong>{heading}</strong>
              <small>{copy}</small>
            </span>
          </Box>
        ))}
      </Box>
      <Box className="forecast-card recent-activity">
        <h2>Recent Forecast Activity</h2>
        {history.map((p, index) => (
          <Box key={p.id}>
            <CheckCircleOutlineIcon />
            <span>
              <strong>
                {index === 0
                  ? "Forecast generated"
                  : "Inventory recommendation generated"}
              </strong>
              <small>
                {p.name} · {new Date(p.generatedAt).toLocaleString("en-IN")}
              </small>
            </span>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
