/* Provides the add-product action and displays the invoice product rows. */
import { Alert, Box, Typography } from "@mui/material";
import Button from "../../components/common/Button/Button";
import SaleItemRow from "./SaleItemRow";
import type { SaleFormProps } from "./saleFormTypes";

type Props = Pick<
  SaleFormProps,
  "form" | "products" | "onForm" | "onAddItem" | "onUpdateItem" | "itemError"
>;

export default function SaleItemsSection(p: Props) {
  return (
    <>
      <Box className="sales-items-title">
        <Typography component="h3">Products</Typography>
        <Button variant="outlined" size="small" onClick={p.onAddItem}>
          Add Product
        </Button>
      </Box>
      {!p.form.items.length && (
        <Alert severity="info">Add at least one product to continue.</Alert>
      )}
      {p.form.items.map((item, index) => (
        <SaleItemRow
          key={`${item.productId}-${index}`}
          {...p}
          item={item}
          index={index}
        />
      ))}
    </>
  );
}
