/* Teaching guide: This file contains customer list panel page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
// Provides the Customer List Panel UI for the customers feature.
import {
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Pagination,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditIcon from "@mui/icons-material/EditOutlined";
import FilterIcon from "@mui/icons-material/FilterAltOutlined";
import SearchIcon from "@mui/icons-material/Search";
import SearchOffIcon from "@mui/icons-material/SearchOffOutlined";
import VisibilityIcon from "@mui/icons-material/VisibilityOutlined";
import type { Customer } from "../../api/customerApi";
import CustomerExportButtons from "./CustomerExportButtons";
import {
  CustomerError,
  CustomerLoadingState,
  CustomerSegmentGuide,
  SegmentBadge,
  money,
  title,
  type CustomerIssue,
} from "./customerShared";
// The declarations below define the public data used by this module.
export type CustomerFilters = {
  search: string;
  type: string;
  status: string;
  city: string;
  country: string;
};
type Props = {
  rows: Customer[];
  allRows: Customer[];
  cities: string[];
  countries: string[];
  filters: CustomerFilters;
  editable: boolean;
  loading: boolean;
  failed: boolean;
  issue: CustomerIssue | null;
  deleting: boolean;
  page: number;
  pageCount: number;
  pageSize: number;
  onFilter: (key: keyof CustomerFilters, value: string) => void;
  onClear: () => void;
  onAdd: () => void;
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onPage: (page: number) => void;
  onCloseIssue: () => void;
  onRetry: () => void;
  onExport: (format: "CSV" | "PDF") => void;
};
export default function CustomerListPanel(p: Props) {
  const hasFilters = Object.values(p.filters).some(Boolean),
    filteredTotal = p.allRows.filter(
      (customer) =>
        (!p.filters.city || customer.city === p.filters.city) &&
        (!p.filters.country || customer.country === p.filters.country),
    ).length;
  return (
    <Box className="all-customers">
      <Typography component="h2">All Customers</Typography>
      <Box className="customer-toolbar">
        <label>
          <SearchIcon />
          <input
            placeholder="Search by name, ID, email or phone..."
            value={p.filters.search}
            onChange={(e) => p.onFilter("search", e.target.value)}
          />
        </label>
        {[
          ["type", "All Customer Types", ["RETAIL", "WHOLESALE", "CORPORATE"]],
          ["status", "All Status", ["ACTIVE", "INACTIVE"]],
          ["city", "All Cities", p.cities],
          ["country", "All Countries", p.countries],
        ].map(([key, placeholder, values]) => (
          <TextField
            key={String(key)}
            select
            size="small"
            value={p.filters[key as keyof CustomerFilters]}
            onChange={(e) =>
              p.onFilter(key as keyof CustomerFilters, e.target.value)
            }
            slotProps={{
              select: {
                displayEmpty: true,
                renderValue: (value) =>
                  value ? title(String(value)) : String(placeholder),
              },
            }}
          >
            <MenuItem value="">{placeholder}</MenuItem>
            {(values as string[]).map((value) => (
              <MenuItem value={value} key={value}>
                {title(value)}
              </MenuItem>
            ))}
          </TextField>
        ))}
        <Button
          variant="outlined"
          startIcon={<FilterIcon />}
          onClick={p.onClear}
        >
          Filters
        </Button>
        {p.editable && <CustomerExportButtons onExport={p.onExport} />}
      </Box>
      {p.issue && <CustomerError issue={p.issue} onClose={p.onCloseIssue} />}{" "}
      {p.failed && (
        <CustomerError
          issue={{
            title: "Failed to Load Customers",
            message:
              "Something went wrong while fetching customers. Please try again.",
            severity: "error",
          }}
          onRetry={p.onRetry}
        />
      )}{" "}
      {p.loading && <CustomerLoadingState />}
      {!p.loading && !p.failed && !p.allRows.length && (
        <Box className="customer-empty-state">
          <SearchOffIcon />
          <Typography component="h3">
            {hasFilters ? "No Customers Match" : "No Customers Found"}
          </Typography>
          <Typography>
            {hasFilters
              ? "Try clearing or changing the current search and filters."
              : "There are no customers available. Add your first customer to get started."}
          </Typography>
          {hasFilters ? (
            <Button variant="outlined" onClick={p.onClear}>
              Clear Filters
            </Button>
          ) : (
            p.editable && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={p.onAdd}
              >
                Add Customer
              </Button>
            )
          )}
        </Box>
      )}
      {!p.loading && !p.failed && p.allRows.length > 0 && (
        <>
          <CustomerSegmentGuide />
          <Box className="customer-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>Customer Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Customer Type</th>
                  <th>Total Orders</th>
                  <th>Total Revenue</th>
                  <th>Status</th>
                  <th>Customer Segment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {p.rows.map((customer) => (
                  <tr key={customer.id}>
                    <td className="customer-code">{customer.customerId}</td>
                    <td>
                      <b>{customer.fullName}</b>
                    </td>
                    <td>{customer.email}</td>
                    <td>{customer.phone}</td>
                    <td>{title(customer.customerType)}</td>
                    <td>{customer.summary.totalOrders}</td>
                    <td>
                      <b>{money(customer.summary.totalRevenue)}</b>
                    </td>
                    <td>
                      <Chip
                        size="small"
                        color={
                          customer.status === "ACTIVE" ? "success" : "default"
                        }
                        label={title(customer.status)}
                      />
                    </td>
                    <td>
                      <SegmentBadge segment={customer.segment} />
                    </td>
                    <td className="customer-actions">
                      <IconButton
                        size="small"
                        title="View"
                        onClick={() => p.onView(customer)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      {p.editable && (
                        <IconButton
                          size="small"
                          title="Edit"
                          onClick={() => p.onEdit(customer)}
                        >
                          <EditIcon />
                        </IconButton>
                      )}
                      {p.editable && (
                        <IconButton
                          className="delete-action"
                          size="small"
                          title="Delete customer"
                          disabled={p.deleting}
                          onClick={() => p.onDelete(customer)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!p.rows.length && (
              <Box className="customer-empty">
                No customers match the current filters.
              </Box>
            )}
            <Box className="customer-pagination">
              <span>
                Showing {filteredTotal ? (p.page - 1) * p.pageSize + 1 : 0} to{" "}
                {Math.min(p.page * p.pageSize, filteredTotal)} of{" "}
                {filteredTotal} customers
              </span>
              <Pagination
                count={p.pageCount}
                page={Math.min(p.page, p.pageCount)}
                onChange={(_, page) => p.onPage(page)}
                color="primary"
                size="small"
              />
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}
