/* Arranges the invoice fields, product rows, billing summary, and save error. */
import { Alert, Box, Typography } from "@mui/material";
import SaleInformationFields from "./SaleInformationFields";
import SaleItemsSection from "./SaleItemsSection";
import SaleBillingSummary from "./SaleBillingSummary";
import type { SaleFormProps } from "./saleFormTypes";

export default function SaleFormPanel(props: SaleFormProps) {
  return (
    <Box className="sales-component sales-create">
      <Box className="sales-form-card">
        <Typography component="h2">
          {props.editing
            ? `Edit ${props.editing.invoiceNumber}`
            : "Create Sale"}
        </Typography>
        {props.error && <Alert severity="error">{props.error}</Alert>}
        {/* Customer and invoice fields are separate from the product lines below. */}
        <SaleInformationFields {...props} />
        <SaleItemsSection {...props} />
      </Box>
      <SaleBillingSummary {...props} />
    </Box>
  );
}
