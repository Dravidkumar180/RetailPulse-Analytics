// Provides the Customer History Panel UI for the customers feature.
import { Box, MenuItem, TextField, Typography } from "@mui/material";
import type { Customer } from "../../api/customerApi";
import HistoryViewContent, { type HistoryView } from "./CustomerHistory";
import CustomerExportButtons from "./CustomerExportButtons";
// This component receives prepared data and renders the feature-specific interface.
export default function CustomerHistoryPanel({
  customers,
  current,
  view,
  editable,
  onCustomer,
  onView,
  onExport,
}: {
  customers: Customer[];
  current?: Customer;
  view: HistoryView;
  editable: boolean;
  onCustomer: (customer?: Customer) => void;
  onView: (view: HistoryView) => void;
  onExport: (format: "CSV" | "PDF") => void;
}) {
  const links: [HistoryView, string][] = [
    ["profile", "Profile Overview"],
    ["purchase-history", "Purchase History"],
    ["recent-activity", "Recent Activity"],
    ["timeline", "Timeline"],
    ["notes", "Notes"],
  ];
  return (
    <Box className="component-panel">
      <Box className="component-panel__header">
        <Typography component="h2">Customer History</Typography>
        {editable && current && <CustomerExportButtons onExport={onExport} />}
      </Box>
      <Box className="history-layout">
        <aside>
          <h3>Customer</h3>
          <TextField
            select
            fullWidth
            size="small"
            value={current?.id || ""}
            onChange={(event) =>
              onCustomer(
                customers.find(
                  (customer) => customer.id === event.target.value,
                ),
              )
            }
          >
            {customers.map((customer) => (
              <MenuItem key={customer.id} value={customer.id}>
                {customer.fullName}
              </MenuItem>
            ))}
          </TextField>
          {links.map(([value, label]) => (
            <button
              key={value}
              className={view === value ? "active" : ""}
              onClick={() => onView(value)}
            >
              {label}
            </button>
          ))}
        </aside>
        {current ? (
          <Box className="history-content history-content--single">
            <HistoryViewContent customer={current} view={view} />
          </Box>
        ) : (
          <Box className="customer-empty">
            Add or select a customer to view their history.
          </Box>
        )}
      </Box>
    </Box>
  );
}
