/* Prepares report filters and formats errors, dates, and report context for display. */
import type { Filters, Run } from "./reportTypes";

// Remove empty filter values before sending a request.
export const clean = (filters: Filters) =>
  Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
// Drop filters that do not apply to the selected report type.
export const applicable = (type: string, filters: Filters) =>
  clean(
    Object.fromEntries(
      Object.entries(filters).filter(
        ([k]) =>
          !(
            type === "inventory" &&
            ["customer_id", "sales_status", "user_id"].includes(k)
          ) &&
          !(
            type === "stock_movement" &&
            ["customer_id", "sales_status", "stock_status"].includes(k)
          ) &&
          !(
            !["inventory", "stock_movement"].includes(type) &&
            k === "stock_status"
          ),
      ),
    ),
  );
// Combine field errors or use the message supplied by the server.
export const errorMessage = (error: unknown): string => {
  const e = error as {
    response?: {
      data?: {
        detail?: unknown;
        message?: string;
        errors?: Record<string, string[]>;
      };
    };
  };
  const fieldErrors = e.response?.data?.errors;
  if (fieldErrors && Object.keys(fieldErrors).length) {
    return Object.entries(fieldErrors)
      .map(
        ([field, messages]) =>
          `${field.replaceAll("_", " ")}: ${messages.join("; ")}`,
      )
      .join("\n");
  }
  const detail = e.response?.data?.detail;
  return typeof detail === "string"
    ? detail
    : Array.isArray(detail)
      ? detail.map((x) => x.msg).join("; ")
      : e.response?.data?.message ||
        "Unable to complete the request. Please try again.";
};
// Treat dates without a timezone suffix as UTC, then display them in local time.
export const dateTime = (value?: string) =>
  value
    ? new Date(
        value.endsWith("Z") || /[+-]\d\d:\d\d$/.test(value)
          ? value
          : value + "Z",
      ).toLocaleString()
    : "Not yet run";
// Build a readable filter summary; company and note are shown separately.
export const context = (item: Run) =>
  Object.entries(item.context)
    .filter(([k]) => !["company", "note"].includes(k))
    .map(([k, v]) => `${k.replaceAll("_", " ")}: ${v}`)
    .join(" · ");
