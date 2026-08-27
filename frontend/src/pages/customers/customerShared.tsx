// Provides shared customer formatting, badges, loading states, and error messages.
import { Alert, Box, Button, Skeleton, Typography } from "@mui/material";
import type { CustomerInput } from "../../api/customerApi";
// The shared values below keep formatting and business rules consistent.
export const empty: CustomerInput = {
  fullName: "",
  email: "",
  phone: "",
  gender: "",
  dateOfBirth: "",
  address: "",
  city: "",
  state: "",
  country: "",
  customerType: "RETAIL",
  preferredSalesChannel: "RETAIL_STORE",
  status: "ACTIVE",
};
export const money = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
export const date = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "â€”";
export const title = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
export type CustomerIssue = {
  title: string;
  message: string;
  severity: "error" | "warning";
};
export function CustomerError({
  issue,
  onClose,
  onRetry,
}: {
  issue: CustomerIssue;
  onClose?: () => void;
  onRetry?: () => void;
}) {
  return (
    <Alert
      severity={issue.severity}
      className="customer-error-alert"
      onClose={onClose}
      action={
        onRetry ? (
          <Button size="small" variant="outlined" onClick={onRetry}>
            Retry
          </Button>
        ) : undefined
      }
    >
      <strong>{issue.title}</strong>
      <span>{issue.message}</span>
    </Alert>
  );
}
export type CustomerSegment = "vip" | "loyal" | "regular" | "new";
export const segmentKey = (value: string): CustomerSegment => {
  const key = value.split(" ")[0].toLowerCase();
  return (
    ["vip", "loyal", "regular", "new"].includes(key) ? key : "new"
  ) as CustomerSegment;
};
export const segmentLabels: Record<CustomerSegment, string> = {
  vip: "VIP",
  loyal: "Loyal",
  regular: "Regular",
  new: "New",
};
export function SegmentBadge({ segment }: { segment: string }) {
  const key = segmentKey(segment);
  return (
    <span className={`customer-segment-badge customer-segment-badge--${key}`}>
      {segmentLabels[key]}
    </span>
  );
}
export function CustomerSegmentGuide() {
  const items: [CustomerSegment, string, string][] = [
    ["vip", "VIP Customers", "High value customers"],
    ["loyal", "Loyal Customers", "Frequent purchasers"],
    ["regular", "Regular Customers", "Consistent shoppers"],
    ["new", "New Customers", "Recently joined"],
  ];
  return (
    <Box className="customer-segment-guide">
      <Typography component="h3">Customer Segment Badges</Typography>
      <Box>
        {items.map(([key, label, description]) => (
          <Box key={key}>
            <SegmentBadge segment={key} />
            <span>
              <strong>{label}</strong>
              <small>{description}</small>
            </span>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
export function CustomerLoadingState() {
  return (
    <Box className="customer-loading-state" aria-label="Loading customers">
      {Array.from({ length: 5 }, (_, index) => (
        <Box key={index}>
          {Array.from({ length: 8 }, (_, cell) => (
            <Skeleton key={cell} variant="rounded" height={18} />
          ))}
        </Box>
      ))}
    </Box>
  );
}
export const customerIssueFromError = (error: any): CustomerIssue => {
  const detail = error?.response?.data?.detail;
  const message = Array.isArray(detail)
    ? detail
        .map((item: any) => item?.msg)
        .filter(Boolean)
        .join(" ")
    : String(
        detail || "Something went wrong while processing the customer request.",
      );
  const normalized = message.toLowerCase();
  if (normalized.includes("email") && normalized.includes("already"))
    return {
      title: "Duplicate Email",
      message: "A customer with this email already exists.",
      severity: "error",
    };
  if (normalized.includes("phone") && normalized.includes("already"))
    return {
      title: "Duplicate Phone Number",
      message: "A customer with this phone number already exists.",
      severity: "error",
    };
  if (error?.response?.status === 422)
    return {
      title: "Validation Error",
      message: message || "Please fill all required fields correctly.",
      severity: "warning",
    };
  return { title: "Failed API Request", message, severity: "error" };
};

export function MiniBars({
  data,
  moneyValue = false,
}: {
  data: { name: string; value: number }[];
  moneyValue?: boolean;
}) {
  const max = Math.max(1, ...data.map((x) => x.value));
  return (
    <Box className="customer-bars">
      {data.length ? (
        data.map((x, i) => (
          <Box className="customer-bar-row" key={`${x.name}-${i}`}>
            <span title={x.name}>{title(x.name)}</span>
            <Box>
              <i style={{ width: `${Math.max(4, (x.value / max) * 100)}%` }} />
            </Box>
            <b>{moneyValue ? money(x.value) : x.value.toLocaleString()}</b>
          </Box>
        ))
      ) : (
        <Typography>No customer data yet.</Typography>
      )}
    </Box>
  );
}
export function Donut({
  data,
  centerLabel = "Total",
  moneyTotal = false,
}: {
  data: { name: string; value: number }[];
  centerLabel?: string;
  moneyTotal?: boolean;
}) {
  const colors = ["#2563eb", "#10b981", "#f59e0b", "#7c3aed"],
    total = data.reduce((s, x) => s + x.value, 0);
  let cursor = 0;
  const gradient = data
    .map((x, i) => {
      const start = cursor;
      cursor += total ? (x.value / total) * 100 : 0;
      return `${colors[i % colors.length]} ${start}% ${cursor}%`;
    })
    .join(",");
  return (
    <Box className="customer-donut-wrap">
      <Box
        className="customer-donut"
        style={{
          background: gradient ? `conic-gradient(${gradient})` : "#e8edf5",
        }}
      >
        <span>
          <b>{moneyTotal ? money(total) : total.toLocaleString()}</b>
          {centerLabel}
        </span>
      </Box>
      <Box>
        {data.map((x, i) => (
          <p key={x.name}>
            <i style={{ background: colors[i % colors.length] }} />
            <span>{title(x.name)}</span>
            <b>
              {moneyTotal ? money(x.value) : x.value.toLocaleString()}{" "}
              <small>
                ({total ? ((x.value / total) * 100).toFixed(1) : 0}%)
              </small>
            </b>
          </p>
        ))}
      </Box>
    </Box>
  );
}
export function GrowthLine({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const values = data.length ? data : [{ name: "No data", value: 0 }];
  const rawMax = Math.max(1, ...values.map((x) => x.value));
  const axisMax = Math.max(4, Math.ceil(rawMax / 4) * 4);
  const left = 42,
    right = 344,
    top = 18,
    bottom = 174;
  const x = (index: number) =>
    values.length === 1
      ? (left + right) / 2
      : left + index * ((right - left) / (values.length - 1));
  const y = (value: number) => bottom - (value / axisMax) * (bottom - top);
  const points = values
    .map((item, index) => `${x(index)},${y(item.value)}`)
    .join(" ");
  const area = `${left},${bottom} ${points} ${right},${bottom}`;
  const ticks = [axisMax, axisMax * 0.75, axisMax * 0.5, axisMax * 0.25, 0];
  const tickLabel = (value: number) =>
    value >= 1000
      ? `${(value / 1000).toFixed(value % 1000 ? 1 : 0)}K`
      : Math.round(value).toString();
  return (
    <Box className="growth-chart">
      <svg
        viewBox="0 0 360 215"
        role="img"
        aria-label="Customer growth line chart"
      >
        <g className="growth-grid">
          {ticks.map((tick, index) => (
            <g key={tick}>
              <line
                x1={left}
                y1={top + index * ((bottom - top) / 4)}
                x2={right}
                y2={top + index * ((bottom - top) / 4)}
              />
              <text x="34" y={top + index * ((bottom - top) / 4) + 4}>
                {tickLabel(tick)}
              </text>
            </g>
          ))}
          {values.map((item, index) => (
            <line
              key={item.name}
              x1={x(index)}
              y1={top}
              x2={x(index)}
              y2={bottom}
            />
          ))}
        </g>
        <polygon className="growth-area" points={area} />
        <polyline className="growth-line" points={points} />
        {values.map((item, index) => (
          <g key={item.name}>
            <circle
              className="growth-point-halo"
              cx={x(index)}
              cy={y(item.value)}
              r="5"
            />
            <circle
              className="growth-point"
              cx={x(index)}
              cy={y(item.value)}
              r="3.4"
            />
            <text className="growth-label" x={x(index)} y="201">
              {item.name}
            </text>
          </g>
        ))}
      </svg>
    </Box>
  );
}
export function LocationMap({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const max = Math.max(1, ...data.map((x) => x.value));
  const ranked = [...data].sort((a, b) => b.value - a.value).slice(0, 8);
  return (
    <Box className="location-ranking">
      {ranked.length ? (
        ranked.map((item, index) => (
          <Box className="location-ranking__row" key={item.name}>
            <span className="location-ranking__rank">{index + 1}</span>
            <span className="location-ranking__name">{item.name}</span>
            <Box className="location-ranking__track">
              <i
                style={{ width: `${Math.max(7, (item.value / max) * 100)}%` }}
              />
            </Box>
            <b>{item.value}</b>
          </Box>
        ))
      ) : (
        <Typography>No customer locations available.</Typography>
      )}
    </Box>
  );
}
