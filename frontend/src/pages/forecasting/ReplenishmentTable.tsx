/* Teaching guide: This file contains replenishment table page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
// Renders the replenishment table data and related row actions.
import { Box, Pagination } from "@mui/material";
import type { InventoryForecastItem } from "../../api/inventoryForecastApi";
import {
  recommendationLabels,
  REPLENISHMENT_PAGE_SIZE,
  stockRiskLabels,
} from "./SmartReplenishmentShared";
type Props = {
  rows: InventoryForecastItem[];
  shown: InventoryForecastItem[];
  selectedId?: string;
  page: number;
  onPage: (page: number) => void;
  onSelect: (id: string) => void;
  onView: (id: string) => void;
};
// This component receives prepared data and renders the feature-specific interface.
export default function ReplenishmentTable({
  rows,
  shown,
  selectedId,
  page,
  onPage,
  onSelect,
  onView,
}: Props) {
  return (
    <Box className="sr-card sr-table">
      <div className="sr-title">
        <h3>Inventory recommendations</h3>
        <span>{rows.length} products</span>
      </div>
      <div className="sr-scroll">
        <table>
          <thead>
            <tr>
              <th>Product / SKU</th>
              <th>Current Stock</th>
              <th>Avg. Daily Sales</th>
              <th>Forecasted Demand</th>
              <th>Days Remaining</th>
              <th>Reorder Point</th>
              <th>Recommended Qty.</th>
              <th>Stock Risk</th>
              <th>Recommendation</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((item) => (
              <tr
                key={item.productId}
                className={selectedId === item.productId ? "selected" : ""}
                onClick={() => onSelect(item.productId)}
              >
                <td>
                  <strong>{item.product}</strong>
                  <small>
                    {item.sku} · {item.category}
                  </small>
                </td>
                <td>{item.currentStock}</td>
                <td>{item.averageDailySales}</td>
                <td>{item.forecastedDemand}</td>
                <td>
                  {item.daysRemaining === null ? "∞" : item.daysRemaining}
                </td>
                <td>{item.reorderPoint}</td>
                <td>
                  <strong>{item.recommendedQuantity}</strong>
                </td>
                <td>
                  <i className={`sr-pill risk-${item.risk.toLowerCase()}`}>
                    {stockRiskLabels[item.risk]}
                  </i>
                </td>
                <td>
                  <i
                    className={`sr-pill recommendation-${item.risk.toLowerCase()}`}
                  >
                    {recommendationLabels[item.risk]}
                  </i>
                </td>
                <td>
                  <button
                    className="sr-view"
                    onClick={(event) => {
                      event.stopPropagation();
                      onView(item.productId);
                    }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && (
        <div className="sr-empty">No products match these filters.</div>
      )}
      <div className="sr-pages">
        <span>{rows.length} results</span>
        <Pagination
          page={page}
          count={Math.max(1, Math.ceil(rows.length / REPLENISHMENT_PAGE_SIZE))}
          onChange={(_, value) => onPage(value)}
        />
      </div>
    </Box>
  );
}
