/* Teaching guide: This file contains smart replenishment shared page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
// Stores shared risk labels, sort priority, and pagination settings for replenishment.
import type { StockRisk } from "../../api/inventoryForecastApi";
// The shared values below keep formatting and business rules consistent.
export const stockRiskLabels: Record<StockRisk, string> = {
  OUT_OF_STOCK: "Out of Stock",
  STOCKOUT_RISK: "Stockout Risk",
  LOW_STOCK: "Low Stock",
  HEALTHY: "Healthy",
  OVERSTOCK: "Overstock",
};
export const recommendationLabels: Record<StockRisk, string> = {
  OUT_OF_STOCK: "Immediate Reorder",
  STOCKOUT_RISK: "Reorder Soon",
  LOW_STOCK: "Plan to Reorder",
  HEALTHY: "Stock OK",
  OVERSTOCK: "Reduce Purchase",
};
export const riskOrder: Record<StockRisk, number> = {
  OUT_OF_STOCK: 0,
  STOCKOUT_RISK: 1,
  LOW_STOCK: 2,
  HEALTHY: 3,
  OVERSTOCK: 4,
};
export const REPLENISHMENT_PAGE_SIZE = 5;
