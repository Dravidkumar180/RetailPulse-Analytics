/* Teaching guide: This file contains inventory analytics page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
// Renders the inventory analytics section for the inventory feature.
import { Box, Typography } from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlined";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import type { AdjustmentType, InventorySummary } from "../../api/inventoryApi";
import { STATUS_LABEL } from "./inventoryConstants";
// This component receives prepared data and renders the feature-specific interface.
export default function InventoryAnalytics({
  summary,
  admin,
  onAdjust,
  onHistory,
}: {
  summary?: InventorySummary;
  admin: boolean;
  onAdjust: (type: AdjustmentType) => void;
  onHistory: () => void;
}) {
  const counts = Object.fromEntries(
      (summary?.stockStatusDistribution ?? []).map((item) => [
        item.name,
        item.value,
      ]),
    ),
    inStock = counts.IN_STOCK ?? 0,
    lowStock = counts.LOW_STOCK ?? 0,
    outOfStock = counts.OUT_OF_STOCK ?? 0,
    total = inStock + lowStock + outOfStock,
    inEnd = total ? (inStock / total) * 100 : 0,
    lowEnd = total ? ((inStock + lowStock) / total) * 100 : 0,
    background = total
      ? `conic-gradient(#10b981 0 ${inEnd}%,#f59e0b ${inEnd}% ${lowEnd}%,#ef4444 ${lowEnd}% 100%)`
      : "conic-gradient(#e2e8f0 0 100%)",
    max = Math.max(
      ...(summary?.inventoryByCategory.map((item) => item.value) ?? [1]),
      1,
    );
  return (
    <Box className="inventory-lower">
      <Box className="inventory-chart">
        <Typography component="h2">Inventory by Category</Typography>
        {summary?.inventoryByCategory.map((item, index) => (
          <Box className="bar-row" key={item.name}>
            <span>{item.name}</span>
            <Box>
              <i
                style={{
                  width: `${Math.max(4, (item.value / max) * 100)}%`,
                  background: [
                    "#2563eb",
                    "#10b981",
                    "#f59e0b",
                    "#8b5cf6",
                    "#06b6d4",
                  ][index % 5],
                }}
              />
            </Box>
            <strong>{item.value.toLocaleString()}</strong>
          </Box>
        ))}
      </Box>
      <Box className="inventory-chart">
        <Typography component="h2">Stock Status Distribution</Typography>
        <Box className="stock-status-chart">
          <Box className="stock-status-chart__donut" style={{ background }}>
            <Box className="stock-status-chart__center">
              <strong>{total}</strong>
              <span>Products</span>
            </Box>
          </Box>
          <Box className="status-distribution">
            {(summary?.stockStatusDistribution ?? []).map((item) => (
              <Box key={item.name}>
                <i className={`dot dot--${item.name.toLowerCase()}`} />
                <span>{STATUS_LABEL[item.name]}</span>
                <strong>{item.value}</strong>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
      <Box className="inventory-actions">
        <Typography component="h2">Quick Actions</Typography>
        {admin && (
          <>
            <button className="add" onClick={() => onAdjust("STOCK_ADDITION")}>
              <AddCircleOutlineIcon /> Add Stock
            </button>
            <button
              className="remove"
              onClick={() => onAdjust("STOCK_REMOVAL")}
            >
              <RemoveCircleOutlineIcon /> Remove Stock
            </button>
            <button
              className="adjust"
              onClick={() => onAdjust("MANUAL_ADJUSTMENT")}
            >
              <TuneOutlinedIcon /> Adjust Stock
            </button>
          </>
        )}
        <button className="history" onClick={onHistory}>
          <HistoryOutlinedIcon /> View Adjustment History
        </button>
      </Box>
    </Box>
  );
}
