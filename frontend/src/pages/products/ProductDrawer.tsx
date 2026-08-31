/* Teaching guide: This file contains product drawer page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
// Handles the product drawer user interface and its interactions.
import {
  Box,
  Drawer,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { Category, Product, ProductInput } from "../../api/catalogApi";
import Button from "../../components/common/Button/Button";

type Props = {
  open: boolean;
  editing: Product | null;
  form: ProductInput;
  categories: Category[];
  error: string;
  canEdit: boolean;
  saving: boolean;
  onClose: () => void;
  onField: (key: keyof ProductInput, value: string) => void;
  onSave: () => void;
};
// This component receives prepared data and renders the feature-specific interface.
export default function ProductDrawer(p: Props) {
  return (
    <Drawer anchor="right" open={p.open} onClose={p.onClose}>
      <Box className="catalog-drawer">
        <Box className="catalog-drawer__head">
          <Typography component="h2">
            {p.editing ? "Edit Product" : "Add Product"}
          </Typography>
          <IconButton onClick={p.onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        {p.error && <p className="catalog-error">{p.error}</p>}
        {(["name", "sku", "brand"] as const).map((key) => (
          <TextField
            key={key}
            required={key !== "brand"}
            label={key === "name" ? "Product Name" : key.toUpperCase()}
            value={p.form[key]}
            onChange={(e) => p.onField(key, e.target.value)}
          />
        ))}
        <TextField
          select
          required
          label="Category"
          value={p.form.categoryId}
          onChange={(e) => p.onField("categoryId", e.target.value)}
        >
          {p.categories
            .filter((c) => c.status === "ACTIVE")
            .map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
        </TextField>
        <TextField
          multiline
          rows={3}
          label="Description"
          value={p.form.description}
          onChange={(e) => p.onField("description", e.target.value)}
        />
        {(["unitPrice", "costPrice", "stockQuantity"] as const).map((key) => (
          <TextField
            key={key}
            required
            type="number"
            label={
              key === "unitPrice"
                ? "Unit Price"
                : key === "costPrice"
                  ? "Cost Price"
                  : "Initial Stock Quantity"
            }
            value={p.form[key]}
            onChange={(e) => p.onField(key, e.target.value)}
          />
        ))}
        <TextField
          select
          required
          label="Unit of Measure"
          value={p.form.unitOfMeasure}
          onChange={(e) => p.onField("unitOfMeasure", e.target.value)}
        >
          {["Piece", "Kilogram", "Liter", "Box", "Pack", "Meter"].map(
            (unit) => (
              <MenuItem key={unit} value={unit}>
                {unit}
              </MenuItem>
            ),
          )}
        </TextField>
        <TextField
          select
          required
          label="Status"
          value={p.form.status}
          onChange={(e) => p.onField("status", e.target.value)}
        >
          <MenuItem value="ACTIVE">Active</MenuItem>
          <MenuItem value="INACTIVE">Inactive</MenuItem>
        </TextField>
        <Box className="catalog-drawer__actions">
          <Button variant="outlined" onClick={p.onClose}>
            Cancel
          </Button>
          {p.canEdit && (
            <Button loading={p.saving} onClick={p.onSave}>
              Save Product
            </Button>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}
