// Renders the replenishment summary section for the forecasting feature.
import { Box } from "@mui/material";
import type { InventoryForecastResponse } from "../../api/inventoryForecastApi";
// This component receives prepared data and renders the feature-specific interface.
export default function ReplenishmentSummary({
  summary,
}: {
  summary: InventoryForecastResponse["summary"];
}) {
  const cards = [
    ["Products Requiring Reorder", summary.reorderRequired, "reorder"],
    [
      "Products at Stockout Risk",
      summary.STOCKOUT_RISK + summary.OUT_OF_STOCK,
      "danger",
    ],
    ["Overstocked Products", summary.OVERSTOCK, "over"],
    ["Healthy Products", summary.HEALTHY, "healthy"],
    ["Total SKUs", summary.total, "total"],
  ] as const;
  return (
    <Box className="sr-summary">
      {cards.map(([label, value, tone]) => (
        <div className={tone} key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
          <small>
            {Math.round((Number(value) / Math.max(summary.total, 1)) * 100)}% of
            products
          </small>
        </div>
      ))}
    </Box>
  );
}
