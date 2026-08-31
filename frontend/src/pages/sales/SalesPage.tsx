/* Teaching guide: This file contains sales page page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Tab, Tabs } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AnalyticsOutlinedIcon from "@mui/icons-material/AnalyticsOutlined";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
import { getCategories, getProducts } from "../../api/catalogApi";
import { getCustomers } from "../../api/customerApi";
import {
  createSale,
  deleteSale,
  getSales,
  getSalesSummary,
  logSaleExport,
  logSalesReportExport,
  updateSale,
  type Sale,
  type SaleInput,
  type SaleItemInput,
} from "../../api/salesApi";
import Button from "../../components/common/Button/Button";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import { useAuth } from "../../hooks/useAuth";
import { createPdfReport } from "../../utils/createPdfReport";
import AnalyticsPage from "../analytics/AnalyticsPage";
import SaleDetailsPanel from "./SaleDetailsPanel";
import SaleFormPanel from "./SaleFormPanel";
import SalesListPanel, { type SalesFiltersState } from "./SalesListPanel";
import {
  displayLabel,
  downloadBlob,
  emptySale,
  invoiceLines,
  saleToInput,
} from "./salesUtils";
import "./SalesPage.css";

const PAGE_SIZE = 10;
const EMPTY_FILTERS: SalesFiltersState = {
  search: "",
  categoryId: "",
  channel: "",
  payment: "",
  paymentStatus: "",
  startDate: "",
  endDate: "",
  sort: "date",
};

/** Coordinates sales data and delegates each tab to its own component. */
// This component receives prepared data and renders the feature-specific interface.
const SalesPage = () => {
  const queryClient = useQueryClient(),
    { user } = useAuth(),
    canEdit = user?.role !== "VIEWER";
  // Store the active sales view, form values, selection, and pagination.
  const [tab, setTab] = useState(0),
    [filters, setFilters] = useState(EMPTY_FILTERS),
    [page, setPage] = useState(1),
    [view, setView] = useState<Sale | null>(null),
    [editing, setEditing] = useState<Sale | null>(null),
    [form, setForm] = useState<SaleInput>(emptySale()),
    [error, setError] = useState("");
  // Load the reference data required to create and display sales.
  const productsQuery = useQuery({
      queryKey: ["products", "sales"],
      queryFn: () => getProducts({ status: "ACTIVE", sort: "name" }),
    }),
    categoriesQuery = useQuery({
      queryKey: ["categories"],
      queryFn: () => getCategories(),
    }),
    customersQuery = useQuery({
      queryKey: ["customers", "sales"],
      queryFn: () => getCustomers({ status: "ACTIVE" }),
    });
  const salesQuery = useQuery({
      queryKey: ["sales", filters],
      queryFn: () =>
        getSales({
          search: filters.search || undefined,
          categoryId: filters.categoryId || undefined,
          salesChannel: filters.channel || undefined,
          paymentMethod: filters.payment || undefined,
          paymentStatus: filters.paymentStatus || undefined,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
          sort: filters.sort,
        }),
    }),
    summaryQuery = useQuery({
      queryKey: ["sales-summary"],
      queryFn: getSalesSummary,
    });
  const products = productsQuery.data?.items ?? [],
    selected = (id: string) => products.find((product) => product.id === id);
  // Recalculate invoice totals only when the selected sale items change.
  const subtotal = useMemo(
      () =>
        form.items.reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          0,
        ),
      [form.items],
    ),
    discount = useMemo(
      () => form.items.reduce((sum, item) => sum + item.discount, 0),
      [form.items],
    ),
    tax = useMemo(
      () => form.items.reduce((sum, item) => sum + item.tax, 0),
      [form.items],
    ),
    total = subtotal - discount + tax;
  const itemError = (item: SaleItemInput) => {
    const stock = selected(item.productId)?.stockQuantity ?? 0;
    if (item.quantity <= 0) return "Quantity must be greater than zero.";
    if (item.quantity > stock)
      return `Only ${stock} items are available in stock.`;
    if (item.unitPrice <= 0) return "Unit price must be positive.";
    if (item.discount > item.quantity * item.unitPrice)
      return "Discount cannot exceed the item value.";
    return "";
  };
  const formInvalid =
    !form.customerId ||
    !form.items.length ||
    form.items.some((item) => Boolean(itemError(item)));
  const refresh = () => {
    [
      "sales",
      "sales-summary",
      "sales-analytics",
      "products",
      "inventory-notifications",
    ].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
  };
  // Create or update a sale and refresh all affected inventory summaries.
  const saveMutation = useMutation({
      mutationFn: () =>
        editing ? updateSale(editing.id, form) : createSale(form),
      onSuccess: (sale) => {
        refresh();
        setView(sale);
        setEditing(null);
        setForm(emptySale());
        setTab(2);
      },
      onError: (reason: any) =>
        setError(
          reason.response?.data?.detail ||
            reason.message ||
            "Failed to save sale.",
        ),
    }),
    deleteMutation = useMutation({
      mutationFn: deleteSale,
      onSuccess: refresh,
    });
  const begin = (sale?: Sale) => {
      setError("");
      setEditing(sale ?? null);
      setForm(sale ? saleToInput(sale) : emptySale());
      setTab(1);
    },
    openDetails = (sale: Sale) => {
      setView(sale);
      setTab(2);
    };
  const addItem = () => {
    const product = products.find(
      (candidate) =>
        candidate.stockQuantity > 0 &&
        !form.items.some((item) => item.productId === candidate.id),
    );
    if (!product)
      return setError(
        "No additional active product with available stock can be added.",
      );
    setForm((current) => ({
      ...current,
      items: [
        ...current.items,
        {
          productId: product.id,
          quantity: 1,
          unitPrice: Number(product.unitPrice),
          discount: 0,
          tax: 0,
        },
      ],
    }));
  };
  const updateItem = (index: number, key: keyof SaleItemInput, value: string) =>
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [key]: key === "productId" ? value : Number(value),
              ...(key === "productId"
                ? { unitPrice: Number(selected(value)?.unitPrice || 0) }
                : {}),
            }
          : item,
      ),
    }));
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
      ...(salesQuery.data?.items ?? []).map((sale) => [
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
  const list = salesQuery.data?.items ?? [],
    pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE)),
    visible = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => setPage(1), [filters]);
  return (
    <Box className="sales-page">
      <PageHeader
        title="Sales Management"
        subtitle="Record and manage multi-item invoices."
        icon={<PointOfSaleOutlinedIcon />}
        actions={
          <>
            {canEdit && (
              <Button
                variant="outlined"
                startIcon={<AnalyticsOutlinedIcon />}
                onClick={() => setTab(3)}
              >
                View Sales Analytics
              </Button>
            )}
            {canEdit && (
              <Button startIcon={<AddIcon />} onClick={() => begin()}>
                Create Sale
              </Button>
            )}
          </>
        }
      />
      <Tabs
        className="sales-tabs"
        value={tab}
        onChange={(_, value) => setTab(value)}
      >
        <Tab label="Sales List" />
        <Tab
          label={editing ? "Edit Sale" : "Create Sale"}
          disabled={!canEdit}
        />
        <Tab label="Sales Details" disabled={!view} />
        <Tab label="Sales Analytics" disabled={!canEdit} />
      </Tabs>
      {tab === 0 && (
        <SalesListPanel
          summary={summaryQuery.data}
          filters={filters}
          categories={categoriesQuery.data?.items ?? []}
          sales={visible}
          loading={salesQuery.isLoading}
          failed={salesQuery.isError}
          canEdit={canEdit}
          page={page}
          pageCount={pageCount}
          onFilter={(key, value) =>
            setFilters((current) => ({ ...current, [key]: value }))
          }
          onClear={() => setFilters(EMPTY_FILTERS)}
          onPage={setPage}
          onView={openDetails}
          onEdit={begin}
          onDelete={(sale) =>
            window.confirm(
              `Delete ${sale.invoiceNumber}? Stock will be restored.`,
            ) && deleteMutation.mutate(sale.id)
          }
          onExport={exportSales}
        />
      )}{" "}
      {tab === 1 && (
        <SaleFormPanel
          editing={editing}
          form={form}
          products={products}
          customers={customersQuery.data?.items ?? []}
          error={error}
          saving={saveMutation.isPending}
          invalid={formInvalid}
          subtotal={subtotal}
          discount={discount}
          tax={tax}
          total={total}
          onForm={setForm}
          onAddItem={addItem}
          onUpdateItem={updateItem}
          itemError={itemError}
          onCancel={() => {
            setEditing(null);
            setForm(emptySale());
            setTab(0);
          }}
          onSave={() => saveMutation.mutate()}
        />
      )}{" "}
      {tab === 2 && view && (
        <SaleDetailsPanel
          sale={view}
          products={products}
          onPdf={() => exportPdf(view)}
          onCsv={() => exportCsv(view)}
        />
      )}
      {tab === 3 && canEdit && <AnalyticsPage />}
    </Box>
  );
};
export default SalesPage;
