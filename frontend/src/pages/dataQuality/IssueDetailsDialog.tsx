// Issue evidence, related records, resolution and status history.
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import { fmt, short, badge } from "./dataQualityFormat";
import { paths } from "./dataQualityConstants";
import { Evidence, Records } from "./IssueEvidence";
import type { DataQualityPageState } from "./useDataQualityPage";

type Props = Pick<
  DataQualityPageState,
  | "selected"
  | "setSelected"
  | "issue"
  | "detail"
  | "manage"
  | "newStatus"
  | "setNewStatus"
  | "note"
  | "setNote"
  | "update"
>;

export default function IssueDetailsDialog({
  selected,
  setSelected,
  issue,
  detail,
  manage,
  newStatus,
  setNewStatus,
  note,
  setNote,
  update,
}: Props) {
  return (
    <>
      <Dialog
        open={!!selected}
        onClose={() => setSelected(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Issue details {issue && `· DQ-${short(issue.id)}`}
        </DialogTitle>
        <DialogContent dividers>
          {detail.isLoading ? (
            <CircularProgress />
          ) : detail.isError ? (
            <Alert
              severity="error"
              action={
                <Button onClick={() => void detail.refetch()}>Retry</Button>
              }
            >
              Unable to load issue.
            </Alert>
          ) : (
            issue && (
              <Stack spacing={3}>
                <Stack direction="row" spacing={1}>
                  {badge(issue.severity)}
                  {badge(issue.status)}
                  <Chip label={issue.module} />
                </Stack>
                <div>
                  <Typography variant="h6">
                    {issue.issue_type} · {issue.record_label}
                  </Typography>
                  <p>{issue.description}</p>
                  <p className="dq-muted">
                    Detected {fmt(issue.detected_at)} · Last observed{" "}
                    {fmt(issue.last_seen_at)}
                  </p>
                </div>
                <section>
                  <h3>Current record</h3>
                  {issue.current_record ? (
                    <Evidence data={issue.current_record} />
                  ) : (
                    <Alert severity="warning">
                      The underlying record is no longer available in your
                      company.
                    </Alert>
                  )}
                  <Button
                    component={Link}
                    to={paths[issue.module] ?? "/reports"}
                  >
                    Open {issue.module}
                  </Button>
                </section>
                <section>
                  <h3>Evidence at detection</h3>
                  <Evidence data={issue.evidence} />
                  {Object.entries(issue.evidence)
                    .filter(([, v]) => Array.isArray(v))
                    .map(([k, v]) => (
                      <div key={k}>
                        <h4>{k.replaceAll("_", " ")}</h4>
                        {(v as unknown[]).length &&
                        typeof (v as unknown[])[0] === "object" ? (
                          <Records rows={v as Record<string, unknown>[]} />
                        ) : (
                          <p>{(v as string[]).join(", ")}</p>
                        )}
                      </div>
                    ))}
                </section>
                {!!issue.movements?.length && (
                  <section>
                    <h3>Recent stock movements (up to 50)</h3>
                    <Records rows={issue.movements} />
                  </section>
                )}
                {!!issue.related_sales?.length && (
                  <section>
                    <h3>Related sales (up to 50)</h3>
                    <Records rows={issue.related_sales} />
                  </section>
                )}
                <section>
                  <h3>Resolution</h3>
                  <p>{issue.resolution_note || "No resolution note yet."}</p>
                  {issue.resolved_by && (
                    <p>
                      Resolved by {issue.resolved_by} · {fmt(issue.resolved_at)}
                    </p>
                  )}
                  {manage && (
                    <Stack spacing={2}>
                      <TextField
                        select
                        label="New status"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                      >
                        {["Open", "Investigating", "Resolved", "Ignored"].map(
                          (s) => (
                            <MenuItem key={s} value={s}>
                              {s}
                            </MenuItem>
                          ),
                        )}
                      </TextField>
                      <TextField
                        label="Resolution / investigation note"
                        required
                        multiline
                        minRows={3}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        slotProps={{ htmlInput: { maxLength: 4000 } }}
                      />
                      {update.isError && (
                        <Alert severity="error">
                          Unable to update. Refresh the issue and try again.
                        </Alert>
                      )}
                      <Button
                        variant="contained"
                        disabled={!note.trim() || update.isPending}
                        onClick={() => update.mutate()}
                      >
                        Update status
                      </Button>
                    </Stack>
                  )}
                </section>
                <section>
                  <h3>Status history</h3>
                  {issue.history.length ? (
                    issue.history.map((h, i) => (
                      <div className="dq-history-entry" key={i}>
                        <strong>
                          {h.previous_status} ? {h.new_status}
                        </strong>
                        <p>{h.note}</p>
                        <small>
                          {h.actor} · {fmt(h.at)}
                        </small>
                      </div>
                    ))
                  ) : (
                    <p>No status changes yet.</p>
                  )}
                </section>
              </Stack>
            )
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
