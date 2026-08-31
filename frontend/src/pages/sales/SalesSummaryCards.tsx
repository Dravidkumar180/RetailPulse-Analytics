/* Teaching guide: This file contains sales summary cards page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
// Renders the sales summary cards section for the sales feature.
import { Box } from "@mui/material";
import type { SalesSummary } from "../../api/salesApi";
import { currency } from "./salesUtils";
// This component receives prepared data and renders the feature-specific interface.
export default function SalesSummaryCards({
  summary,
}: {
  summary?: SalesSummary;
}) {
  const cards = [
    ["Total Sales", summary?.totalSales || 0, "blue"],
    ["Total Revenue", currency(Number(summary?.totalRevenue || 0)), "green"],
    ["Total Orders", summary?.totalOrders || 0, "purple"],
    [
      "Average Order Value",
      currency(Number(summary?.averageOrderValue || 0)),
      "orange",
    ],
  ];
  return (
    <Box className="sales-summary">
      {cards.map(([label, value, color]) => (
        <Box className="sales-stat" key={String(label)}>
          <i className={String(color)} />
          <div>
            <small>{label}</small>
            <strong>{value}</strong>
          </div>
        </Box>
      ))}
    </Box>
  );
}
