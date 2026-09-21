/* Shows the inbox title and the mark-all-as-read button. */
import { Button } from "@mui/material";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import type { NotificationsPageState } from "./useNotificationsPage";

type Props = Pick<NotificationsPageState, "inbox">;

export default function NotificationsHeader({ inbox }: Props) {
  return (
    <header className="notification-heading">
      <div>
        <span className="notification-eyebrow">YOUR WORKSPACE INBOX</span>
        <h1>
          <NotificationsOutlinedIcon /> Notifications
        </h1>
        <p>
          Stay informed about stock, imports and important business activity.
        </p>
      </div>
      <Button
        variant="contained"
        startIcon={<DoneAllIcon />}
        disabled={!inbox.count.data || inbox.readAll.isPending}
        onClick={() => inbox.readAll.mutate()}
      >
        Mark all as read
      </Button>
    </header>
  );
}
