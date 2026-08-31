/* Teaching guide: This file contains customer form page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
// Handles the customer form user interface and its interactions.
import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";
import type { Customer, CustomerInput } from "../../api/customerApi";
import {
  CustomerError,
  empty,
  title,
  type CustomerIssue,
} from "./customerShared";
// This component receives prepared data and renders the feature-specific interface.
export default function CustomerForm({
  open,
  customer,
  issue,
  onClose,
  onSave,
  onValidationError,
}: {
  open: boolean;
  customer?: Customer;
  issue: CustomerIssue | null;
  onClose: () => void;
  onSave: (v: CustomerInput) => void;
  onValidationError: (issue: CustomerIssue) => void;
}) {
  const [form, setForm] = useState<CustomerInput>(empty);
  useEffect(
    () =>
      setForm(
        customer
          ? {
              fullName: customer.fullName,
              email: customer.email,
              phone: customer.phone,
              gender: customer.gender || "",
              dateOfBirth: customer.dateOfBirth || "",
              address: customer.address || "",
              city: customer.city || "",
              state: customer.state || "",
              country: customer.country || "",
              customerType: customer.customerType,
              preferredSalesChannel: customer.preferredSalesChannel || "",
              status: customer.status,
            }
          : empty,
      ),
    [customer, open],
  );
  const set = (key: keyof CustomerInput, value: string) =>
    setForm((v) => ({ ...v, [key]: value }));
  const submit = () => {
    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim()) {
      onValidationError({
        title: "Validation Error",
        message: "Please fill all required fields correctly.",
        severity: "warning",
      });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      onValidationError({
        title: "Validation Error",
        message: "Enter a valid customer email address.",
        severity: "warning",
      });
      return;
    }
    if (form.phone.trim().length < 7) {
      onValidationError({
        title: "Validation Error",
        message: "Phone number must contain at least 7 characters.",
        severity: "warning",
      });
      return;
    }
    onSave(form);
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {customer ? "Edit customer" : "Add new customer"}
      </DialogTitle>
      <DialogContent className="customer-form">
        {issue && <CustomerError issue={issue} />}
        <TextField
          required
          label="Full name"
          value={form.fullName}
          onChange={(e) => set("fullName", e.target.value)}
        />
        <TextField
          required
          type="email"
          label="Email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
        />
        <TextField
          required
          label="Phone"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
        />
        <TextField
          select
          label="Customer type"
          value={form.customerType}
          onChange={(e) => set("customerType", e.target.value)}
        >
          {["RETAIL", "WHOLESALE", "CORPORATE"].map((x) => (
            <MenuItem key={x} value={x}>
              {title(x)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Status"
          value={form.status}
          onChange={(e) => set("status", e.target.value)}
        >
          {["ACTIVE", "INACTIVE"].map((x) => (
            <MenuItem key={x} value={x}>
              {title(x)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Gender"
          value={form.gender}
          onChange={(e) => set("gender", e.target.value)}
        >
          <MenuItem value="">Not specified</MenuItem>
          {["Male", "Female", "Other"].map((x) => (
            <MenuItem key={x} value={x}>
              {x}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          type="date"
          label="Date of birth"
          value={form.dateOfBirth}
          onChange={(e) => set("dateOfBirth", e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          select
          label="Preferred channel"
          value={form.preferredSalesChannel}
          onChange={(e) => set("preferredSalesChannel", e.target.value)}
        >
          {["RETAIL_STORE", "ONLINE_STORE", "MARKETPLACE"].map((x) => (
            <MenuItem key={x} value={x}>
              {title(x)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Address"
          value={form.address}
          onChange={(e) => set("address", e.target.value)}
        />
        <TextField
          label="City"
          value={form.city}
          onChange={(e) => set("city", e.target.value)}
        />
        <TextField
          label="State"
          value={form.state}
          onChange={(e) => set("state", e.target.value)}
        />
        <TextField
          label="Country"
          value={form.country}
          onChange={(e) => set("country", e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit}>
          Save customer
        </Button>
      </DialogActions>
    </Dialog>
  );
}
