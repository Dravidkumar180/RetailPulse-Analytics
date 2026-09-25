// Issues list, exports and pagination.
import {
  Alert,
  Button,
  LinearProgress,
  Pagination,
  Stack,
} from "@mui/material";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import { fmt, short, badge } from "./dataQualityFormat";
import DataQualityFilters from "./DataQualityFilters";
import type { DataQualityPageState } from "./useDataQualityPage";

type Props = Pick<
  DataQualityPageState,
  | "issues"
  | "download"
  | "overview"
  | "filters"
  | "setFilters"
  | "setApplied"
  | "setPage"
  | "applied"
  | "page"
  | "setSelected"
  | "setNewStatus"
  | "setNote"
  | "update"
>;

export default function DataQualityIssues({
  issues,
  download,
  overview,
  filters,
  setFilters,
  setApplied,
  setPage,
  applied,
  page,
  setSelected,
  setNewStatus,
  setNote,
  update,
}: Props) {
  return (
    <>
      <section className="dq-panel">
        <div className="dq-panel-heading">
          <div>
            <h2>
              Data quality issues{" "}
              <span className="dq-count">{issues.data?.total ?? "?"}</span>
            </h2>
            <p>Track findings, review evidence and document resolutions.</p>
          </div>
          <Stack direction="row" spacing={1}>
            <Button
              disabled={
                download.isPending || issues.isLoading || issues.isError
              }
              onClick={() => download.mutate("CSV")}
            >
              Export CSV
            </Button>
            <Button
              disabled={
                download.isPending || issues.isLoading || issues.isError
              }
              onClick={() => download.mutate("PDF")}
            >
              Export PDF
            </Button>
          </Stack>
        </div>

        <DataQualityFilters
          {...{ filters, setFilters, setApplied, setPage, overview }}
        />

        {issues.isLoading ? (
          <LinearProgress />
        ) : issues.isError && !issues.data ? (
          <Alert severity="error">
            Issues could not be loaded. Use Retry above to try again.
          </Alert>
        ) : (
          <div className="dq-table-wrap">
            <table>
              <thead>
                <tr>
                  {[
                    "Issue ID",
                    "Issue type",
                    "Severity",
                    "Module",
                    "Affected record",
                    "Description",
                    "Detected",
                    "Status",
                    "",
                  ].map((h, i) => (
                    <th key={i}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {issues.data?.items.map((i) => (
                  <tr key={i.id}>
                    <td title={i.id}>DQ-{short(i.id)}</td>
                    <td>{i.issue_type}</td>
                    <td>{badge(i.severity)}</td>
                    <td>{i.module}</td>
                    <td>{i.record_label}</td>
                    <td className="dq-description">{i.description}</td>
                    <td>{fmt(i.detected_at)}</td>
                    <td>{badge(i.status)}</td>
                    <td>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setSelected(i.id);
                          setNewStatus(i.status);
                          setNote("");
                          update.reset();
                        }}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!issues.data?.items.length && !issues.isError && (
              <div className="dq-empty">
                <FactCheckOutlinedIcon />
                <h3>No issues found</h3>
                <p>
                  {Object.values(applied).some(Boolean)
                    ? "Try adjusting your filters."
                    : "Run reconciliation to verify your company data."}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="dq-pagination">
          <span>{issues.data?.total ?? "?"} issues · 10 per page</span>
          <Pagination
            page={page}
            count={Math.max(1, Math.ceil((issues.data?.total ?? 0) / 10))}
            onChange={(_, p) => setPage(p)}
            color="primary"
          />
        </div>
      </section>
    </>
  );
}
