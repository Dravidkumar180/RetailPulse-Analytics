/* Shows the unread count and the company associated with the inbox. */
import type { NotificationsPageState } from "./useNotificationsPage";

type Props = Pick<NotificationsPageState, "inbox" | "user">;

export default function NotificationSummary({ inbox, user }: Props) {
  return (
    <div className="notification-summary">
      <div>
        <strong>{inbox.count.isError ? "?" : (inbox.count.data ?? "?")}</strong>
        <span>Unread notifications</span>
      </div>
      <p>
        Alerts and updates for <b>{user?.company?.name ?? "your company"}</b>
        <br />
        <small>New notifications appear automatically.</small>
      </p>
    </div>
  );
}
