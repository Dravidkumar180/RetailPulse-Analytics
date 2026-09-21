/* Creates invoice PDF/CSV downloads and a CSV report of the filtered sales. */
import type { Product } from "../../api/catalogApi";
import {
  logSaleExport,
  logSalesReportExport,
  type Sale,
} from "../../api/salesApi";
import { createPdfReport } from "../../utils/createPdfReport";
import { displayLabel, downloadBlob, invoiceLines } from "./salesUtils";

export function createSalesExportHandlers(products: Product[], sales: Sale[]) {
  const selected = (id: string) =>
    products.find((product) => product.id === id);
  // Build an invoice PDF from the sale and current product information.
  const exportPdf = (sale: Sale) => {
    void logSaleExport(sale.id, "pdf");
    downloadBlob(
      createPdfReport(
        `RetailPulse Invoice ${sale.invoiceNumber}`,
        invoiceLines(sale, products),
      ),
      `${sale.invoiceNumber}.pdf`,
    );
  };
  // Create one CSV row per invoice item and record the export action.
  const exportCsv = (sale: Sale) => {
    void logSaleExport(sale.id, "csv");
    const rows = [
      [
        "Invoice",
        "Customer",
        "Date",
        "Payment Method",
        "Payment Status",
        "Product",
        "SKU",
        "Quantity",
        "Unit Price",
        "Discount",
        "Tax",
        "Line Total",
      ],
      ...sale.items.map((item) => [
        sale.invoiceNumber,
        sale.customerName,
        sale.saleDate,
        displayLabel(sale.paymentMethod),
        displayLabel(sale.paymentStatus || "PAID"),
        item.productName,
        selected(item.productId)?.sku || "",
        item.quantity,
        item.unitPrice,
        item.discount,
        item.tax,
        item.total,
      ]),
    ];
    downloadBlob(
      new Blob(
        [
          rows
            .map((row) =>
              row
                .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
                .join(","),
            )
            .join("\n"),
        ],
        { type: "text/csv;charset=utf-8" },
      ),
      `${sale.invoiceNumber}.csv`,
    );
  };
  // Export the filtered sales passed to this function, including rows on other list pages.
  const exportSales = () => {
    void logSalesReportExport();
    const rows = [
      [
        "Invoice",
        "Customer",
        "Sale Date",
        "Items",
        "Total",
        "Payment Method",
        "Payment Status",
      ],
      ...sales.map((sale) => [
        sale.invoiceNumber,
        sale.customerName,
        sale.saleDate,
        sale.items.reduce((sum, item) => sum + item.quantity, 0),
        sale.totalAmount,
        displayLabel(sale.paymentMethod),
        displayLabel(sale.paymentStatus || "PAID"),
      ]),
    ];
    downloadBlob(
      new Blob(
        [
          rows
            .map((row) =>
              row
                .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
                .join(","),
            )
            .join("\n"),
        ],
        { type: "text/csv;charset=utf-8" },
      ),
      "sales-report.csv",
    );
  };
  return { exportPdf, exportCsv, exportSales };
}
