/* Asks for confirmation before deleting old logs and shows any deletion error. */
import {
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import Button from "../../components/common/Button/Button";

type Props = {
  open: boolean;
  failed: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ClearAuditLogsDialog({
  open,
  failed,
  loading,
  onClose,
  onConfirm,
}: Props) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Clear old audit logs?</DialogTitle>
      <DialogContent>
        <Alert severity="warning">
          This permanently deletes audit logs older than 90 days for your
          company. This action cannot be undone. The clearing action itself will
          be recorded.
        </Alert>
        {failed && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Unable to clear old logs.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button color="error" loading={loading} onClick={onConfirm}>
          Clear logs
        </Button>
      </DialogActions>
    </Dialog>
  );
}
