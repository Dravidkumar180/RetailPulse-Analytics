// Provides shared formatting, date, error, empty-state, and loading helpers for analytics.
import axios from "axios";
import { Box, Skeleton } from "@mui/material";
import InventoryIcon from "@mui/icons-material/Inventory2";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import type { AnalyticsFilters } from "../../api/analyticsApi";

// The shared values below keep formatting and business rules consistent.
export const finite = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
export const money = (value: unknown = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(finite(value));
export const title = (value: string) =>
  value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
export const localDate = (value: Date) =>
  `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
export const today = () => localDate(new Date());
export const dateRange = (days: number) => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days + 1);
  return { startDate: localDate(start), endDate: localDate(end) };
};
export const csvCell = (value: unknown) =>
  `"${String(value ?? "").replaceAll('"', '""')}"`;
export const notify = (
  heading: string,
  message: string,
  path = "/analytics/sales",
) =>
  window.dispatchEvent(
    new CustomEvent("retailpulse:notification", {
      detail: { title: heading, message, path },
    }),
  );
export const trendLabel = (
  value: string,
  interval: AnalyticsFilters["interval"],
) => {
  if (interval === "monthly") {
    const [year, month] = value.split("-");
    return new Intl.DateTimeFormat("en-IN", {
      month: "short",
      year: "numeric",
    }).format(new Date(Number(year), Number(month) - 1, 1));
  }
  if (interval === "weekly") return value.replace("-W", " · Week ");
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${value}T00:00:00`));
};
export const analyticsErrorMessage = (reason: unknown) => {
  if (axios.isAxiosError(reason)) {
    const detail = reason.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      const messages = detail.map((item) => item?.msg).filter(Boolean);
      if (messages.length) return messages.join(" ");
    }
    if (reason.code === "ECONNABORTED")
      return "The analytics request timed out. Please try again.";
    if (!reason.response) return "Unable to connect to the analytics service.";
    return `Analytics request failed (${reason.response.status}).`;
  }
  return reason instanceof Error
    ? reason.message
    : "Analytics data could not be loaded.";
};

type EmptyKind = "sales" | "products" | "customers" | "payments";
export function AnalyticsEmpty({
  kind = "sales",
  text,
}: {
  kind?: EmptyKind;
  text: string;
}) {
  const content = {
    sales: { title: "No Sales Data", icon: <ShoppingBagOutlinedIcon /> },
    products: { title: "No Products Found", icon: <InventoryIcon /> },
    customers: { title: "No Customers Found", icon: <PersonOutlinedIcon /> },
    payments: { title: "No Payment Data", icon: <PaymentsOutlinedIcon /> },
  }[kind];
  return (
    <Box className={`analytics-empty analytics-empty--${kind}`} role="status">
      <Box className="analytics-empty__icon">{content.icon}</Box>
      <strong>{content.title}</strong>
      <span>{text}</span>
    </Box>
  );
}
export function AnalyticsTableSkeleton({ columns = 3 }: { columns?: number }) {
  return (
    <Box className="analytics-table-skeleton" aria-label="Loading table">
      <Skeleton variant="rounded" height={28} />
      {Array.from({ length: 5 }, (_, row) => (
        <Box
          key={row}
          style={{ gridTemplateColumns: `repeat(${columns},1fr)` }}
        >
          {Array.from({ length: columns }, (_, cell) => (
            <Skeleton key={cell} height={24} />
          ))}
        </Box>
      ))}
    </Box>
  );
}
