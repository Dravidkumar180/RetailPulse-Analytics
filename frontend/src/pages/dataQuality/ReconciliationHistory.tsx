// Paginated reconciliation execution history.
import { Alert, Button, LinearProgress, Pagination } from "@mui/material";
import { fmt, short, badge } from "./dataQualityFormat";
import type { DataQualityPageState } from "./useDataQualityPage";

type Props = Pick<
  DataQualityPageState,
  "history" | "historyPage" | "setHistoryPage" | "setSelectedRun"
>;

export default function ReconciliationHistory({
  history,
  historyPage,
  setHistoryPage,
  setSelectedRun,
}: Props) {
  return (
    <>
      <section className="dq-panel">
        <div className="dq-panel-heading">
          <div>
            <h2>Reconciliation history</h2>
            <p>
              Manual executions and automatic checks after business changes.
            </p>
          </div>
        </div>
        <div className="dq-table-wrap">
          <table>
            <thead>
              <tr>
                {[
                  "Execution ID",
                  "Started",
                  "Completed",
                  "Triggered by",
                  "Scope",
                  "Checked",
                  "Detected",
                  "Resolved",
                  "Failed checks",
                  "Status",
                  "",
                ].map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.data?.items.map((r) => (
                <tr key={r.id}>
                  <td title={r.id}>RC-{short(r.id)}</td>
                  <td>{fmt(r.started_at)}</td>
                  <td>{fmt(r.completed_at)}</td>
                  <td>{r.triggered_by}</td>
                  <td>{r.trigger === "Manual" ? "Full" : "Changed records"}</td>
                  <td>{r.records_checked}</td>
                  <td>{r.issues_detected}</td>
                  <td>{r.issues_resolved}</td>
                  <td>{r.failed_checks.length}</td>
                  <td>{badge(r.status)}</td>
                  <td>
                    <Button size="small" onClick={() => setSelectedRun(r)}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {history.isLoading && <LinearProgress />}
          {history.isError && (
            <Alert severity="error">
              Execution history could not be loaded.
            </Alert>
          )}
          {history.isSuccess && !history.data?.items.length && (
            <p className="dq-empty">No executions yet.</p>
          )}
        </div>
        <div className="dq-pagination">
          <span>{history.data?.total ?? "?"} executions</span>
          <Pagination
            page={historyPage}
            count={Math.max(1, Math.ceil((history.data?.total ?? 0) / 10))}
            onChange={(_, p) => setHistoryPage(p)}
          />
        </div>
      </section>
    </>
  );
}
