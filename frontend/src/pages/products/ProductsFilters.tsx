// Renders the products filters controls for the products feature.
import { Box, MenuItem, TextField } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import type { Category } from "../../api/catalogApi";
import Button from "../../components/common/Button/Button";

type Props = {
  search: string;
  category: string;
  status: string;
  brand: string;
  sort: string;
  categories: Category[];
  brands: string[];
  canEdit: boolean;
  onSearch: (v: string) => void;
  onCategory: (v: string) => void;
  onStatus: (v: string) => void;
  onBrand: (v: string) => void;
  onSort: (v: string) => void;
  onAdd: () => void;
};
// This component receives prepared data and renders the feature-specific interface.
export default function ProductsFilters(p: Props) {
  return (
    <Box className="catalog-filters">
      <TextField
        size="small"
        placeholder="Search by product name, SKU or brand..."
        value={p.search}
        onChange={(e) => p.onSearch(e.target.value)}
      />
      <TextField
        select
        size="small"
        label="Category"
        value={p.category}
        onChange={(e) => p.onCategory(e.target.value)}
      >
        <MenuItem value="">All Categories</MenuItem>
        {p.categories.map((c) => (
          <MenuItem key={c.id} value={c.id}>
            {c.name}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        size="small"
        label="Status"
        value={p.status}
        onChange={(e) => p.onStatus(e.target.value)}
      >
        <MenuItem value="">All Status</MenuItem>
        <MenuItem value="ACTIVE">Active</MenuItem>
        <MenuItem value="INACTIVE">Inactive</MenuItem>
      </TextField>
      <TextField
        select
        size="small"
        label="Brand"
        value={p.brand}
        onChange={(e) => p.onBrand(e.target.value)}
      >
        <MenuItem value="">All Brands</MenuItem>
        {p.brands.map((brand) => (
          <MenuItem key={brand} value={brand}>
            {brand}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        size="small"
        label="Sort"
        value={p.sort}
        onChange={(e) => p.onSort(e.target.value)}
      >
        <MenuItem value="recent">Recently Added</MenuItem>
        <MenuItem value="name">Name</MenuItem>
        <MenuItem value="price">Price</MenuItem>
      </TextField>
      {p.canEdit && (
        <Button startIcon={<AddIcon />} onClick={p.onAdd}>
          Add Product
        </Button>
      )}
    </Box>
  );
}
