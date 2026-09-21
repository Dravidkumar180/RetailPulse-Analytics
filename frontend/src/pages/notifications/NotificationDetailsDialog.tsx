/* Shows a selected notification and actions to mark it read or open related activity. */
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
} from "@mui/material";
import { notificationLabel as label } from "../../api/notificationApi";
import type { NotificationsPageState } from "./useNotificationsPage";

type Props = Pick<
  NotificationsPageState,
  "selectedId" | "setParams" | "details" | "item" | "inbox" | "navigate"
>;

export default function NotificationDetailsDialog({
  selectedId,
  setParams,
  details,
  item,
  inbox,
  navigate,
}: Props) {
  return (
    <Dialog
      open={!!selectedId}
      onClose={() => setParams({})}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Notification details</DialogTitle>
      <DialogContent>
        {details.isPending ? (
          <Skeleton height={200} />
        ) : details.isError ? (
          <Alert severity="error">
            This notification could not be loaded.
            <Button onClick={() => details.refetch()}>Retry</Button>
          </Alert>
        ) : (
          item && (
            <>
              <div className="notification-detail-title">
                <h2>{item.title}</h2>
                <Chip label={label(item.priority)} size="small" />
              </div>
              <p>{new Date(item.created_at).toLocaleString()}</p>
              <p>{item.message}</p>
              {item.resolved_at && (
                <Alert severity="success">This alert has been resolved.</Alert>
              )}
              <dl className="notification-details">
                {Object.entries(item.details).map(([key, value]) => (
                  <div key={key}>
                    <dt>{key}</dt>
                    <dd>{String(value)}</dd>
                  </div>
                ))}
              </dl>
              <small>Details reflect the event when it was detected.</small>
            </>
          )
        )}
      </DialogContent>
      <DialogActions>
        {item && !item.is_read && (
          <Button
            disabled={inbox.read.isPending}
            onClick={() => inbox.read.mutate(item.id)}
          >
            Mark as read
          </Button>
        )}
        {item?.path && (
          <Button variant="contained" onClick={() => navigate(item.path!)}>
            {item.resource_type
              ? `View ${item.resource_type}`
              : "View activity"}
          </Button>
        )}
        <Button onClick={() => setParams({})}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
