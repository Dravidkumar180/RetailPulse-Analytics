/* Confirms schedule deletion while keeping previously generated reports available. */
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import type { ReportsState } from "./useReports";

type Props = Pick<
  ReportsState,
  "busy" | "deleteId" | "setDeleteId" | "deleteSchedule"
>;

export default function DeleteScheduleDialog({
  busy,
  deleteId,
  setDeleteId,
  deleteSchedule,
}: Props) {
  return (
    <Dialog open={!!deleteId} onClose={() => setDeleteId(undefined)}>
      <DialogTitle>Delete this schedule?</DialogTitle>
      <DialogContent>
        Future deliveries will stop. Previously generated reports remain in
        History.
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDeleteId(undefined)}>Cancel</Button>
        <Button color="error" disabled={busy} onClick={deleteSchedule}>
          Delete schedule
        </Button>
      </DialogActions>
    </Dialog>
  );
}
