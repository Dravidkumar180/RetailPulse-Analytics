// Individual reconciliation results and failed checks.
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { fmt, badge } from "./dataQualityFormat";
import type { DataQualityPageState } from "./useDataQualityPage";

type Props = Pick<DataQualityPageState, "selectedRun" | "setSelectedRun">;

export default function ExecutionDetailsDialog({
  selectedRun,
  setSelectedRun,
}: Props) {
  return (
    <>
      <Dialog
        open={!!selectedRun}
        onClose={() => setSelectedRun(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Execution details</DialogTitle>
        <DialogContent dividers>
          {selectedRun && (
            <>
              <p>RC-{selectedRun.id}</p>
              {badge(selectedRun.status)}
              <p>
                {selectedRun.trigger} · {selectedRun.triggered_by}
              </p>
              <p>
                {fmt(selectedRun.started_at)} – {fmt(selectedRun.completed_at)}
              </p>
              {selectedRun.checks.map((c) => (
                <p key={c.name}>
                  {c.name}: {c.issues} issues
                </p>
              ))}
              {selectedRun.failed_checks.map((f, i) => (
                <Alert key={i} severity="error">
                  {f.message}
                </Alert>
              ))}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedRun(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
