/* Teaching guide: This file contains sale form panel page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
// Handles the sale form panel user interface and its interactions.
import {
  Alert,
  Box,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { Product } from "../../api/catalogApi";
import type { Customer } from "../../api/customerApi";
import type { Sale, SaleInput, SaleItemInput } from "../../api/salesApi";
import Button from "../../components/common/Button/Button";
import { currency, displayLabel } from "./salesUtils";
type Props = {
  editing: Sale | null;
  form: SaleInput;
  products: Product[];
  customers: Customer[];
  error: string;
  saving: boolean;
  invalid: boolean;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  onForm: (form: SaleInput) => void;
  onAddItem: () => void;
  onUpdateItem: (
    index: number,
    key: keyof SaleItemInput,
    value: string,
  ) => void;
  itemError: (item: SaleItemInput) => string;
  onCancel: () => void;
  onSave: () => void;
};
// This component receives prepared data and renders the feature-specific interface.
export default function SaleFormPanel(p: Props) {
  const selected = (id: string) =>
    p.products.find((product) => product.id === id);
  return (
    <Box className="sales-component sales-create">
      <Box className="sales-form-card">
        <Typography component="h2">
          {p.editing ? `Edit ${p.editing.invoiceNumber}` : "Create Sale"}
        </Typography>
        {p.error && <Alert severity="error">{p.error}</Alert>}
        <Box className="sales-form-grid">
          <TextField
            select
            required
            label="Customer"
            value={p.form.customerId}
            onChange={(e) => {
              const customer = p.customers.find(
                (item) => item.id === e.target.value,
              );
              p.onForm({
                ...p.form,
                customerId: e.target.value,
                customerName: customer?.fullName || "",
              });
            }}
          >
            <MenuItem value="">Select customer</MenuItem>
            {p.customers.map((customer) => (
              <MenuItem key={customer.id} value={customer.id}>
                {customer.fullName} ({customer.segment})
              </MenuItem>
            ))}
          </TextField>
          <TextField
            required
            type="datetime-local"
            label="Sale Date"
            value={p.form.saleDate}
            onChange={(e) => p.onForm({ ...p.form, saleDate: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          {[
            [
              "paymentMethod",
              "Payment Method",
              ["CASH", "CARD", "UPI", "BANK_TRANSFER"],
            ],
            ["paymentStatus", "Payment Status", ["PAID", "PENDING", "FAILED"]],
            [
              "salesChannel",
              "Sales Channel",
              ["RETAIL_STORE", "ONLINE_STORE", "MARKETPLACE"],
            ],
          ].map(([key, label, values]) => (
            <TextField
              key={String(key)}
              select
              required
              label={String(label)}
              value={String(p.form[key as keyof SaleInput])}
              onChange={(e) =>
                p.onForm({ ...p.form, [key as string]: e.target.value })
              }
            >
              {(values as string[]).map((value) => (
                <MenuItem key={value} value={value}>
                  {displayLabel(value)}
                </MenuItem>
              ))}
            </TextField>
          ))}
          <TextField
            className="sales-notes"
            label="Notes"
            multiline
            minRows={3}
            value={p.form.notes || ""}
            onChange={(e) => p.onForm({ ...p.form, notes: e.target.value })}
          />
        </Box>
        <Box className="sales-items-title">
          <Typography component="h3">Products</Typography>
          <Button variant="outlined" size="small" onClick={p.onAddItem}>
            Add Product
          </Button>
        </Box>
        {!p.form.items.length && (
          <Alert severity="info">Add at least one product to continue.</Alert>
        )}
        {p.form.items.map((item, index) => {
          const product = selected(item.productId),
            validation = p.itemError(item);
          return (
            <Box className="sales-item" key={`${item.productId}-${index}`}>
              <Box className="sales-item__head">
                <Typography component="strong">Product {index + 1}</Typography>
                <IconButton
                  color="error"
                  onClick={() =>
                    p.onForm({
                      ...p.form,
                      items: p.form.items.filter(
                        (_, itemIndex) => itemIndex !== index,
                      ),
                    })
                  }
                >
                  <CloseIcon />
                </IconButton>
              </Box>
              <TextField
                select
                required
                label="Product"
                value={item.productId}
                onChange={(e) =>
                  p.onUpdateItem(index, "productId", e.target.value)
                }
              >
                {p.products.map((option) => (
                  <MenuItem
                    key={option.id}
                    value={option.id}
                    disabled={p.form.items.some(
                      (existing, i) =>
                        i !== index && existing.productId === option.id,
                    )}
                  >
                    {option.name} ({option.stockQuantity} available)
                  </MenuItem>
                ))}
              </TextField>
              <Box className="sales-product-info">
                <span>
                  <small>SKU</small>
                  <strong>{product?.sku || "—"}</strong>
                </span>
                <span>
                  <small>Category</small>
                  <strong>{product?.categoryName || "—"}</strong>
                </span>
                <span>
                  <small>Unit Price</small>
                  <strong>{currency(Number(product?.unitPrice || 0))}</strong>
                </span>
                <span>
                  <small>Available Stock</small>
                  <strong>{product?.stockQuantity ?? 0}</strong>
                </span>
              </Box>
              <Box className="sales-item__numbers">
                {(["quantity", "unitPrice", "discount", "tax"] as const).map(
                  (key) => (
                    <TextField
                      key={key}
                      type="number"
                      label={displayLabel(key)}
                      value={item[key]}
                      disabled={key === "unitPrice"}
                      onChange={(e) =>
                        p.onUpdateItem(index, key, e.target.value)
                      }
                      inputProps={{
                        min: key === "quantity" ? 1 : 0,
                        max:
                          key === "quantity"
                            ? product?.stockQuantity
                            : undefined,
                      }}
                    />
                  ),
                )}
              </Box>
              {validation && <Alert severity="error">{validation}</Alert>}
              <strong>
                Line Total:{" "}
                {currency(
                  item.quantity * item.unitPrice - item.discount + item.tax,
                )}
              </strong>
            </Box>
          );
        })}
      </Box>
      <Box className="sales-billing">
        <Typography component="h2">Billing Summary</Typography>
        <span>
          Subtotal ({p.form.items.length} items)
          <strong>{currency(p.subtotal)}</strong>
        </span>
        <span>
          Discount<strong>- {currency(p.discount)}</strong>
        </span>
        <span>
          Tax<strong>+ {currency(p.tax)}</strong>
        </span>
        <h3>
          Grand Total<strong>{currency(p.total)}</strong>
        </h3>
        <Alert severity="success">
          Updates automatically when product, quantity, discount or tax changes.
        </Alert>
        <Box className="sales-drawer__actions">
          <Button variant="outlined" onClick={p.onCancel}>
            Cancel
          </Button>
          <Button
            loading={p.saving}
            disabled={p.invalid || p.saving}
            onClick={p.onSave}
          >
            Save Sale
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
