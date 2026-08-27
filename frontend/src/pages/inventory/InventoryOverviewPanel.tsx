// Provides the Inventory Overview Panel UI for the inventory feature.
import { Box, Button, Pagination, Typography } from "@mui/material";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import type { InventoryItem, InventoryList } from "../../api/inventoryApi";
import { STATUS_LABEL } from "./inventoryConstants";
// The declarations below define the public data used by this module.
export type InventoryFilters = {
  search: string;
  category: string;
  brand: string;
  stockStatus: string;
  sort: string;
};
type Props = {
  data?: InventoryList;
  items: InventoryItem[];
  filters: InventoryFilters;
  filtersOpen: boolean;
  loading: boolean;
  page: number;
  pageCount: number;
  onFilter: (key: keyof InventoryFilters, value: string) => void;
  onToggleFilters: () => void;
  onClear: () => void;
  onExport: () => void;
  onPage: (page: number) => void;
};
export default function InventoryOverviewPanel(p: Props) {
  return (
    <Box className="inventory-panel">
      <Box className="inventory-panel__title">
        <Typography component="h2">Inventory Overview</Typography>
        <span>{p.data?.total ?? 0} products</span>
      </Box>
      <Box className="inventory-filters">
        <Box className="inventory-search">
          <input
            value={p.filters.search}
            onChange={(e) => p.onFilter("search", e.target.value)}
            placeholder="Search by product name or SKU..."
          />
          <SearchOutlinedIcon />
        </Box>
        <select
          value={p.filters.category}
          onChange={(e) => p.onFilter("category", e.target.value)}
        >
          <option value="">All Categories</option>
          {p.data?.categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          value={p.filters.brand}
          onChange={(e) => p.onFilter("brand", e.target.value)}
        >
          <option value="">All Brands</option>
          {p.data?.brands.map((brand) => (
            <option key={brand}>{brand}</option>
          ))}
        </select>
        <select
          value={p.filters.stockStatus}
          onChange={(e) => p.onFilter("stockStatus", e.target.value)}
        >
          <option value="">All Stock Status</option>
          <option value="IN_STOCK">In Stock</option>
          <option value="LOW_STOCK">Low Stock</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
        </select>
        <Box className="inventory-filter-actions">
          <button
            className={p.filtersOpen ? "active" : ""}
            onClick={p.onToggleFilters}
          >
            <FilterAltOutlinedIcon /> Filters
          </button>
          <button onClick={p.onExport} disabled={p.loading || !p.items.length}>
            <FileDownloadOutlinedIcon /> Export
          </button>
        </Box>
      </Box>
      {p.filtersOpen && (
        <Box className="inventory-advanced-filters">
          <label>
            Sort by
            <select
              value={p.filters.sort}
              onChange={(e) => p.onFilter("sort", e.target.value)}
            >
              <option value="product">Product Name</option>
              <option value="stock">Current Stock</option>
              <option value="recent">Recently Updated</option>
            </select>
          </label>
          <Button size="small" onClick={p.onClear}>
            Clear filters
          </Button>
        </Box>
      )}
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
            {p.items.map((row) => (
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
                    {STATUS_LABEL[row.stockStatus]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!p.loading && !p.items.length && (
          <Box className="inventory-empty">
            No inventory products match your filters.
          </Box>
        )}
        {p.pageCount > 1 && (
          <Box className="inventory-pagination">
            <Pagination
              count={p.pageCount}
              page={p.page}
              onChange={(_, page) => p.onPage(page)}
              color="primary"
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
