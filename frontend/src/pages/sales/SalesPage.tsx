// React, data-query, and Material UI tools used by the Sales page.
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Box, IconButton, MenuItem, Pagination, Skeleton, Tab, Tabs, TextField, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditIcon from "@mui/icons-material/EditOutlined";
import VisibilityIcon from "@mui/icons-material/VisibilityOutlined";
import DownloadIcon from "@mui/icons-material/DownloadOutlined";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
import Button from "../../components/common/Button/Button";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import { useAuth } from "../../hooks/useAuth";
import { getCategories, getProducts } from "../../api/catalogApi";
import { getCustomers } from "../../api/customerApi";
import { createPdfReport } from "../../utils/createPdfReport";
import { createSale, deleteSale, getSales, getSalesSummary, logSaleExport, logSalesReportExport, updateSale, type Sale, type SaleInput, type SaleItemInput } from "../../api/salesApi";
import "./SalesPage.css";

// Return a clean form whenever the user starts a new sale.
const empty = (): SaleInput => ({ customerId: "", customerName: "", saleDate: new Date().toISOString().slice(0, 16), salesChannel: "RETAIL_STORE", paymentMethod: "CARD", paymentStatus: "PAID", notes: "", items: [] });
// Convert API values such as BANK_TRANSFER into readable labels.
const display = (value = "") => value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
// Display all sale amounts in Indian Rupees.
const currency = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value));
// Download a generated PDF or CSV file and release its temporary URL.
const download = (blob: Blob, name: string) => { const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url); };

// Manage the Sales List, Create Sale, and Sales Details tabs.
const SalesPage = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const canEdit = user?.role !== "VIEWER";
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [channel, setChannel] = useState("");
  const [payment, setPayment] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sort, setSort] = useState("date");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<Sale | null>(null);
  const [editing, setEditing] = useState<Sale | null>(null);
  const [form, setForm] = useState<SaleInput>(empty());
  const [error, setError] = useState("");

  // Load the reference data required by the sale form and filters.
  const products = useQuery({ queryKey: ["products", "sales"], queryFn: () => getProducts({ status: "ACTIVE", sort: "name" }) });
  const categories = useQuery({ queryKey: ["categories"], queryFn: () => getCategories() });
  const customers = useQuery({ queryKey: ["customers", "sales"], queryFn: () => getCustomers({ status: "ACTIVE" }) });
  const sales = useQuery({
    queryKey: ["sales", search, categoryId, channel, payment, paymentStatus, startDate, endDate, sort],
    queryFn: () => getSales({ search: search || undefined, categoryId: categoryId || undefined, salesChannel: channel || undefined, paymentMethod: payment || undefined, paymentStatus: paymentStatus || undefined, startDate: startDate || undefined, endDate: endDate || undefined, sort }),
  });
  const summary = useQuery({ queryKey: ["sales-summary"], queryFn: getSalesSummary });

  // Calculate the live billing summary from the current sale items.
  const selected = (id: string) => products.data?.items.find((product) => product.id === id);
  const subtotal = useMemo(() => form.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0), [form.items]);
  const discountTotal = useMemo(() => form.items.reduce((sum, item) => sum + item.discount, 0), [form.items]);
  const taxTotal = useMemo(() => form.items.reduce((sum, item) => sum + item.tax, 0), [form.items]);
  const total = subtotal - discountTotal + taxTotal;
  const itemError = (item: SaleItemInput) => { const stock = selected(item.productId)?.stockQuantity ?? 0; if (item.quantity <= 0) return "Quantity must be greater than zero."; if (item.quantity > stock) return `Only ${stock} items are available in stock.`; if (item.unitPrice <= 0) return "Unit price must be positive."; if (item.discount > item.quantity * item.unitPrice) return "Discount cannot exceed the item value."; return ""; };
  const formInvalid = !form.customerId || !form.items.length || form.items.some((item) => Boolean(itemError(item)));

  // Refresh every screen affected by a saved or deleted sale.
  const refresh = () => { qc.invalidateQueries({ queryKey: ["sales"] }); qc.invalidateQueries({ queryKey: ["sales-summary"] }); qc.invalidateQueries({ queryKey: ["sales-analytics"] }); qc.invalidateQueries({ queryKey: ["products"] }); qc.invalidateQueries({ queryKey: ["inventory-notifications"] }); };
  // Create or update the transaction and open its completed invoice.
  const save = useMutation({
    mutationFn: () => editing ? updateSale(editing.id, form) : createSale(form),
    onSuccess: (sale) => { refresh(); setView(sale); setEditing(null); setForm(empty()); setTab(2); },
    onError: (reason: any) => setError(reason.response?.data?.detail || reason.message || "Failed to save sale."),
  });
  const remove = useMutation({ mutationFn: deleteSale, onSuccess: refresh });

  // Prepare either a new form or an existing sale for editing.
  const begin = (sale?: Sale) => {
    setError(""); setEditing(sale || null);
    setForm(sale ? { customerId: sale.customerId || "", customerName: sale.customerName, saleDate: sale.saleDate.slice(0, 16), salesChannel: sale.salesChannel, paymentMethod: sale.paymentMethod, paymentStatus: sale.paymentStatus || "PAID", notes: sale.notes || "", items: sale.items.map(({ productId, quantity, unitPrice, discount, tax }) => ({ productId, quantity, unitPrice: Number(unitPrice), discount: Number(discount), tax: Number(tax) })) } : empty());
    setTab(1);
  };
  // Add the first available product that is not already in the transaction.
  const addItem = () => {
    const product = products.data?.items.find((candidate) => candidate.stockQuantity > 0 && !form.items.some((item) => item.productId === candidate.id));
    if (!product) return setError("No additional active product with available stock can be added.");
    setForm((current) => ({ ...current, items: [...current.items, { productId: product.id, quantity: 1, unitPrice: Number(product.unitPrice), discount: 0, tax: 0 }] }));
  };
  const updateItem = (index: number, key: keyof SaleItemInput, value: string) => setForm((current) => ({ ...current, items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: key === "productId" ? value : Number(value), ...(key === "productId" ? { unitPrice: Number(selected(value)?.unitPrice || 0) } : {}) } : item) }));
  const openDetails = (sale: Sale) => { setView(sale); setTab(2); };

  // Build simple invoice lines shared by the PDF export.
  const invoiceLines = (sale: Sale) => {
    const sub = sale.items.reduce((sum, item) => sum + item.quantity * Number(item.unitPrice), 0);
    const discount = sale.items.reduce((sum, item) => sum + Number(item.discount), 0);
    const tax = sale.items.reduce((sum, item) => sum + Number(item.tax), 0);
    return [
      `Invoice Number: ${sale.invoiceNumber}`, `Invoice Date: ${new Date(sale.saleDate).toLocaleString("en-IN")}`, `Customer: ${sale.customerName}`,
      `Payment Method: ${display(sale.paymentMethod)}`, `Payment Status: ${display(sale.paymentStatus || "PAID")}`, `Salesperson: ${sale.createdByName}`, "",
      "PRODUCT | SKU | QTY | UNIT PRICE | DISCOUNT | TAX | LINE TOTAL",
      ...sale.items.map((item) => `${item.productName} | ${selected(item.productId)?.sku || "-"} | ${item.quantity} | ${currency(Number(item.unitPrice))} | ${currency(Number(item.discount))} | ${currency(Number(item.tax))} | ${currency(Number(item.total))}`),
      "", `Subtotal: ${currency(sub)}`, `Discount: ${currency(discount)}`, `Tax: ${currency(tax)}`, `Grand Total: ${currency(Number(sale.totalAmount))}`, ...(sale.notes ? [`Notes: ${sale.notes}`] : []),
    ];
  };
  // Export one invoice and record the export in the audit log.
  const exportPdf = (sale: Sale) => { void logSaleExport(sale.id, "pdf"); download(createPdfReport(`RetailPulse Invoice ${sale.invoiceNumber}`, invoiceLines(sale)), `${sale.invoiceNumber}.pdf`); };
  const exportCsv = (sale: Sale) => {
    void logSaleExport(sale.id, "csv");
    const rows = [["Invoice", "Customer", "Date", "Payment Method", "Payment Status", "Product", "SKU", "Quantity", "Unit Price", "Discount", "Tax", "Line Total"], ...sale.items.map((item) => [sale.invoiceNumber, sale.customerName, sale.saleDate, display(sale.paymentMethod), display(sale.paymentStatus || "PAID"), item.productName, selected(item.productId)?.sku || "", item.quantity, item.unitPrice, item.discount, item.tax, item.total])];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    download(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${sale.invoiceNumber}.csv`);
  };
  // Export the currently filtered sales list as a CSV report.
  const exportSales = () => {
    void logSalesReportExport();
    const rows = [["Invoice", "Customer", "Sale Date", "Items", "Total", "Payment Method", "Payment Status"], ...(sales.data?.items || []).map((sale) => [sale.invoiceNumber, sale.customerName, sale.saleDate, sale.items.reduce((sum, item) => sum + item.quantity, 0), sale.totalAmount, display(sale.paymentMethod), display(sale.paymentStatus || "PAID")])];
    download(new Blob([rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n")], { type: "text/csv;charset=utf-8" }), "sales-report.csv");
  };

  // Paginate the filtered list on the client.
  const pageSize = 10;
  const list = sales.data?.items || [];
  const pageCount = Math.max(1, Math.ceil(list.length / pageSize));
  const visible = list.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => setPage(1), [search, categoryId, channel, payment, paymentStatus, startDate, endDate, sort]);

  // Render the shared heading and the three Sales components.
  return <Box className="sales-page">
    <PageHeader title="Sales Management" subtitle="Create sales, update inventory and generate professional invoices." icon={<PointOfSaleOutlinedIcon />} actions={canEdit ? <Button startIcon={<AddIcon />} onClick={() => begin()}>Create Sale</Button> : undefined} />
    <Tabs className="sales-tabs" value={tab} onChange={(_, value) => setTab(value)}>
      <Tab label="Sales List" /><Tab label={editing ? "Edit Sale" : "Create Sale"} disabled={!canEdit} /><Tab label="Sales Details" disabled={!view} />
    </Tabs>

    {/* Component 1: dashboard, filters, sales list, and report export. */}
    {tab === 0 && <Box className="sales-component">
      <Box className="sales-summary">{[["Total Sales", summary.data?.totalSales || 0, "blue"], ["Total Revenue", currency(Number(summary.data?.totalRevenue || 0)), "green"], ["Total Orders", summary.data?.totalOrders || 0, "purple"], ["Average Order Value", currency(Number(summary.data?.averageOrderValue || 0)), "orange"]].map(([label, value, color]) => <Box className="sales-stat" key={String(label)}><i className={String(color)} /><div><small>{label}</small><strong>{value}</strong></div></Box>)}</Box>
      <Box className="sales-panel">
        <Box className="sales-filters">
          <TextField size="small" placeholder="Search invoice or customer" value={search} onChange={(e) => setSearch(e.target.value)} />
          <TextField size="small" type="date" label="From" value={startDate} onChange={(e) => setStartDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField size="small" type="date" label="To" value={endDate} onChange={(e) => setEndDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField select size="small" label="Payment Method" value={payment} onChange={(e) => setPayment(e.target.value)}><MenuItem value="">All Methods</MenuItem>{["CASH", "CARD", "UPI", "BANK_TRANSFER"].map((value) => <MenuItem key={value} value={value}>{display(value)}</MenuItem>)}</TextField>
          <TextField select size="small" label="Payment Status" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}><MenuItem value="">All Statuses</MenuItem>{["PAID", "PENDING", "FAILED"].map((value) => <MenuItem key={value} value={value}>{display(value)}</MenuItem>)}</TextField>
          <TextField select size="small" label="Category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}><MenuItem value="">All Categories</MenuItem>{categories.data?.items.map((category) => <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>)}</TextField>
          <TextField select size="small" label="Channel" value={channel} onChange={(e) => setChannel(e.target.value)}><MenuItem value="">All Channels</MenuItem>{["RETAIL_STORE", "ONLINE_STORE", "MARKETPLACE"].map((value) => <MenuItem key={value} value={value}>{display(value)}</MenuItem>)}</TextField>
          <TextField select size="small" label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}><MenuItem value="date">Date (Newest)</MenuItem><MenuItem value="total">Total Amount</MenuItem><MenuItem value="customer">Customer Name</MenuItem><MenuItem value="invoice">Invoice Number</MenuItem></TextField>
          <Button variant="outlined" startIcon={<DownloadIcon />} disabled={!list.length} onClick={exportSales}>Export Sales CSV</Button>
        </Box>
        {sales.isLoading ? <Box className="sales-loading">{Array.from({ length: 7 }).map((_, index) => <Skeleton key={index} height={44} />)}</Box> : sales.isError ? <Alert severity="error">Unable to load sales. Verify the backend migration and restart the API.</Alert> : <Box className="sales-table"><table><thead><tr><th>Invoice Number</th><th>Customer Name</th><th>Sale Date</th><th>Items</th><th>Total Amount</th><th>Payment Method</th><th>Payment Status</th><th>Actions</th></tr></thead><tbody>{visible.map((sale) => <tr key={sale.id}><td><strong>{sale.invoiceNumber}</strong></td><td>{sale.customerName}</td><td>{new Date(sale.saleDate).toLocaleString("en-IN")}</td><td>{sale.items.reduce((sum, item) => sum + item.quantity, 0)}</td><td><strong>{currency(Number(sale.totalAmount))}</strong></td><td>{display(sale.paymentMethod)}</td><td><span className={`sales-status sales-status--${(sale.paymentStatus || "PAID").toLowerCase()}`}>{display(sale.paymentStatus || "PAID")}</span></td><td><IconButton title="View" onClick={() => openDetails(sale)}><VisibilityIcon /></IconButton>{canEdit && <><IconButton title="Edit" onClick={() => begin(sale)}><EditIcon /></IconButton><IconButton title="Delete" color="error" onClick={() => confirm(`Delete ${sale.invoiceNumber}? Stock will be restored.`) && remove.mutate(sale.id)}><DeleteIcon /></IconButton></>}</td></tr>)}</tbody></table>{!list.length && <Box className="sales-empty"><Typography component="h3">No sales found</Typography><Typography>Adjust the filters or create your first sale.</Typography><Button variant="outlined" onClick={() => { setSearch(""); setStartDate(""); setEndDate(""); setPayment(""); setPaymentStatus(""); setCategoryId(""); setChannel(""); }}>Clear Filters</Button></Box>}{pageCount > 1 && <Box className="sales-pagination"><Pagination count={pageCount} page={page} onChange={(_, value) => setPage(value)} color="primary" /></Box>}</Box>}
      </Box>
    </Box>}

    {/* Component 2: customer/product form and live billing summary. */}
    {tab === 1 && <Box className="sales-component sales-create">
      <Box className="sales-form-card"><Typography component="h2">{editing ? `Edit ${editing.invoiceNumber}` : "Create Sale"}</Typography>{error && <Alert severity="error">{error}</Alert>}
        <Box className="sales-form-grid">
          <TextField select required label="Customer" value={form.customerId} onChange={(e) => { const customer = customers.data?.items.find((item) => item.id === e.target.value); setForm((current) => ({ ...current, customerId: e.target.value, customerName: customer?.fullName || "" })); }}><MenuItem value="">Select customer</MenuItem>{customers.data?.items.map((customer) => <MenuItem key={customer.id} value={customer.id}>{customer.fullName} ({customer.segment})</MenuItem>)}</TextField>
          <TextField required type="datetime-local" label="Sale Date" value={form.saleDate} onChange={(e) => setForm((current) => ({ ...current, saleDate: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField select required label="Payment Method" value={form.paymentMethod} onChange={(e) => setForm((current) => ({ ...current, paymentMethod: e.target.value as SaleInput["paymentMethod"] }))}>{["CASH", "CARD", "UPI", "BANK_TRANSFER"].map((value) => <MenuItem key={value} value={value}>{display(value)}</MenuItem>)}</TextField>
          <TextField select required label="Payment Status" value={form.paymentStatus} onChange={(e) => setForm((current) => ({ ...current, paymentStatus: e.target.value as SaleInput["paymentStatus"] }))}>{["PAID", "PENDING", "FAILED"].map((value) => <MenuItem key={value} value={value}>{display(value)}</MenuItem>)}</TextField>
          <TextField select required label="Sales Channel" value={form.salesChannel} onChange={(e) => setForm((current) => ({ ...current, salesChannel: e.target.value as SaleInput["salesChannel"] }))}>{["RETAIL_STORE", "ONLINE_STORE", "MARKETPLACE"].map((value) => <MenuItem key={value} value={value}>{display(value)}</MenuItem>)}</TextField>
          <TextField className="sales-notes" label="Notes" multiline minRows={3} value={form.notes || ""} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} />
        </Box>
        <Box className="sales-items-title"><Typography component="h3">Products</Typography><Button variant="outlined" size="small" onClick={addItem}>Add Product</Button></Box>
        {!form.items.length && <Alert severity="info">Add at least one product to continue.</Alert>}
        {form.items.map((item, index) => { const product = selected(item.productId); const validation = itemError(item); return <Box className="sales-item" key={`${item.productId}-${index}`}><Box className="sales-item__head"><Typography component="strong">Product {index + 1}</Typography><IconButton color="error" onClick={() => setForm((current) => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }))}><CloseIcon /></IconButton></Box><TextField select required label="Product" value={item.productId} onChange={(e) => updateItem(index, "productId", e.target.value)}>{products.data?.items.map((option) => <MenuItem key={option.id} value={option.id} disabled={form.items.some((existing, existingIndex) => existingIndex !== index && existing.productId === option.id)}>{option.name} ({option.stockQuantity} available)</MenuItem>)}</TextField><Box className="sales-product-info"><span><small>SKU</small><strong>{product?.sku || "—"}</strong></span><span><small>Category</small><strong>{product?.categoryName || "—"}</strong></span><span><small>Unit Price</small><strong>{currency(Number(product?.unitPrice || 0))}</strong></span><span><small>Available Stock</small><strong>{product?.stockQuantity ?? 0}</strong></span></Box><Box className="sales-item__numbers"><TextField type="number" label="Quantity" value={item.quantity} onChange={(e) => updateItem(index, "quantity", e.target.value)} inputProps={{ min: 1, max: product?.stockQuantity }} /><TextField type="number" label="Unit Price" value={item.unitPrice} disabled /><TextField type="number" label="Discount" value={item.discount} onChange={(e) => updateItem(index, "discount", e.target.value)} inputProps={{ min: 0 }} /><TextField type="number" label="Tax" value={item.tax} onChange={(e) => updateItem(index, "tax", e.target.value)} inputProps={{ min: 0 }} /></Box>{validation && <Alert severity="error">{validation}</Alert>}<strong>Line Total: {currency(item.quantity * item.unitPrice - item.discount + item.tax)}</strong></Box>; })}
      </Box>
      <Box className="sales-billing"><Typography component="h2">Billing Summary</Typography><span>Subtotal ({form.items.length} items)<strong>{currency(subtotal)}</strong></span><span>Discount<strong>- {currency(discountTotal)}</strong></span><span>Tax<strong>+ {currency(taxTotal)}</strong></span><h3>Grand Total<strong>{currency(total)}</strong></h3><Alert severity="success">Updates automatically when product, quantity, discount or tax changes.</Alert><Box className="sales-drawer__actions"><Button variant="outlined" onClick={() => { setEditing(null); setForm(empty()); setTab(0); }}>Cancel</Button><Button loading={save.isPending} disabled={formInvalid || save.isPending} onClick={() => save.mutate()}>Save Sale</Button></Box></Box>
    </Box>}

    {/* Component 3: invoice details, preview, PDF, and CSV actions. */}
    {tab === 2 && view && <Box className="sales-component sales-detail-page">
      <Box className="sales-detail-actions"><Button variant="outlined" onClick={() => window.print()}>Print Invoice</Button><Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => exportPdf(view)}>Export PDF</Button><Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => exportCsv(view)}>Export CSV</Button></Box>
      <Box className="sales-detail-grid"><Box className="sales-info-card"><Typography component="h3">Invoice Information</Typography><span>Invoice Number<strong>{view.invoiceNumber}</strong></span><span>Sale Date<strong>{new Date(view.saleDate).toLocaleString("en-IN")}</strong></span><span>Customer<strong>{view.customerName}</strong></span><span>Payment Method<strong>{display(view.paymentMethod)}</strong></span><span>Payment Status<strong>{display(view.paymentStatus || "PAID")}</strong></span><span>Salesperson<strong>{view.createdByName}</strong></span></Box><Box className="sales-products-card"><Typography component="h3">Purchased Products</Typography><table><thead><tr><th>Product</th><th>SKU</th><th>Quantity</th><th>Unit Price</th><th>Discount</th><th>Tax</th><th>Line Total</th></tr></thead><tbody>{view.items.map((item) => <tr key={item.id}><td>{item.productName}</td><td>{selected(item.productId)?.sku || "—"}</td><td>{item.quantity}</td><td>{currency(Number(item.unitPrice))}</td><td>{currency(Number(item.discount))}</td><td>{currency(Number(item.tax))}</td><td><strong>{currency(Number(item.total))}</strong></td></tr>)}</tbody></table></Box><Box className="sales-pricing-card"><Typography component="h3">Pricing Summary</Typography><span>Subtotal<strong>{currency(view.items.reduce((sum, item) => sum + item.quantity * Number(item.unitPrice), 0))}</strong></span><span>Discount<strong>- {currency(view.items.reduce((sum, item) => sum + Number(item.discount), 0))}</strong></span><span>Tax<strong>+ {currency(view.items.reduce((sum, item) => sum + Number(item.tax), 0))}</strong></span><h3>Grand Total<strong>{currency(Number(view.totalAmount))}</strong></h3></Box></Box>
      <Box className="sales-invoice"><Box className="sales-invoice__header"><Box><Typography component="h2">RetailPulse</Typography><small>Analytics</small></Box><Box><Typography component="strong">INVOICE</Typography><span className={`sales-status sales-status--${(view.paymentStatus || "PAID").toLowerCase()}`}>{display(view.paymentStatus || "PAID")}</span></Box></Box><Box className="sales-invoice__meta"><div><small>Bill To</small><strong>{view.customerName}</strong>{view.notes && <span>{view.notes}</span>}</div><div><span>Invoice Number <strong>{view.invoiceNumber}</strong></span><span>Invoice Date <strong>{new Date(view.saleDate).toLocaleDateString("en-IN")}</strong></span><span>Payment Method <strong>{display(view.paymentMethod)}</strong></span></div></Box><table><thead><tr><th>#</th><th>Product</th><th>SKU</th><th>Qty</th><th>Unit Price</th><th>Line Total</th></tr></thead><tbody>{view.items.map((item, index) => <tr key={item.id}><td>{index + 1}</td><td>{item.productName}</td><td>{selected(item.productId)?.sku || "—"}</td><td>{item.quantity}</td><td>{currency(Number(item.unitPrice))}</td><td>{currency(Number(item.total))}</td></tr>)}</tbody></table><Box className="sales-invoice__total"><strong>Grand Total</strong><strong>{currency(Number(view.totalAmount))}</strong></Box></Box>
    </Box>}
  </Box>;
};

export default SalesPage;
