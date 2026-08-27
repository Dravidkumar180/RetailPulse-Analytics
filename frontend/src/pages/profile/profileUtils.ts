import type { AuditAction } from "../../api/auditLogApi";

// Show backend dates in a readable date-and-time format for Indian users.
export const formatProfileDateTime = (date?: string | null): string => {
  if (!date) return "Not available";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
};

// Convert values such as COMPANY_ADMIN into "Company Admin".
export const formatProfileRole = (value: string): string =>
  value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

// Use up to two name initials when the user has no profile image.
export const getProfileInitials = (name?: string): string =>
  (name || "User")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

// Translate technical audit action names into simple labels for the UI.
export const profileActivityLabels: Partial<Record<AuditAction, string>> = {
  USER_LOGIN: "Logged in",
  USER_LOGOUT: "Logged out",
  PASSWORD_CHANGED: "Changed password",
  USER_INVITED: "Invited a user",
  USER_UPDATED: "Updated a user",
  SALE_CREATED: "Recorded a sale",
  SALE_UPDATED: "Updated a sale",
  SALE_DELETED: "Deleted a sale",
  INVENTORY_UPDATED: "Updated inventory",
  PRODUCT_OUT_OF_STOCK: "Product out of stock",
  DASHBOARD_VIEWED: "Viewed dashboard",
  REPORT_EXPORTED: "Exported a report",
  DASHBOARD_FILTERS_APPLIED: "Applied dashboard filters",
};
