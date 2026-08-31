/* Teaching guide: This file contains products summary page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
// Renders the products summary section for the products feature.
import { Box } from "@mui/material";
import type { ProductList } from "../../api/catalogApi";

// This component receives prepared data and renders the feature-specific interface.
export default function ProductsSummary({
  summary,
}: {
  summary?: ProductList;
}) {
  const cards = [
    ["Total Products", summary?.totalProducts || 0, "blue"],
    ["Active Products", summary?.activeProducts || 0, "green"],
    ["Inactive Products", summary?.inactiveProducts || 0, "orange"],
    ["Total Categories", summary?.totalCategories || 0, "purple"],
  ] as const;
  return (
    <Box className="catalog-summary">
      {cards.map(([label, value, color]) => (
        <Box className="catalog-stat" key={label}>
          <span className={`catalog-stat__icon ${color}`}>◆</span>
          <div>
            <small>{label}</small>
            <strong>{value}</strong>
          </div>
        </Box>
      ))}
    </Box>
  );
}
