/* Edits customer, sale date, payment details, sales channel, and notes. */
import { Box, MenuItem, TextField } from "@mui/material";
import type { SaleInput } from "../../api/salesApi";
import { displayLabel } from "./salesUtils";
import type { SaleFormProps } from "./saleFormTypes";

type Props = Pick<SaleFormProps, "form" | "customers" | "onForm">;

export default function SaleInformationFields(p: Props) {
  return (
    <Box className="sales-form-grid">
      {/* Choose the customer and copy their name into the invoice. */}
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
  );
}
