// Renders the replenishment filters controls for the forecasting feature.
import { Box, MenuItem, Select } from "@mui/material";
import Button from "../../components/common/Button/Button";
import { stockRiskLabels } from "./SmartReplenishmentShared";
type Setter = (value: string) => void;
type Props = {
  days: number;
  setDays: (value: number) => void;
  risk: string;
  setRisk: Setter;
  category: string;
  setCategory: Setter;
  supplier: string;
  setSupplier: Setter;
  search: string;
  setSearch: Setter;
  reorder: string;
  setReorder: Setter;
  sort: string;
  setSort: Setter;
  direction: string;
  setDirection: Setter;
  categories: string[];
  suppliers: string[];
  onClear: () => void;
};
// This component receives prepared data and renders the feature-specific interface.
export default function ReplenishmentFilters(p: Props) {
  return (
    <Box className="sr-filters">
      <label>
        Forecast period
        <Select
          size="small"
          value={p.days}
          onChange={(e) => p.setDays(Number(e.target.value))}
        >
          <MenuItem value={7}>Next 7 days</MenuItem>
          <MenuItem value={30}>Next 30 days</MenuItem>
          <MenuItem value={90}>Next 90 days</MenuItem>
        </Select>
      </label>
      <label>
        Stock risk
        <Select
          displayEmpty
          size="small"
          value={p.risk}
          onChange={(e) => p.setRisk(e.target.value)}
        >
          <MenuItem value="">All risks</MenuItem>
          {Object.entries(stockRiskLabels).map(([key, value]) => (
            <MenuItem value={key} key={key}>
              {value}
            </MenuItem>
          ))}
        </Select>
      </label>
      <label>
        Category
        <Select
          displayEmpty
          size="small"
          value={p.category}
          onChange={(e) => p.setCategory(e.target.value)}
        >
          <MenuItem value="">All categories</MenuItem>
          {p.categories.map((value) => (
            <MenuItem value={value} key={value}>
              {value}
            </MenuItem>
          ))}
        </Select>
      </label>
      <label>
        Supplier / brand
        <Select
          displayEmpty
          size="small"
          value={p.supplier}
          onChange={(e) => p.setSupplier(e.target.value)}
        >
          <MenuItem value="">All suppliers</MenuItem>
          {p.suppliers.map((value) => (
            <MenuItem value={value} key={value}>
              {value}
            </MenuItem>
          ))}
        </Select>
      </label>
      <label>
        Product
        <input
          placeholder="Search name or SKU"
          value={p.search}
          onChange={(e) => p.setSearch(e.target.value)}
        />
      </label>
      <label>
        Reorder required
        <Select
          displayEmpty
          size="small"
          value={p.reorder}
          onChange={(e) => p.setReorder(e.target.value)}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="yes">Required</MenuItem>
          <MenuItem value="no">Not required</MenuItem>
        </Select>
      </label>
      <label>
        Sort by
        <Select
          size="small"
          value={p.sort}
          onChange={(e) => p.setSort(e.target.value)}
        >
          <MenuItem value="risk">Risk level</MenuItem>
          <MenuItem value="stock">Current stock</MenuItem>
          <MenuItem value="demand">Forecasted demand</MenuItem>
          <MenuItem value="days">Days remaining</MenuItem>
          <MenuItem value="quantity">Recommended quantity</MenuItem>
        </Select>
      </label>
      <label>
        Order
        <Select
          size="small"
          value={p.direction}
          onChange={(e) => p.setDirection(e.target.value)}
        >
          <MenuItem value="asc">Ascending</MenuItem>
          <MenuItem value="desc">Descending</MenuItem>
        </Select>
      </label>
      <Button variant="outlined" onClick={p.onClear}>
        Clear filters
      </Button>
    </Box>
  );
}
