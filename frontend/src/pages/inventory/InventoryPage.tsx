/* Teaching guide: This file contains inventory page page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Box, Button, Typography } from "@mui/material";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import { NavLink } from "react-router-dom";
import {
  adjustInventory,
  getInventory,
  getInventoryMovements,
  type AdjustmentType,
  type InventoryItem,
  type StockAdjustmentInput,
} from "../../api/inventoryApi";
import { useAuth } from "../../hooks/useAuth";
import InventoryAnalytics from "./InventoryAnalytics";
import InventoryDialogs from "./InventoryDialogs";
import InventoryOverviewPanel, {
  type InventoryFilters,
} from "./InventoryOverviewPanel";
import InventorySummaryCards from "./InventorySummaryCards";
import MovementTable from "./MovementTable";
import { STATUS_LABEL } from "./inventoryConstants";
import "./InventoryPage.css";
import "./InventoryToolbar.css";

const PAGE_SIZE = 5;
const EMPTY_FILTERS: InventoryFilters = {
  search: "",
  category: "",
  brand: "",
  stockStatus: "",
  sort: "product",
};

/** Coordinates inventory queries, filters and stock adjustments. */
// This component receives prepared data and renders the feature-specific interface.
const InventoryPage = () => {
  const { user } = useAuth(),
    admin = user?.role !== "VIEWER",
    queryClient = useQueryClient();
  // Store filters, the active tab, selected inventory, and dialog state.
  const [filters, setFilters] = useState(EMPTY_FILTERS),
    [page, setPage] = useState(1),
    [filtersOpen, setFiltersOpen] = useState(false),
    [historyOpen, setHistoryOpen] = useState(false),
    [dialogType, setDialogType] = useState<AdjustmentType | null>(null),
    [productId, setProductId] = useState(""),
    [quantity, setQuantity] = useState(""),
    [reason, setReason] = useState(""),
    [remarks, setRemarks] = useState(""),
    [reorderLevel, setReorderLevel] = useState("");
  // Inventory and movement history are fetched independently for faster updates.
  const inventoryQuery = useQuery({
      queryKey: ["inventory", filters],
      queryFn: () =>
        getInventory({
          search: filters.search || undefined,
          categoryId: filters.category || undefined,
          brand: filters.brand || undefined,
          stockStatus: filters.stockStatus || undefined,
          sort: filters.sort,
        }),
    }),
    movementsQuery = useQuery({
      queryKey: ["inventory-movements", "recent"],
      queryFn: () => getInventoryMovements(),
      refetchInterval: 5000,
      refetchOnWindowFocus: true,
    });
  const clearAdjustment = () => {
    setDialogType(null);
    setProductId("");
    setQuantity("");
    setReason("");
    setRemarks("");
    setReorderLevel("");
  };
  // Submit a stock adjustment and refresh inventory-dependent screens.
  const adjustment = useMutation({
    mutationFn: (data: StockAdjustmentInput) => adjustInventory(data),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["inventory"] }),
        queryClient.invalidateQueries({ queryKey: ["inventory-movements"] }),
        queryClient.invalidateQueries({
          queryKey: ["inventory-notifications"],
        }),
      ]);
      clearAdjustment();
    },
  });
  const items = inventoryQuery.data?.items ?? [],
    pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE)),
    visibleItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    selected = useMemo(
      () => items.find((item) => item.productId === productId),
      [items, productId],
    );
  useEffect(() => setPage(1), [filters]);
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);
  const openAdjustment = (type: AdjustmentType, item?: InventoryItem) => {
    setDialogType(type);
    setProductId(item?.productId ?? "");
    setReorderLevel(item ? String(item.reorderLevel) : "");
  };
  const selectProduct = (id: string) => {
    setProductId(id);
    const item = items.find((row) => row.productId === id);
    setReorderLevel(item ? String(item.reorderLevel) : "");
  };
  const submit = () => {
    if (!dialogType || !productId || !quantity || !reason) return;
    adjustment.mutate({
      productId,
      adjustmentType: dialogType,
      quantity: Number(quantity),
      reason,
      remarks: remarks || undefined,
      reorderLevel: reorderLevel === "" ? undefined : Number(reorderLevel),
    });
  };
  const exportInventory = () => {
    const headers = [
        "Product Name",
        "SKU",
        "Category",
        "Brand",
        "Current Stock",
        "Reserved Stock",
        "Available Stock",
        "Reorder Level",
        "Stock Status",
      ],
      escape = (value: string | number) =>
        `"${String(value).replaceAll('"', '""')}"`,
      rows = items.map((item) =>
        [
          item.productName,
          item.sku,
          item.categoryName,
          item.brand || "",
          item.currentStock,
          item.reservedStock,
          item.availableStock,
          item.reorderLevel,
          STATUS_LABEL[item.stockStatus],
        ]
          .map(escape)
          .join(","),
      ),
      blob = new Blob([[headers.map(escape).join(","), ...rows].join("\r\n")], {
        type: "text/csv;charset=utf-8",
      }),
      url = URL.createObjectURL(blob),
      link = document.createElement("a");
    link.href = url;
    link.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const adjustmentError = (
    adjustment.error as { response?: { data?: { detail?: string } } } | null
  )?.response?.data?.detail;
  return (
    <Box className="inventory-page">
      <Box className="inventory-heading">
        <Box>
          <Typography component="h1">Inventory Management</Typography>
          <Typography component="p">
            Monitor stock levels, movements and availability across your
            company.
          </Typography>
        </Box>
        {admin && (
          <Button
            variant="contained"
            startIcon={<TuneOutlinedIcon />}
            onClick={() => openAdjustment("MANUAL_ADJUSTMENT")}
          >
            Adjust Stock
          </Button>
        )}
      </Box>
      <nav className="inventory-module-tabs">
        <NavLink to="/inventory" className="active">
          Inventory Overview
        </NavLink>
        {admin && (
          <NavLink to="/inventory/forecast">
            Forecast &amp; Replenishment
          </NavLink>
        )}
      </nav>
      {inventoryQuery.isError && (
        <Alert severity="error">
          Unable to load inventory. Please try again.
        </Alert>
      )}
      <InventorySummaryCards summary={inventoryQuery.data?.summary} />
      <InventoryOverviewPanel
        data={inventoryQuery.data}
        items={visibleItems}
        filters={filters}
        filtersOpen={filtersOpen}
        loading={inventoryQuery.isLoading}
        page={page}
        pageCount={pageCount}
        onFilter={(key, value) =>
          setFilters((current) => ({ ...current, [key]: value }))
        }
        onToggleFilters={() => setFiltersOpen((open) => !open)}
        onClear={() => setFilters(EMPTY_FILTERS)}
        onExport={exportInventory}
        onPage={setPage}
      />
      <InventoryAnalytics
        summary={inventoryQuery.data?.summary}
        admin={admin}
        onAdjust={openAdjustment}
        onHistory={() => setHistoryOpen(true)}
      />
      <Box className="inventory-panel">
        <Box className="inventory-panel__title">
          <Typography component="h2">Recent Stock Movements</Typography>
          <Button onClick={() => setHistoryOpen(true)}>View All</Button>
        </Box>
        <MovementTable rows={(movementsQuery.data ?? []).slice(0, 5)} />
      </Box>
      <InventoryDialogs
        dialogType={dialogType}
        historyOpen={historyOpen}
        items={items}
        selected={selected}
        productId={productId}
        quantity={quantity}
        reason={reason}
        remarks={remarks}
        reorderLevel={reorderLevel}
        saving={adjustment.isPending}
        error={
          adjustment.isError
            ? adjustmentError || "Unable to save adjustment."
            : undefined
        }
        movements={movementsQuery.data ?? []}
        onCloseAdjustment={clearAdjustment}
        onCloseHistory={() => setHistoryOpen(false)}
        onProduct={selectProduct}
        onQuantity={setQuantity}
        onReason={setReason}
        onRemarks={setRemarks}
        onReorderLevel={setReorderLevel}
        onSubmit={submit}
      />
    </Box>
  );
};
export default InventoryPage;
