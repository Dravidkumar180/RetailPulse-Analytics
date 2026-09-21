/* Edits one product line and shows stock details, validation, and its line total. */
import {
  Alert,
  Box,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { SaleItemInput } from "../../api/salesApi";
import { currency, displayLabel } from "./salesUtils";
import type { SaleFormProps } from "./saleFormTypes";

type Props = Pick<
  SaleFormProps,
  "form" | "products" | "onForm" | "onUpdateItem" | "itemError"
> & { item: SaleItemInput; index: number };

export default function SaleItemRow(p: Props) {
  const { item, index } = p;
  // Find stock and catalog details for this row without changing the invoice values.
  const product = p.products.find((product) => product.id === item.productId);
  // Ask the parent validation function whether this line needs an error message.
  const validation = p.itemError(item);
  return (
    <Box className="sales-item">
      <Box className="sales-item__head">
        <Typography component="strong">Product {index + 1}</Typography>
        <IconButton
          color="error"
          onClick={() =>
            p.onForm({
              ...p.form,
              items: p.form.items.filter((_, itemIndex) => itemIndex !== index),
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
        onChange={(e) => p.onUpdateItem(index, "productId", e.target.value)}
      >
        {p.products.map((option) => (
          <MenuItem
            key={option.id}
            value={option.id}
            disabled={p.form.items.some(
              (existing, i) => i !== index && existing.productId === option.id,
            )}
          >
            {option.name} ({option.stockQuantity} available)
          </MenuItem>
        ))}
      </TextField>
      {/* These values come from the selected product in the catalog. */}
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
      {/* Changing quantity, discount, or tax updates the invoice through the parent. */}
      <Box className="sales-item__numbers">
        {(["quantity", "unitPrice", "discount", "tax"] as const).map((key) => (
          <TextField
            key={key}
            type="number"
            label={displayLabel(key)}
            value={item[key]}
            disabled={key === "unitPrice"}
            onChange={(e) => p.onUpdateItem(index, key, e.target.value)}
            inputProps={{
              min: key === "quantity" ? 1 : 0,
              max: key === "quantity" ? product?.stockQuantity : undefined,
            }}
          />
        ))}
      </Box>
      {validation && <Alert severity="error">{validation}</Alert>}
      <strong>
        Line Total:{" "}
        {currency(item.quantity * item.unitPrice - item.discount + item.tax)}
      </strong>
    </Box>
  );
}
