/* =========================================================
 * Inventory API client
 * ========================================================= */

// Use the shared authenticated Axios client for tokens and refresh handling.
import axiosInstance from "./axiosInstance";

// Stock statuses are calculated by the backend from available stock.
export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
// Adjustment types map directly to backend movement types.
export type AdjustmentType =
  "STOCK_ADDITION" | "STOCK_REMOVAL" | "MANUAL_ADJUSTMENT";

/* =========================================================
 * Inventory overview types
 * ========================================================= */

// One row displayed in the Inventory Overview table.
export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  categoryId: string;
  categoryName: string;
  brand?: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  reorderLevel: number;
  stockStatus: StockStatus;
  updatedAt: string;
}
// Summary cards and chart values returned for the current company.
export interface InventorySummary {
  totalProducts: number;
  totalInventoryQuantity: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  inventoryByCategory: { name: string; value: number }[];
  stockStatusDistribution: { name: string; value: number }[];
}
// Complete response for inventory rows, totals and filter options.
export interface InventoryList {
  items: InventoryItem[];
  total: number;
  summary: InventorySummary;
  categories: { id: string; name: string }[];
  brands: string[];
}
/* =========================================================
 * Movement, notification and adjustment types
 * ========================================================= */

// One immutable stock movement displayed in movement history.
export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  movementType: string;
  previousQuantity: number;
  updatedQuantity: number;
  quantityChanged: number;
  reason: string;
  remarks?: string;
  performedBy: string;
  createdAt: string;
}
// One low-stock, out-of-stock or manual-adjustment bell notification.
export interface InventoryNotification {
  id: string;
  title: string;
  message: string;
  productId: string;
  createdAt: string;
}
// Payload submitted by the Add, Remove and Adjust Stock dialogs.
export interface StockAdjustmentInput {
  productId: string;
  adjustmentType: AdjustmentType;
  quantity: number;
  reason: string;
  remarks?: string;
  reorderLevel?: number;
}

/* =========================================================
 * Inventory overview requests
 * ========================================================= */

// Load inventory using the active search, filter and sort selections.
export const getInventory = async (
  params: Record<string, string | undefined>,
) => (await axiosInstance.get<InventoryList>("/inventory", { params })).data;
// Load the complete company-isolated stock movement history.
export const getInventoryMovements = async (
  params: Record<string, string | undefined> = {},
) =>
  (
    await axiosInstance.get<InventoryMovement[]>("/inventory/movements", {
      params,
    })
  ).data;
// Submit a validated stock change and return the created movement.
export const adjustInventory = async (data: StockAdjustmentInput) =>
  (await axiosInstance.post<InventoryMovement>("/inventory/adjustments", data))
    .data;
/* =========================================================
 * Notification requests
 * ========================================================= */

// Load stock alerts for the Company Admin notification bell.
export const getInventoryNotifications = async () =>
  (await axiosInstance.get<InventoryNotification[]>("/inventory/notifications"))
    .data;
// Mark all inventory notifications as read for the current company.
export const clearInventoryNotifications = async () => {
  await axiosInstance.delete("/inventory/notifications");
};
