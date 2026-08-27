// Renders the inventory summary cards section for the inventory feature.
import { Box } from "@mui/material";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import type { InventorySummary } from "../../api/inventoryApi";
// This component receives prepared data and renders the feature-specific interface.
export default function InventorySummaryCards({
  summary,
}: {
  summary?: InventorySummary;
}) {
  const cards = [
    ["Total Products", summary?.totalProducts ?? 0, "blue"],
    ["Total Inventory Quantity", summary?.totalInventoryQuantity ?? 0, "green"],
    ["Low Stock Products", summary?.lowStockProducts ?? 0, "orange"],
    ["Out of Stock Products", summary?.outOfStockProducts ?? 0, "red"],
  ] as const;
  return (
    <Box className="inventory-cards">
      {cards.map(([label, value, tone]) => (
        <Box className={`inventory-card inventory-card--${tone}`} key={label}>
          <Box className="inventory-card__icon">
            <Inventory2OutlinedIcon />
          </Box>
          <Box>
            <span>{label}</span>
            <strong>{value.toLocaleString()}</strong>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
