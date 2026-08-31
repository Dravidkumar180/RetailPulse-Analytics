/* Teaching guide: This file contains inventory constants page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
// Stores shared inventory labels, colors, and select options used across inventory views.
// The shared values below keep formatting and business rules consistent.
export const STATUS_LABEL: Record<string, string> = {
  IN_STOCK: "In Stock",
  LOW_STOCK: "Low Stock",
  OUT_OF_STOCK: "Out of Stock",
};
export const MOVEMENT_LABEL: Record<string, string> = {
  SALE: "Sale",
  MANUAL_ADJUSTMENT: "Manual Adjustment",
  STOCK_ADDITION: "Stock Addition",
  STOCK_REMOVAL: "Stock Removal",
};
export const ADJUSTMENT_REASONS = [
  "New stock received",
  "Damaged items removed",
  "Inventory count correction",
  "Customer return",
  "Expired stock",
  "Transfer between locations",
  "Other",
];
