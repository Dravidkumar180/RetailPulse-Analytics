// Provides the Sales List Panel UI for the sales feature.
import {
  Alert,
  Box,
  IconButton,
  MenuItem,
  Pagination,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/DownloadOutlined";
import VisibilityIcon from "@mui/icons-material/VisibilityOutlined";
import EditIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutlineOutlined";
import type { Category } from "../../api/catalogApi";
import type { Sale, SalesSummary } from "../../api/salesApi";
import Button from "../../components/common/Button/Button";
import SalesSummaryCards from "./SalesSummaryCards";
import { currency, displayLabel } from "./salesUtils";
// The declarations below define the public data used by this module.
export type SalesFiltersState = {
  search: string;
  startDate: string;
  endDate: string;
  payment: string;
  paymentStatus: string;
  categoryId: string;
  channel: string;
  sort: string;
};
type Props = {
  summary?: SalesSummary;
  filters: SalesFiltersState;
  categories: Category[];
  sales: Sale[];
  loading: boolean;
  failed: boolean;
  canEdit: boolean;
  page: number;
  pageCount: number;
  onFilter: (key: keyof SalesFiltersState, value: string) => void;
  onClear: () => void;
  onPage: (page: number) => void;
  onView: (sale: Sale) => void;
  onEdit: (sale: Sale) => void;
  onDelete: (sale: Sale) => void;
  onExport: () => void;
};
export default function SalesListPanel(p: Props) {
  const f = p.filters;
  return (
    <Box className="sales-component">
      <SalesSummaryCards summary={p.summary} />
      <Box className="sales-panel">
        <Box className="sales-filters">
          <TextField
            size="small"
            placeholder="Search invoice or customer"
            value={f.search}
            onChange={(e) => p.onFilter("search", e.target.value)}
          />
          <TextField
            size="small"
            type="date"
            label="From"
            value={f.startDate}
            onChange={(e) => p.onFilter("startDate", e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            size="small"
            type="date"
            label="To"
            value={f.endDate}
            onChange={(e) => p.onFilter("endDate", e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          {[
            [
              "payment",
              "Payment Method",
              ["CASH", "CARD", "UPI", "BANK_TRANSFER"],
            ],
            ["paymentStatus", "Payment Status", ["PAID", "PENDING", "FAILED"]],
            [
              "channel",
              "Channel",
              ["RETAIL_STORE", "ONLINE_STORE", "MARKETPLACE"],
            ],
          ].map(([key, label, values]) => (
            <TextField
              key={String(key)}
              select
              size="small"
              label={String(label)}
              value={f[key as keyof SalesFiltersState]}
              onChange={(e) =>
                p.onFilter(key as keyof SalesFiltersState, e.target.value)
              }
            >
              <MenuItem value="">All</MenuItem>
              {(values as string[]).map((value) => (
                <MenuItem key={value} value={value}>
                  {displayLabel(value)}
                </MenuItem>
              ))}
            </TextField>
          ))}
          <TextField
            select
            size="small"
            label="Category"
            value={f.categoryId}
            onChange={(e) => p.onFilter("categoryId", e.target.value)}
          >
            <MenuItem value="">All Categories</MenuItem>
            {p.categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Sort"
            value={f.sort}
            onChange={(e) => p.onFilter("sort", e.target.value)}
          >
            <MenuItem value="date">Date (Newest)</MenuItem>
            <MenuItem value="total">Total Amount</MenuItem>
            <MenuItem value="customer">Customer Name</MenuItem>
            <MenuItem value="invoice">Invoice Number</MenuItem>
          </TextField>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            disabled={!p.sales.length}
            onClick={p.onExport}
          >
            Export Sales CSV
          </Button>
        </Box>
        {p.loading ? (
          <Box className="sales-loading">
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton key={index} height={44} />
            ))}
          </Box>
        ) : p.failed ? (
          <Alert severity="error">
            Unable to load sales. Verify the backend and restart the API.
          </Alert>
        ) : (
          <Box className="sales-table">
            <table>
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>Customer Name</th>
                  <th>Sale Date</th>
                  <th>Items</th>
                  <th>Total Amount</th>
                  <th>Payment Method</th>
                  <th>Payment Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {p.sales.map((sale) => (
                  <tr key={sale.id}>
                    <td>
                      <strong>{sale.invoiceNumber}</strong>
                    </td>
                    <td>{sale.customerName}</td>
                    <td>{new Date(sale.saleDate).toLocaleString("en-IN")}</td>
                    <td>
                      {sale.items.reduce((sum, item) => sum + item.quantity, 0)}
                    </td>
                    <td>
                      <strong>{currency(Number(sale.totalAmount))}</strong>
                    </td>
                    <td>{displayLabel(sale.paymentMethod)}</td>
                    <td>
                      <span
                        className={`sales-status sales-status--${(sale.paymentStatus || "PAID").toLowerCase()}`}
                      >
                        {displayLabel(sale.paymentStatus || "PAID")}
                      </span>
                    </td>
                    <td>
                      <IconButton title="View" onClick={() => p.onView(sale)}>
                        <VisibilityIcon />
                      </IconButton>
                      {p.canEdit && (
                        <>
                          <IconButton
                            title="Edit"
                            onClick={() => p.onEdit(sale)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            title="Delete"
                            color="error"
                            onClick={() => p.onDelete(sale)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!p.sales.length && (
              <Box className="sales-empty">
                <Typography component="h3">No sales found</Typography>
                <Typography>
                  Adjust the filters or create your first sale.
                </Typography>
                <Button variant="outlined" onClick={p.onClear}>
                  Clear Filters
                </Button>
              </Box>
            )}
            {p.pageCount > 1 && (
              <Box className="sales-pagination">
                <Pagination
                  count={p.pageCount}
                  page={p.page}
                  onChange={(_, page) => p.onPage(page)}
                  color="primary"
                />
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
