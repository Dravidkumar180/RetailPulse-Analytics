/* Manages sales queries, form values, stock validation, totals, and save/delete actions. */
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCategories, getProducts } from "../../api/catalogApi";
import { getCustomers } from "../../api/customerApi";
import {
  createSale,
  deleteSale,
  getSales,
  getSalesSummary,
  updateSale,
  type Sale,
  type SaleInput,
  type SaleItemInput,
} from "../../api/salesApi";
import { useAuth } from "../../hooks/useAuth";
import { emptySale, saleToInput } from "./salesUtils";
import { PAGE_SIZE, EMPTY_FILTERS } from "./salesConstants";
import type { SalesFiltersState } from "./SalesListPanel";
import { createSalesExportHandlers } from "./salesExports";

export function useSalesPage() {
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
  // Validate each line against available stock, positive values, and discount limits.
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
  // Keep saving disabled until a customer and valid product lines are present.
  const formInvalid =
    !form.customerId ||
    !form.items.length ||
    form.items.some((item) => Boolean(itemError(item)));
  // Reload cached sales and inventory data after a sale changes.
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
      onError: (
        reason: Error & { response?: { data?: { detail?: string } } },
      ) =>
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
  // Prepare a blank form or copy an existing invoice into the edit form.
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
  // Choose an in-stock product that is not already on the invoice.
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
  // Change one line; selecting another product also updates its unit price.
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
  // Show only the current page from the filtered sales returned by the server.
  const list = salesQuery.data?.items ?? [],
    pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE)),
    visible = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  // Restart pagination when a filter changes.
  const changeFilter = (key: keyof SalesFiltersState, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };
  // Restore the default filters and first page.
  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };
  // Discard the form values and return to the sales list.
  const cancelEdit = () => {
    setEditing(null);
    setForm(emptySale());
    setTab(0);
  };
  // Require confirmation before requesting deletion of an invoice.
  const confirmDelete = (sale: Sale) => {
    if (
      window.confirm(`Delete ${sale.invoiceNumber}? Stock will be restored.`)
    ) {
      deleteMutation.mutate(sale.id);
    }
  };
  const exports = createSalesExportHandlers(products, list);
  return {
    canEdit,
    tab,
    setTab,
    filters,
    page,
    setPage,
    view,
    editing,
    form,
    setForm,
    error,
    categoriesQuery,
    customersQuery,
    salesQuery,
    summaryQuery,
    products,
    subtotal,
    discount,
    tax,
    total,
    itemError,
    formInvalid,
    saveMutation,
    begin,
    openDetails,
    addItem,
    updateItem,
    pageCount,
    visible,
    changeFilter,
    clearFilters,
    cancelEdit,
    confirmDelete,
    ...exports,
  };
}

export type SalesPageState = ReturnType<typeof useSalesPage>;
