/* Lets users choose a report, apply filters, inspect results, and export them. */
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
} from "@mui/material";
import { AssessmentOutlined, Download } from "@mui/icons-material";
import { types } from "./reportConstants";
import { dateTime } from "./reportUtils";
import { context } from "./reportUtils";
import ReportFilters from "./ReportFilters";
import type { ReportsState } from "./useReports";

type Props = Pick<
  ReportsState,
  | "type"
  | "setType"
  | "filters"
  | "setFilters"
  | "options"
  | "run"
  | "busy"
  | "tableBusy"
  | "page"
  | "setPage"
  | "size"
  | "setSize"
  | "sort"
  | "setSort"
  | "direction"
  | "setDirection"
  | "generate"
  | "download"
>;

export default function GenerateReports({
  type,
  setType,
  filters,
  setFilters,
  options,
  run,
  busy,
  tableBusy,
  page,
  setPage,
  size,
  setSize,
  sort,
  setSort,
  direction,
  setDirection,
  generate,
  download,
}: Props) {
  return (
    <>
      {/* Select the kind of report before choosing filters. */}
      <div className="report-types">
        {types.map((t) => (
          <button
            key={t.id}
            className={`report-type ${type === t.id ? "selected" : ""}`}
            onClick={() => setType(t.id)}
            aria-pressed={type === t.id}
          >
            <span className={`report-icon ${t.color}`}>
              <t.icon />
            </span>
            <strong>{t.name}</strong>
            <span>{t.description}</span>
            <b>{type === t.id ? "Selected" : "Select report"} &rarr;</b>
          </button>
        ))}
      </div>
      <Paper variant="outlined" className="report-panel">
        <Stack direction="row" sx={{ justifyContent: "space-between", mb: 3 }}>
          <Typography variant="h6">
            {types.find((t) => t.id === type)?.name} Â· Filters
          </Typography>
          <Button onClick={() => setFilters({})}>Reset filters</Button>
        </Stack>
        <ReportFilters
          selected={type}
          value={filters}
          change={setFilters}
          options={options}
        />
        {type === "inventory" && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Current inventory snapshot. Date range filters the last stock
            update.
          </Typography>
        )}
        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            mt: 3,
            alignItems: "center",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Filters work together. Leave fields blank to include all available
            data.
          </Typography>
          <Button
            variant="contained"
            disabled={busy || !options}
            onClick={generate}
            startIcon={
              busy ? <CircularProgress size={16} /> : <AssessmentOutlined />
            }
          >
            {busy ? "Preparing reportâ€¦" : "Generate report"}
          </Button>
        </Stack>
      </Paper>
      <Paper variant="outlined" className="report-panel">
        <Stack
          direction="row"
          sx={{ justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}
        >
          <Box>
            <Typography variant="h6">
              {run?.name || "Your report will appear here"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {run
                ? `Generated ${dateTime(run.created_at)} Â· ${run.total} records`
                : "Select a report, apply filters and generate to get started."}
            </Typography>
          </Box>
          {run?.status === "COMPLETED" && (
            <Stack direction="row" sx={{ gap: 1 }}>
              <Button
                startIcon={<Download />}
                disabled={busy}
                onClick={() => download(run, "CSV")}
              >
                Export CSV
              </Button>
              <Button
                variant="outlined"
                startIcon={<Download />}
                disabled={busy}
                onClick={() => download(run, "PDF")}
              >
                Export PDF
              </Button>
            </Stack>
          )}
        </Stack>
        {run && (
          <>
            <Typography className="report-context" variant="body2">
              {context(run)}
            </Typography>
            {run.context.note && (
              <Typography variant="caption" color="text.secondary">
                {run.context.note}
              </Typography>
            )}
            {run.error && <Alert severity="error">{run.error}</Alert>}
          </>
        )}
        {(tableBusy || busy) && (
          <Stack
            direction="row"
            role="status"
            sx={{ gap: 2, alignItems: "center", p: 3 }}
          >
            <CircularProgress size={22} />
            Fetching and preparing report dataâ€¦
          </Stack>
        )}
        {run?.status === "COMPLETED" && !tableBusy && (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {run.columns.map((c) => (
                      <TableCell key={c}>
                        <TableSortLabel
                          active={sort === c}
                          direction={sort === c ? direction : "asc"}
                          onClick={() => {
                            setSort(c);
                            setDirection(
                              sort === c && direction === "asc"
                                ? "desc"
                                : "asc",
                            );
                            setPage(0);
                          }}
                        >
                          {c}
                        </TableSortLabel>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {run.rows?.map((row, i) => (
                    <TableRow key={i}>
                      {run.columns.map((c) => (
                        <TableCell key={c}>{row[c] ?? "â€”"}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {run.total === 0 && (
              <div className="report-empty">
                <AssessmentOutlined />
                <Typography variant="h6">No records found</Typography>
                <Typography color="text.secondary">
                  Try a different date range or clear your filters.
                </Typography>
                <Button onClick={() => setFilters({})}>Clear filters</Button>
              </div>
            )}
            <TablePagination
              component="div"
              count={run.total}
              page={page}
              rowsPerPage={size}
              rowsPerPageOptions={[5, 10, 25, 50, 100]}
              onPageChange={(_, v) => setPage(v)}
              onRowsPerPageChange={(e) => {
                setSize(Number(e.target.value));
                setPage(0);
              }}
            />
          </>
        )}
        {!run && !busy && !tableBusy && (
          <div className="report-empty">
            <AssessmentOutlined />
            <Typography variant="h6">No report generated yet</Typography>
            <Typography sx={{ mt: 1, mb: 2 }}>
              Generate the selected report using the filters above. Leave
              filters blank to include all available data.
            </Typography>
            <Button
              variant="contained"
              disabled={!options}
              onClick={generate}
              startIcon={<AssessmentOutlined />}
            >
              Generate report
            </Button>
          </div>
        )}
      </Paper>
    </>
  );
}
