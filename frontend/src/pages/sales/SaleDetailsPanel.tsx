// Provides the Sale Details Panel UI for the sales feature.
import { Box, Typography } from "@mui/material";
import DownloadIcon from "@mui/icons-material/DownloadOutlined";
import type { Product } from "../../api/catalogApi";
import type { Sale } from "../../api/salesApi";
import Button from "../../components/common/Button/Button";
import { currency, displayLabel } from "./salesUtils";
// This component receives prepared data and renders the feature-specific interface.
export default function SaleDetailsPanel({
  sale,
  products,
  onPdf,
  onCsv,
}: {
  sale: Sale;
  products: Product[];
  onPdf: () => void;
  onCsv: () => void;
}) {
  const sku = (id: string) =>
    products.find((product) => product.id === id)?.sku || "—";
  const subtotal = sale.items.reduce(
      (sum, item) => sum + item.quantity * Number(item.unitPrice),
      0,
    ),
    discount = sale.items.reduce((sum, item) => sum + Number(item.discount), 0),
    tax = sale.items.reduce((sum, item) => sum + Number(item.tax), 0);
  return (
    <Box className="sales-component sales-detail-page">
      <Box className="sales-detail-actions">
        <Button variant="outlined" onClick={() => window.print()}>
          Print Invoice
        </Button>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={onPdf}>
          Export PDF
        </Button>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={onCsv}>
          Export CSV
        </Button>
      </Box>
      <Box className="sales-detail-grid">
        <Box className="sales-info-card">
          <Typography component="h3">Invoice Information</Typography>
          {[
            ["Invoice Number", sale.invoiceNumber],
            ["Sale Date", new Date(sale.saleDate).toLocaleString("en-IN")],
            ["Customer", sale.customerName],
            ["Payment Method", displayLabel(sale.paymentMethod)],
            ["Payment Status", displayLabel(sale.paymentStatus || "PAID")],
            ["Salesperson", sale.createdByName],
          ].map(([label, value]) => (
            <span key={label}>
              {label}
              <strong>{value}</strong>
            </span>
          ))}
        </Box>
        <Box className="sales-products-card">
          <Typography component="h3">Purchased Products</Typography>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Discount</th>
                <th>Tax</th>
                <th>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.productName}</td>
                  <td>{sku(item.productId)}</td>
                  <td>{item.quantity}</td>
                  <td>{currency(Number(item.unitPrice))}</td>
                  <td>{currency(Number(item.discount))}</td>
                  <td>{currency(Number(item.tax))}</td>
                  <td>
                    <strong>{currency(Number(item.total))}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
        <Box className="sales-pricing-card">
          <Typography component="h3">Pricing Summary</Typography>
          <span>
            Subtotal<strong>{currency(subtotal)}</strong>
          </span>
          <span>
            Discount<strong>- {currency(discount)}</strong>
          </span>
          <span>
            Tax<strong>+ {currency(tax)}</strong>
          </span>
          <h3>
            Grand Total<strong>{currency(Number(sale.totalAmount))}</strong>
          </h3>
        </Box>
      </Box>
      <Box className="sales-invoice">
        <Box className="sales-invoice__header">
          <Box>
            <Typography component="h2">RetailPulse</Typography>
            <small>Analytics</small>
          </Box>
          <Box>
            <Typography component="strong">INVOICE</Typography>
            <span
              className={`sales-status sales-status--${(sale.paymentStatus || "PAID").toLowerCase()}`}
            >
              {displayLabel(sale.paymentStatus || "PAID")}
            </span>
          </Box>
        </Box>
        <Box className="sales-invoice__meta">
          <div>
            <small>Bill To</small>
            <strong>{sale.customerName}</strong>
            {sale.notes && <span>{sale.notes}</span>}
          </div>
          <div>
            <span>
              Invoice Number <strong>{sale.invoiceNumber}</strong>
            </span>
            <span>
              Invoice Date{" "}
              <strong>
                {new Date(sale.saleDate).toLocaleDateString("en-IN")}
              </strong>
            </span>
            <span>
              Payment Method <strong>{displayLabel(sale.paymentMethod)}</strong>
            </span>
          </div>
        </Box>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Product</th>
              <th>SKU</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Line Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{item.productName}</td>
                <td>{sku(item.productId)}</td>
                <td>{item.quantity}</td>
                <td>{currency(Number(item.unitPrice))}</td>
                <td>{currency(Number(item.total))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Box className="sales-invoice__total">
          <strong>Grand Total</strong>
          <strong>{currency(Number(sale.totalAmount))}</strong>
        </Box>
      </Box>
    </Box>
  );
}
