/* Teaching guide: This file contains sales utils page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
// Provides shared formatting and calculation helpers for the sales screens.
import type { Product } from "../../api/catalogApi";
import type { Sale, SaleInput } from "../../api/salesApi";

// The shared values below keep formatting and business rules consistent.
export const emptySale = (): SaleInput => ({
  customerId: "",
  customerName: "",
  saleDate: new Date().toISOString().slice(0, 16),
  salesChannel: "RETAIL_STORE",
  paymentMethod: "CARD",
  paymentStatus: "PAID",
  notes: "",
  items: [],
});
export const displayLabel = (value = "") =>
  value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
export const currency = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    Number(value),
  );
export const downloadBlob = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
};
export const saleToInput = (sale: Sale): SaleInput => ({
  customerId: sale.customerId || "",
  customerName: sale.customerName,
  saleDate: sale.saleDate.slice(0, 16),
  salesChannel: sale.salesChannel,
  paymentMethod: sale.paymentMethod,
  paymentStatus: sale.paymentStatus || "PAID",
  notes: sale.notes || "",
  items: sale.items.map(
    ({ productId, quantity, unitPrice, discount, tax }) => ({
      productId,
      quantity,
      unitPrice: Number(unitPrice),
      discount: Number(discount),
      tax: Number(tax),
    }),
  ),
});
export const invoiceLines = (sale: Sale, products: Product[]) => {
  const product = (id: string) => products.find((item) => item.id === id);
  const subtotal = sale.items.reduce(
      (sum, item) => sum + item.quantity * Number(item.unitPrice),
      0,
    ),
    discount = sale.items.reduce((sum, item) => sum + Number(item.discount), 0),
    tax = sale.items.reduce((sum, item) => sum + Number(item.tax), 0);
  return [
    `Invoice Number: ${sale.invoiceNumber}`,
    `Invoice Date: ${new Date(sale.saleDate).toLocaleString("en-IN")}`,
    `Customer: ${sale.customerName}`,
    `Payment Method: ${displayLabel(sale.paymentMethod)}`,
    `Payment Status: ${displayLabel(sale.paymentStatus || "PAID")}`,
    `Salesperson: ${sale.createdByName}`,
    "",
    "PRODUCT | SKU | QTY | UNIT PRICE | DISCOUNT | TAX | LINE TOTAL",
    ...sale.items.map((item) =>
      [
        item.productName,
        product(item.productId)?.sku || "-",
        item.quantity,
        currency(Number(item.unitPrice)),
        currency(Number(item.discount)),
        currency(Number(item.tax)),
        currency(Number(item.total)),
      ].join(" | "),
    ),
    "",
    `Subtotal: ${currency(subtotal)}`,
    `Discount: ${currency(discount)}`,
    `Tax: ${currency(tax)}`,
    `Grand Total: ${currency(Number(sale.totalAmount))}`,
    ...(sale.notes ? [`Notes: ${sale.notes}`] : []),
  ];
};
