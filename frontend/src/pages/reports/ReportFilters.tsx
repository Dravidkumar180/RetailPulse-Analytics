/* Builds the filter fields shared by report generation and scheduling. */
import { MenuItem, TextField } from "@mui/material";
import type { Filters, Options } from "./reportTypes";

type Props = {
  selected: string;
  value: Filters;
  change: (filters: Filters) => void;
  rolling?: boolean;
  options?: Options;
};

export default function ReportFilters({
  selected,
  value,
  change,
  rolling = false,
  options,
}: Props) {
  // Create each filter input in the same way, with an All option for dropdowns.
  const field = (
    key: string,
    label: string,
    choices?: { id: string; name: string }[],
    inputType = "text",
  ) => (
    <TextField
      key={key}
      size="small"
      label={label}
      select={!!choices}
      type={inputType}
      value={value[key] || ""}
      onChange={(e) => change({ ...value, [key]: e.target.value })}
      slotProps={{ inputLabel: { shrink: true } }}
    >
      {choices && [
        <MenuItem key="all" value="">
          All {label.toLowerCase()}
        </MenuItem>,
        ...choices.map((c) => (
          <MenuItem key={c.id} value={c.id}>
            {c.name}
          </MenuItem>
        )),
      ]}
    </TextField>
  );
  return (
    <div className="report-filter-grid">
      {!rolling &&
        field(
          "start_date",
          selected === "inventory" ? "Updated from" : "Start date",
          undefined,
          "date",
        )}
      {!rolling &&
        field(
          "end_date",
          selected === "inventory" ? "Updated through" : "End date",
          undefined,
          "date",
        )}
      {field("product_id", "Products", options?.products || [])}
      {field("category_id", "Categories", options?.categories || [])}
      {field(
        "brand",
        "Brands",
        options?.brands.map((b) => ({ id: b, name: b })) || [],
      )}
      {!["inventory", "stock_movement"].includes(selected) &&
        field("customer_id", "Customers", options?.customers || [])}
      {!["inventory", "stock_movement"].includes(selected) &&
        field(
          "sales_status",
          "Sales status",
          ["PAID", "PENDING", "FAILED"].map((s) => ({ id: s, name: s })),
        )}
      {selected === "inventory" &&
        field(
          "stock_status",
          "Stock status",
          ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"].map((s) => ({
            id: s,
            name: s.replaceAll("_", " "),
          })),
        )}
      {selected !== "inventory" &&
        field("user_id", "Users", options?.users || [])}
    </div>
  );
}
