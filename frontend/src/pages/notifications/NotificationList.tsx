/* Shows inbox rows, loading and error messages, empty results, and pagination. */
import { Alert, Button, Skeleton } from "@mui/material";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import { notificationLabel as label } from "../../api/notificationApi";
import NotificationIcon from "./NotificationIcon";
import { formatNotificationTime } from "./notificationUtils";
import type { NotificationsPageState } from "./useNotificationsPage";

type Props = Pick<
  NotificationsPageState,
  | "inbox"
  | "total"
  | "status"
  | "type"
  | "priority"
  | "user"
  | "open"
  | "page"
  | "setPage"
>;

export default function NotificationList({
  inbox,
  total,
  status,
  type,
  priority,
  user,
  open,
  page,
  setPage,
}: Props) {
  return (
    <>
      {/* Show a retry action if either the inbox or unread-count request fails. */}
      {(inbox.list.isError || inbox.count.isError) && (
        <Alert
          severity="error"
          action={
            <Button
              onClick={() => {
                void inbox.list.refetch();
                void inbox.count.refetch();
              }}
            >
              Retry
            </Button>
          }
        >
          Could not load notifications. Please try again.
        </Alert>
      )}
      {inbox.list.isError || inbox.count.isError ? null : inbox.list
          .isPending || inbox.count.isPending ? (
        <div
          className="notification-loading"
          aria-label="Loading notifications"
        >
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} height={92} />
          ))}
        </div>
      ) : !inbox.list.isError && !total ? (
        <div className="notification-empty">
          <DoneAllIcon />
          <h2>
            {status === "unread" || (status === "all" && !type && !priority)
              ? "You're all caught up."
              : "No matching notifications."}
          </h2>
          <p>
            {user?.role === "VIEWER"
              ? "Your current role has no business alert subscriptions."
              : "No notifications match these filters."}
          </p>
        </div>
      ) : (
        <div>
          {inbox.list.data?.items.map((n) => (
            <button
              className={`notification-row ${n.is_read ? "read" : "unread"}`}
              key={n.id}
              onClick={() => open(n)}
            >
              <span
                className={`notification-type-icon ${n.priority.toLowerCase()}`}
              >
                <NotificationIcon type={n.type} />
              </span>
              <span className="notification-copy">
                <strong>
                  {!n.is_read && <i aria-label="Unread" />}
                  {n.title}
                </strong>
                <span>{n.message}</span>
                <small>
                  {label(n.type)}
                  {n.resource_type && ` ? ${label(n.resource_type)}`}
                  {n.resolved_at && " ? Resolved"}
                </small>
              </span>
              <span className="notification-meta">
                <span
                  className={`notification-priority ${n.priority.toLowerCase()}`}
                >
                  {label(n.priority)}
                </span>
                <time
                  dateTime={n.created_at}
                  title={new Date(n.created_at).toLocaleString()}
                >
                  {formatNotificationTime(n.created_at)}
                </time>
                <small>{n.is_read ? "Read" : "Unread"}</small>
              </span>
            </button>
          ))}
        </div>
      )}
      {inbox.list.isSuccess && inbox.count.isSuccess && (
        <footer className="notification-pagination">
          <span>{total} matching notifications</span>
          <div>
            <Button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span>
              Page {page} of {Math.max(1, Math.ceil(total / 10))}
            </span>
            <Button
              disabled={page * 10 >= total}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </footer>
      )}
    </>
  );
}
