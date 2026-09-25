// KPI cards, configured checks and execution status.
import { Alert, Box, LinearProgress } from "@mui/material";
import { fmt, badge } from "./dataQualityFormat";
import type { DataQualityPageState } from "./useDataQualityPage";

type Props = Pick<
  DataQualityPageState,
  "overview" | "baseline" | "latest" | "running" | "user"
>;

export default function DataQualityOverview({
  overview,
  baseline,
  latest,
  running,
  user,
}: Props) {
  return (
    <>
      {overview.isLoading ? (
        <LinearProgress />
      ) : overview.isError && !overview.data ? (
        <Alert severity="warning">
          Overview unavailable. Retry when the API is ready.
        </Alert>
      ) : (
        <>
          <div className="dq-kpis">
            {[
              ["Records checked", baseline?.records_checked, "blue"],
              ["Valid records", baseline?.valid_records, "green"],
              ["With warnings", baseline?.warning_records, "amber"],
              ["With errors", baseline?.error_records, "red"],
              ["Unresolved issues", overview.data?.unresolved, "purple"],
            ].map(([label, value, tone]) => (
              <section className={`dq-kpi ${tone}`} key={String(label)}>
                <span>{label}</span>
                <strong>
                  {typeof value === "number" ? value.toLocaleString() : "—"}
                </strong>
                <small>
                  {label === "Unresolved issues"
                    ? "Open + investigating"
                    : "Last completed full reconciliation"}
                </small>
              </section>
            ))}
            <section className="dq-kpi">
              <span>Last reconciliation</span>
              <strong className="dq-time">
                {fmt(latest?.completed_at || latest?.started_at)}
              </strong>
              <small>
                {latest
                  ? `${latest.trigger} · ${latest.status}`
                  : "No reconciliation yet"}
              </small>
            </section>
          </div>

          <div className="dq-overview">
            <section className="dq-panel">
              <div className="dq-panel-heading">
                <div>
                  <h2>Reconciliation checks</h2>
                  <p>Live records across your company</p>
                </div>
                {baseline && badge(baseline.status)}
              </div>
              <div className="dq-check-grid">
                {(overview.data?.checks ?? []).map((name) => {
                  const count = baseline?.checks.find(
                    (c) => c.name === name,
                  )?.issues;
                  return (
                    <div className="dq-check" key={name}>
                      <span className={count ? "dq-dot warning" : "dq-dot"} />{" "}
                      <span>{name}</span>
                      <strong>
                        {count === undefined
                          ? "Not run"
                          : count === 0
                            ? "Passed"
                            : `${count} issues`}
                      </strong>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="dq-panel dq-execution">
              <h2>Execution status</h2>
              {latest ? (
                <>
                  <Box sx={{ my: 2 }}>{badge(latest.status)}</Box>
                  {running && <LinearProgress sx={{ my: 2 }} />}
                  <p>
                    {running
                      ? "Checking company records. You can continue using the application."
                      : `${latest.records_checked.toLocaleString()} records checked · ${latest.issues_detected} issues detected`}
                  </p>
                  <dl>
                    <dt>Triggered by</dt>
                    <dd>{latest.triggered_by}</dd>
                    <dt>Started</dt>
                    <dd>{fmt(latest.started_at)}</dd>
                    <dt>Completed</dt>
                    <dd>{fmt(latest.completed_at)}</dd>
                  </dl>
                  {latest.failed_checks.length > 0 && (
                    <Alert severity="error">
                      {latest.failed_checks.length} checks failed. Review
                      execution details and retry.
                    </Alert>
                  )}
                </>
              ) : (
                <p>
                  Run your first reconciliation to establish a quality baseline.
                </p>
              )}
              <div className="dq-company">
                Company isolation enabled
                <br />
                <strong>{user?.company?.name ?? "Your company"}</strong>
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
}
