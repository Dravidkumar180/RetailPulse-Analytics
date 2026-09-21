/* Shows invoice totals and the cancel and save controls. */
import { Alert, Box, Typography } from "@mui/material";
import Button from "../../components/common/Button/Button";
import { currency } from "./salesUtils";
import type { SaleFormProps } from "./saleFormTypes";

type Props = Pick<
  SaleFormProps,
  | "form"
  | "subtotal"
  | "discount"
  | "tax"
  | "total"
  | "onCancel"
  | "onSave"
  | "saving"
  | "invalid"
>;

export default function SaleBillingSummary(p: Props) {
  return (
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
      {/* Saving stays disabled while the form is invalid or a save is running. */}
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
  );
}
