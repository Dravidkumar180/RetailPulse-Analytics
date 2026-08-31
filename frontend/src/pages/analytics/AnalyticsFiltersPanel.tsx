/* Teaching guide: This file contains analytics filters panel page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
// Renders the analytics filters panel section for the analytics feature.
import {
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import type {
  AnalyticsDashboard,
  AnalyticsFilters,
} from "../../api/analyticsApi";
import { title } from "./analyticsUtils";

type Props = {
  draft: AnalyticsFilters;
  options?: AnalyticsDashboard["options"];
  error: string;
  onUpdate: (key: keyof AnalyticsFilters, value: string) => void;
  onPreset: (preset: string) => void;
  onClear: () => void;
  onApply: () => void;
};
// This component receives prepared data and renders the feature-specific interface.
export default function AnalyticsFiltersPanel({
  draft,
  options,
  error,
  onUpdate,
  onPreset,
  onClear,
  onApply,
}: Props) {
  const selects = [
    { key: "productId", label: "Product", items: options?.products },
    { key: "categoryId", label: "Category", items: options?.categories },
  ] as const;
  return (
    <Card className="analytics-filter-card">
      <CardContent className="filter-date-row">
        <Box className="filter-group filter-group--presets">
          <Typography component="span" className="filter-group-label">
            Date Range
          </Typography>
          <Box className="date-presets">
            {[
              ["Today", "today"],
              ["Last 7 Days", "7"],
              ["Last 30 Days", "30"],
              ["This Month", "month"],
              ["Last Month", "last"],
            ].map(([label, value]) => (
              <Button key={value} onClick={() => onPreset(value)}>
                {label}
              </Button>
            ))}
          </Box>
        </Box>
        <Box className="filter-group filter-group--custom">
          <Typography component="span" className="filter-group-label">
            Custom Range
          </Typography>
          <Box className="custom-date-fields">
            <TextField
              type="date"
              label="From"
              slotProps={{ inputLabel: { shrink: true } }}
              value={draft.startDate || ""}
              onChange={(event) => onUpdate("startDate", event.target.value)}
            />
            <TextField
              type="date"
              label="To"
              slotProps={{ inputLabel: { shrink: true } }}
              value={draft.endDate || ""}
              onChange={(event) => onUpdate("endDate", event.target.value)}
            />
          </Box>
        </Box>
      </CardContent>
      <CardContent className="filter-selects">
        {selects.map((filter) => (
          <TextField
            select
            key={filter.key}
            label={filter.label}
            value={draft[filter.key] || ""}
            onChange={(event) => onUpdate(filter.key, event.target.value)}
          >
            <MenuItem value="">All {filter.label}s</MenuItem>
            {filter.items?.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.name}
              </MenuItem>
            ))}
          </TextField>
        ))}
        <TextField select label="Brand" value={draft.brand || ""} onChange={(event) => onUpdate("brand", event.target.value)}>
          <MenuItem value="">All Brands</MenuItem>
          {options?.brands.map((brand) => <MenuItem key={brand} value={brand}>{brand}</MenuItem>)}
        </TextField>
        <TextField select label="Sales Channel" value={draft.salesChannel || ""} onChange={(event) => onUpdate("salesChannel", event.target.value)}>
          <MenuItem value="">All Channels</MenuItem>
          {options?.salesChannels.map((channel) => <MenuItem key={channel} value={channel}>{title(channel)}</MenuItem>)}
        </TextField>
        <TextField
          select
          label="Payment Method"
          value={draft.paymentMethod || ""}
          onChange={(event) => onUpdate("paymentMethod", event.target.value)}
        >
          <MenuItem value="">All Methods</MenuItem>
          {options?.paymentMethods.map((method) => (
            <MenuItem key={method} value={method}>
              {title(method)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Payment Status"
          value={draft.paymentStatus || ""}
          onChange={(event) => onUpdate("paymentStatus", event.target.value)}
        >
          <MenuItem value="">All Statuses</MenuItem>
          {options?.paymentStatuses.map((status) => (
            <MenuItem key={status} value={status}>
              {title(status)}
            </MenuItem>
          ))}
        </TextField>
        <Box className="filter-buttons">
          <Button onClick={onClear}>Clear</Button>
          <Button variant="contained" onClick={onApply}>
            Apply Filters
          </Button>
        </Box>
      </CardContent>
      {error && <Box className="filter-error">{error}</Box>}
    </Card>
  );
}
