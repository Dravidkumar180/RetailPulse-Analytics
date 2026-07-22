/* =========================================================
 * Inventory Management page
 * ========================================================= */

// React state controls filters, dialogs and adjustment form values.
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Pagination,
  TextField,
  Typography,
} from "@mui/material";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlined";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import {
  adjustInventory,
  getInventory,
  getInventoryMovements,
  type AdjustmentType,
  type InventoryItem,
  type StockAdjustmentInput,
} from "../../api/inventoryApi";
import { useAuth } from "../../hooks/useAuth";
import "./InventoryPage.css";
import "./InventoryToolbar.css";

/* =========================================================
 * Display labels and adjustment reasons
 * ========================================================= */

// Convert API status codes into user-friendly text.
const statusLabel: Record<string, string> = {
  IN_STOCK: "In Stock",
  LOW_STOCK: "Low Stock",
  OUT_OF_STOCK: "Out of Stock",
};
// Convert movement codes into table and dialog labels.
const movementLabel: Record<string, string> = {
  SALE: "Sale",
  MANUAL_ADJUSTMENT: "Manual Adjustment",
  STOCK_ADDITION: "Stock Addition",
  STOCK_REMOVAL: "Stock Removal",
};
// Admins must select a reason before an adjustment can be submitted.
const reasons = [
  "New stock received",
  "Damaged items removed",
  "Inventory count correction",
  "Customer return",
  "Expired stock",
  "Transfer between locations",
  "Other",
];

/* =========================================================
 * Inventory page state and permissions
 * ========================================================= */

const InventoryPage = () => {
  // Analysts can view inventory, while only Admins can change quantities.
  const { user } = useAuth();
  const admin = user?.role === "COMPANY_ADMIN" || user?.role === "SUPER_ADMIN";
  const queryClient = useQueryClient();
  // Overview search, filter, sorting and toolbar state.
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [stockStatus, setStockStatus] = useState("");
  const [sort, setSort] = useState("product");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Movement history and stock adjustment dialog state.
  const [historyOpen, setHistoryOpen] = useState(false);
  const [dialogType, setDialogType] = useState<AdjustmentType | null>(null);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [reorderLevel, setReorderLevel] = useState("");
  /* =======================================================
   * Server queries and mutations
   * ======================================================= */

  // Reload inventory whenever any search, filter or sort value changes.
  const inventoryQuery = useQuery({
    queryKey: ["inventory", search, category, brand, stockStatus, sort],
    queryFn: () =>
      getInventory({
        search: search || undefined,
        categoryId: category || undefined,
        brand: brand || undefined,
        stockStatus: stockStatus || undefined,
        sort,
      }),
  });
  // Refresh movements regularly so recent stock changes appear automatically.
  const movementsQuery = useQuery({
    queryKey: ["inventory-movements", "recent"],
    queryFn: () => getInventoryMovements(),
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });
  // Submit adjustments and refresh all affected inventory information.
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
      setDialogType(null);
      setProductId("");
      setQuantity("");
      setReason("");
      setRemarks("");
      setReorderLevel("");
    },
  });
  /* =======================================================
   * Derived inventory values
   * ======================================================= */

  // Always provide an empty array while the first request is loading.
  const items = inventoryQuery.data?.items ?? [];
  const pageSize = 5;
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const visibleItems = items.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => setPage(1), [search, category, brand, stockStatus, sort]);
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);
  const summary = inventoryQuery.data?.summary;
  const stockCounts = Object.fromEntries(
    (summary?.stockStatusDistribution ?? []).map((item) => [
      item.name,
      item.value,
    ]),
  );
  const inStock = stockCounts.IN_STOCK ?? 0;
  const lowStock = stockCounts.LOW_STOCK ?? 0;
  const outOfStock = stockCounts.OUT_OF_STOCK ?? 0;
  const stockTotal = inStock + lowStock + outOfStock;
  const inStockEnd = stockTotal ? (inStock / stockTotal) * 100 : 0;
  const lowStockEnd = stockTotal
    ? ((inStock + lowStock) / stockTotal) * 100
    : 0;
  const stockChartBackground = stockTotal
    ? `conic-gradient(#10b981 0 ${inStockEnd}%, #f59e0b ${inStockEnd}% ${lowStockEnd}%, #ef4444 ${lowStockEnd}% 100%)`
    : "conic-gradient(#e2e8f0 0 100%)";
  const maxCategory = Math.max(
    ...(summary?.inventoryByCategory.map((x) => x.value) ?? [1]),
    1,
  );
  /* =======================================================
   * Stock adjustment actions
   * ======================================================= */

  // Open the requested adjustment dialog and preselect a product when supplied.
  const openAdjustment = (type: AdjustmentType, item?: InventoryItem) => {
    setDialogType(type);
    setProductId(item?.productId ?? "");
    setReorderLevel(item ? String(item.reorderLevel) : "");
  };
  // Send the completed adjustment form to the backend.
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
  // Find the selected row to display current, reserved and available quantities.
  const selected = useMemo(
    () => items.find((x) => x.productId === productId),
    [items, productId],
  );
  /* =======================================================
   * CSV export
   * ======================================================= */

  // Export exactly the currently filtered inventory rows as a CSV download.
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
    ];
    const escapeCsv = (value: string | number) =>
      `"${String(value).replaceAll('"', '""')}"`;
    const rows = items.map((item) =>
      [
        item.productName,
        item.sku,
        item.categoryName,
        item.brand || "",
        item.currentStock,
        item.reservedStock,
        item.availableStock,
        item.reorderLevel,
        statusLabel[item.stockStatus],
      ]
        .map(escapeCsv)
        .join(","),
    );
    const blob = new Blob(
      [[headers.map(escapeCsv).join(","), ...rows].join("\r\n")],
      { type: "text/csv;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  /* =======================================================
   * Inventory page interface
   * ======================================================= */

  return (
    <Box className="inventory-page">
      {/* Page heading and the Admin-only manual adjustment shortcut. */}
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
      {/* Show a clear error when the inventory overview request fails. */}
      {inventoryQuery.isError && (
        <Alert severity="error">
          Unable to load inventory. Please try again.
        </Alert>
      )}
      {/* Inventory dashboard summary cards. */}
      <Box className="inventory-cards">
        {[
          {
            label: "Total Products",
            value: summary?.totalProducts ?? 0,
            tone: "blue",
          },
          {
            label: "Total Inventory Quantity",
            value: summary?.totalInventoryQuantity ?? 0,
            tone: "green",
          },
          {
            label: "Low Stock Products",
            value: summary?.lowStockProducts ?? 0,
            tone: "orange",
          },
          {
            label: "Out of Stock Products",
            value: summary?.outOfStockProducts ?? 0,
            tone: "red",
          },
        ].map((card) => (
          <Box
            className={`inventory-card inventory-card--${card.tone}`}
            key={card.label}
          >
            <Box className="inventory-card__icon">
              <Inventory2OutlinedIcon />
            </Box>
            <Box>
              <span>{card.label}</span>
              <strong>{card.value.toLocaleString()}</strong>
            </Box>
          </Box>
        ))}
      </Box>
      {/* Searchable and filterable Inventory Overview table. */}
      <Box className="inventory-panel">
        <Box className="inventory-panel__title">
          <Typography component="h2">Inventory Overview</Typography>
          <span>{inventoryQuery.data?.total ?? 0} products</span>
        </Box>
        {/* Primary toolbar: search, category, brand, status, filters and export. */}
        <Box className="inventory-filters">
          <Box className="inventory-search">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product name or SKU..."
            />
            <SearchOutlinedIcon />
          </Box>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {inventoryQuery.data?.categories.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
          <select value={brand} onChange={(e) => setBrand(e.target.value)}>
            <option value="">All Brands</option>
            {inventoryQuery.data?.brands.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <select
            value={stockStatus}
            onChange={(e) => setStockStatus(e.target.value)}
          >
            <option value="">All Stock Status</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
          <Box className="inventory-filter-actions">
            <button
              className={filtersOpen ? "active" : ""}
              onClick={() => setFiltersOpen((open) => !open)}
            >
              <FilterAltOutlinedIcon /> Filters
            </button>
            <button
              onClick={exportInventory}
              disabled={inventoryQuery.isLoading || items.length === 0}
            >
              <FileDownloadOutlinedIcon /> Export
            </button>
          </Box>
        </Box>
        {/* Secondary filters contain sorting and a one-click reset action. */}
        {filtersOpen && (
          <Box className="inventory-advanced-filters">
            <label>
              Sort by
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="product">Product Name</option>
                <option value="stock">Current Stock</option>
                <option value="recent">Recently Updated</option>
              </select>
            </label>
            <Button
              size="small"
              onClick={() => {
                setCategory("");
                setBrand("");
                setStockStatus("");
                setSort("product");
              }}
            >
              Clear filters
            </Button>
          </Box>
        )}
        {/* Inventory detail columns intentionally exclude an Actions column. */}
        <Box className="inventory-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Current Stock</th>
                <th>Reserved Stock</th>
                <th>Available Stock</th>
                <th>Reorder Level</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.productName}</strong>
                  </td>
                  <td>{row.sku}</td>
                  <td>{row.categoryName}</td>
                  <td>{row.brand || "—"}</td>
                  <td>{row.currentStock}</td>
                  <td>{row.reservedStock}</td>
                  <td>{row.availableStock}</td>
                  <td>{row.reorderLevel}</td>
                  <td>
                    <span
                      className={`inventory-status inventory-status--${row.stockStatus.toLowerCase()}`}
                    >
                      {statusLabel[row.stockStatus]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!inventoryQuery.isLoading && items.length === 0 && (
            <Box className="inventory-empty">
              No inventory products match your filters.
            </Box>
          )}
          {pageCount > 1 && (
            <Box className="inventory-pagination">
              <Pagination
                count={pageCount}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </Box>
      </Box>
      {/* Category chart, status distribution and Quick Actions. */}
      <Box className="inventory-lower">
        <Box className="inventory-chart">
          <Typography component="h2">Inventory by Category</Typography>
          {summary?.inventoryByCategory.map((x, i) => (
            <Box className="bar-row" key={x.name}>
              <span>{x.name}</span>
              <Box>
                <i
                  style={{
                    width: `${Math.max(4, (x.value / maxCategory) * 100)}%`,
                    background: [
                      "#2563eb",
                      "#10b981",
                      "#f59e0b",
                      "#8b5cf6",
                      "#06b6d4",
                    ][i % 5],
                  }}
                />
              </Box>
              <strong>{x.value.toLocaleString()}</strong>
            </Box>
          ))}
        </Box>
        <Box className="inventory-chart">
          <Typography component="h2">Stock Status Distribution</Typography>
          <Box className="stock-status-chart">
            <Box
              className="stock-status-chart__donut"
              style={{ background: stockChartBackground }}
              role="img"
              aria-label={`${inStock} in stock, ${lowStock} low stock, ${outOfStock} out of stock`}
            >
              <Box className="stock-status-chart__center">
                <strong>{stockTotal}</strong>
                <span>Products</span>
              </Box>
            </Box>
            <Box className="status-distribution">
              {(summary?.stockStatusDistribution ?? []).map((x) => (
                <Box key={x.name}>
                  <i className={`dot dot--${x.name.toLowerCase()}`} />
                  <span>{statusLabel[x.name]}</span>
                  <strong>{x.value}</strong>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
        {/* Quantity-changing actions are hidden from non-admin users. */}
        <Box className="inventory-actions">
          <Typography component="h2">Quick Actions</Typography>
          {admin && (
            <>
              <button
                className="add"
                onClick={() => openAdjustment("STOCK_ADDITION")}
              >
                <AddCircleOutlineIcon /> Add Stock
              </button>
              <button
                className="remove"
                onClick={() => openAdjustment("STOCK_REMOVAL")}
              >
                <RemoveCircleOutlineIcon /> Remove Stock
              </button>
              <button
                className="adjust"
                onClick={() => openAdjustment("MANUAL_ADJUSTMENT")}
              >
                <TuneOutlinedIcon /> Adjust Stock
              </button>
            </>
          )}
          <button className="history" onClick={() => setHistoryOpen(true)}>
            <HistoryOutlinedIcon /> Stock Adjustment Reasons
          </button>
          <button className="history" onClick={() => setHistoryOpen(true)}>
            <HistoryOutlinedIcon /> View Adjustment History
          </button>
        </Box>
      </Box>
      {/* Five newest movements are shown here; View All opens full history. */}
      <Box className="inventory-panel">
        <Box className="inventory-panel__title">
          <Typography component="h2">Recent Stock Movements</Typography>
          <Button onClick={() => setHistoryOpen(true)}>View All</Button>
        </Box>
        <MovementTable rows={(movementsQuery.data ?? []).slice(0, 5)} />
      </Box>
      {/* Add, Remove and Manual Adjustment form dialog. */}
      <Dialog
        open={Boolean(dialogType)}
        onClose={() => setDialogType(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {dialogType ? movementLabel[dialogType] : "Stock Adjustment"}
        </DialogTitle>
        <DialogContent className="inventory-dialog">
          <TextField
            select
            label="Product"
            value={productId}
            onChange={(e) => {
              setProductId(e.target.value);
              const product = items.find((x) => x.productId === e.target.value);
              setReorderLevel(product ? String(product.reorderLevel) : "");
            }}
            required
          >
            {items.map((x) => (
              <MenuItem key={x.productId} value={x.productId}>
                {x.productName} ({x.sku}) — {x.availableStock} available
              </MenuItem>
            ))}
          </TextField>
          <TextField
            type="number"
            label={
              dialogType === "MANUAL_ADJUSTMENT"
                ? "Set current stock to"
                : "Quantity"
            }
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            inputProps={{ min: 1 }}
            required
          />
          <TextField
            type="number"
            label="Reorder Level"
            value={reorderLevel}
            onChange={(e) => setReorderLevel(e.target.value)}
            inputProps={{ min: 0 }}
          />
          <TextField
            select
            label="Adjustment Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          >
            {reasons.map((x) => (
              <MenuItem key={x} value={x}>
                {x}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            multiline
            rows={3}
          />
          {selected && (
            <Alert severity="info">
              Current: {selected.currentStock} · Reserved:{" "}
              {selected.reservedStock} · Available: {selected.availableStock}
            </Alert>
          )}
          {adjustment.isError && (
            <Alert severity="error">
              {(
                adjustment.error as {
                  response?: { data?: { detail?: string } };
                }
              ).response?.data?.detail || "Unable to save adjustment."}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogType(null)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={
              !productId ||
              !quantity ||
              Number(quantity) <= 0 ||
              !reason ||
              adjustment.isPending
            }
            onClick={submit}
          >
            Save Adjustment
          </Button>
        </DialogActions>
      </Dialog>
      {/* Complete stock movement and adjustment history dialog. */}
      <Dialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        fullWidth
        maxWidth="xl"
      >
        <DialogTitle>Stock Movement History</DialogTitle>
        <DialogContent>
          <MovementTable rows={movementsQuery.data ?? []} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

/* =========================================================
 * Reusable stock movement history table
 * ========================================================= */

// Product remains the first column and Timestamp remains the final column.
const MovementTable = ({
  rows,
}: {
  rows: Awaited<ReturnType<typeof getInventoryMovements>>;
}) => (
  <Box className="inventory-table-wrap">
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Movement Type</th>
          <th>Previous Qty</th>
          <th>Quantity Changed</th>
          <th>Updated Qty</th>
          <th>Reason</th>
          <th>Performed By</th>
          <th>Remarks</th>
          <th>Timestamp</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>
              <strong>{row.productName}</strong>
            </td>
            <td>{movementLabel[row.movementType] || row.movementType}</td>
            <td>{row.previousQuantity}</td>
            <td
              className={
                row.quantityChanged >= 0 ? "qty-positive" : "qty-negative"
              }
            >
              {row.quantityChanged > 0 ? "+" : ""}
              {row.quantityChanged}
            </td>
            <td>{row.updatedQuantity}</td>
            <td>{row.reason}</td>
            <td>{row.performedBy}</td>
            <td>{row.remarks || "—"}</td>
            <td>{new Date(row.createdAt).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
    {rows.length === 0 && (
      <Box className="inventory-empty">No stock movements recorded yet.</Box>
    )}
  </Box>
);
export default InventoryPage;
