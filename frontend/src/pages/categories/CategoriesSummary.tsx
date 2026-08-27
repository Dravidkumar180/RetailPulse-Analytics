// Renders the categories summary section for the categories feature.
import { Box } from "@mui/material";
import type { Category } from "../../api/catalogApi";

// This component receives prepared data and renders the feature-specific interface.
export default function CategoriesSummary({
  categories,
  total,
}: {
  categories: Category[];
  total: number;
}) {
  const active = categories.filter(
    (category) => category.status === "ACTIVE",
  ).length;
  return (
    <Box className="catalog-summary">
      <Box className="catalog-stat">
        <span className="catalog-stat__icon purple">◆</span>
        <div>
          <small>Total Categories</small>
          <strong>{total}</strong>
        </div>
      </Box>
      <Box className="catalog-stat">
        <span className="catalog-stat__icon green">✓</span>
        <div>
          <small>Active Categories</small>
          <strong>{active}</strong>
        </div>
      </Box>
    </Box>
  );
}
