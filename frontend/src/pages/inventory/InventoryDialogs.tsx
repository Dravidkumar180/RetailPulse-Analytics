/* Teaching guide: This file contains inventory dialogs page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
// Handles the inventory dialogs user interface and its interactions.
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";
import type {
  AdjustmentType,
  InventoryItem,
  InventoryMovement,
} from "../../api/inventoryApi";
import MovementTable from "./MovementTable";
import { ADJUSTMENT_REASONS, MOVEMENT_LABEL } from "./inventoryConstants";
type Props = {
  dialogType: AdjustmentType | null;
  historyOpen: boolean;
  items: InventoryItem[];
  selected?: InventoryItem;
  productId: string;
  quantity: string;
  reason: string;
  remarks: string;
  reorderLevel: string;
  saving: boolean;
  error?: string;
  movements: InventoryMovement[];
  onCloseAdjustment: () => void;
  onCloseHistory: () => void;
  onProduct: (id: string) => void;
  onQuantity: (value: string) => void;
  onReason: (value: string) => void;
  onRemarks: (value: string) => void;
  onReorderLevel: (value: string) => void;
  onSubmit: () => void;
};
// This component receives prepared data and renders the feature-specific interface.
export default function InventoryDialogs(p: Props) {
  return (
    <>
      <Dialog
        open={Boolean(p.dialogType)}
        onClose={p.onCloseAdjustment}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {p.dialogType ? MOVEMENT_LABEL[p.dialogType] : "Stock Adjustment"}
        </DialogTitle>
        <DialogContent className="inventory-dialog">
          <TextField
            select
            label="Product"
            value={p.productId}
            onChange={(e) => p.onProduct(e.target.value)}
            required
          >
            {p.items.map((item) => (
              <MenuItem key={item.productId} value={item.productId}>
                {item.productName} ({item.sku}) — {item.availableStock}{" "}
                available
              </MenuItem>
            ))}
          </TextField>
          <TextField
            type="number"
            label={
              p.dialogType === "MANUAL_ADJUSTMENT"
                ? "Set current stock to"
                : "Quantity"
            }
            value={p.quantity}
            onChange={(e) => p.onQuantity(e.target.value)}
            inputProps={{ min: 1 }}
            required
          />
          <TextField
            type="number"
            label="Reorder Level"
            value={p.reorderLevel}
            onChange={(e) => p.onReorderLevel(e.target.value)}
            inputProps={{ min: 0 }}
          />
          <TextField
            select
            label="Adjustment Reason"
            value={p.reason}
            onChange={(e) => p.onReason(e.target.value)}
            required
          >
            {ADJUSTMENT_REASONS.map((reason) => (
              <MenuItem key={reason} value={reason}>
                {reason}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Remarks"
            value={p.remarks}
            onChange={(e) => p.onRemarks(e.target.value)}
            multiline
            rows={3}
          />
          {p.selected && (
            <Alert severity="info">
              Current: {p.selected.currentStock} · Reserved:{" "}
              {p.selected.reservedStock} · Available:{" "}
              {p.selected.availableStock}
            </Alert>
          )}
          {p.error && <Alert severity="error">{p.error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={p.onCloseAdjustment}>Cancel</Button>
          <Button
            variant="contained"
            disabled={
              !p.productId ||
              !p.quantity ||
              Number(p.quantity) <= 0 ||
              !p.reason ||
              p.saving
            }
            onClick={p.onSubmit}
          >
            Save Adjustment
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={p.historyOpen}
        onClose={p.onCloseHistory}
        fullWidth
        maxWidth="xl"
      >
        <DialogTitle>Stock Movement History</DialogTitle>
        <DialogContent>
          <MovementTable rows={p.movements} />
        </DialogContent>
        <DialogActions>
          <Button onClick={p.onCloseHistory}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
