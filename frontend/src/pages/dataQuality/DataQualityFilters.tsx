// Combined search, type, severity, module, status and date filters.
import { Button, MenuItem, TextField } from "@mui/material";
import { initialFilters } from "./dataQualityConstants";
import type { DataQualityPageState } from "./useDataQualityPage";

type Props = Pick<
  DataQualityPageState,
  "filters" | "setFilters" | "setApplied" | "setPage" | "overview"
>;

export default function DataQualityFilters({
  filters,
  setFilters,
  setApplied,
  setPage,
  overview,
}: Props) {
  return (
    <>
      <form
        className="dq-filters"
        onSubmit={(e) => {
          e.preventDefault();
          setApplied({ ...filters });
          setPage(1);
        }}
      >
        <TextField
          size="small"
          label="Search issues"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />

        {(
          [
            ["issue_type", "Issue type", overview.data?.checks ?? []],
            ["severity", "Severity", ["Warning", "Error"]],
            [
              "module",
              "Module",
              ["Products", "Sales", "Inventory", "Customers", "Reports"],
            ],
            [
              "status",
              "Status",
              ["Open", "Investigating", "Resolved", "Ignored"],
            ],
          ] as [keyof typeof filters, string, string[]][]
        ).map(([key, label, options]) => (
          <TextField
            select
            size="small"
            key={key}
            label={label}
            value={filters[key]}
            onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
          >
            <MenuItem value="">All</MenuItem>
            {options.map((v) => (
              <MenuItem key={v} value={v}>
                {v}
              </MenuItem>
            ))}
          </TextField>
        ))}

        <TextField
          size="small"
          type="date"
          label="From"
          slotProps={{ inputLabel: { shrink: true } }}
          value={filters.date_from}
          onChange={(e) =>
            setFilters({ ...filters, date_from: e.target.value })
          }
        />
        <TextField
          size="small"
          type="date"
          label="To"
          slotProps={{ inputLabel: { shrink: true } }}
          value={filters.date_to}
          onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
        />
        <Button type="submit" variant="contained">
          Apply filters
        </Button>
        <Button
          onClick={() => {
            setFilters(initialFilters);
            setApplied(initialFilters);
            setPage(1);
          }}
        >
          Reset
        </Button>
      </form>
    </>
  );
}
