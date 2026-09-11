import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
} from "@mui/material";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import { useNotifications } from "../../hooks/useNotifications";
import { useAuth } from "../../hooks/useAuth";
import {
  getNotification,
  notificationLabel as label,
  type Notification,
} from "../../api/notificationApi";
import "./NotificationsPage.css";
const types = [
  "OUT_OF_STOCK",
  "STOCKOUT_RISK",
  "LOW_STOCK",
  "OVERSTOCK",
  "IMPORT_COMPLETED",
  "IMPORT_COMPLETED_WITH_ERRORS",
  "IMPORT_FAILED",
  "SALES_ALERT",
  "SYSTEM_ALERT",
];
const icon = (type: string) =>
  type.startsWith("IMPORT") ? (
    <CloudUploadOutlinedIcon />
  ) : type === "SALES_ALERT" ? (
    <ShoppingCartOutlinedIcon />
  ) : type === "SYSTEM_ALERT" ? (
    <SettingsOutlinedIcon />
  ) : (
    <Inventory2OutlinedIcon />
  );
const time = (date: string) => {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - Date.parse(date)) / 60000),
  );
  return minutes < 1
    ? "Just now"
    : minutes < 60
      ? `${minutes} minutes ago`
      : minutes < 1440
        ? `${Math.floor(minutes / 60)} hours ago`
        : new Date(date).toLocaleDateString();
};
export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState("all"),
    [type, setType] = useState(""),
    [priority, setPriority] = useState(""),
    [lifecycle, setLifecycle] = useState("active"),
    [page, setPage] = useState(1);
  const inbox = useNotifications({
    status,
    type: type || undefined,
    priority: priority || undefined,
    lifecycle,
    page,
    page_size: 10,
  });
  const selectedId = params.get("notification");
  const attemptedRead = useRef<string | null>(null);
  const details = useQuery({
    queryKey: [
      "notifications",
      user?.companyId,
      user?.id,
      user?.role,
      "detail",
      selectedId,
    ],
    queryFn: () => getNotification(selectedId!),
    enabled: !!selectedId,
  });
  useEffect(() => {
    if (!selectedId) attemptedRead.current = null;
    if (
      details.data &&
      !details.data.is_read &&
      attemptedRead.current !== selectedId
    ) {
      attemptedRead.current = selectedId;
      inbox.read.mutate(details.data.id);
    }
  }, [selectedId, details.data, inbox.read]);
  const open = (item: Notification) => {
    setParams({ notification: item.id });
    if (!item.is_read) {
      attemptedRead.current = item.id;
      inbox.read.mutate(item.id);
    }
  };
  const change = (setter: (s: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };
  const total = inbox.list.data?.total ?? 0;
  const item = details.data;
  return (
    <Box className="notification-center">
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
      <div className="notification-summary">
        <div>
          <strong>
            {inbox.count.isError ? "?" : (inbox.count.data ?? "?")}
          </strong>
          <span>Unread notifications</span>
        </div>
        <p>
          Alerts and updates for <b>{user?.company?.name ?? "your company"}</b>
          <br />
          <small>New notifications appear automatically.</small>
        </p>
      </div>
      <section className="notification-panel" aria-label="Notification center">
        <div className="notification-tabs" role="tablist">
          {["all", "unread", "read"].map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={status === s}
              className={status === s ? "selected" : ""}
              onClick={() => change(setStatus, s)}
            >
              {label(s)}
            </button>
          ))}
        </div>
        <div className="notification-filters">
          <label>
            Type
            <select
              value={type}
              onChange={(e) => change(setType, e.target.value)}
            >
              <option value="">All types</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {label(t)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Priority
            <select
              value={priority}
              onChange={(e) => change(setPriority, e.target.value)}
            >
              <option value="">All priorities</option>
              {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            Lifecycle
            <select
              value={lifecycle}
              onChange={(e) => change(setLifecycle, e.target.value)}
            >
              <option value="active">Active</option>
              <option value="resolved">Resolved / expired</option>
              <option value="all">All history</option>
            </select>
          </label>
          <Button
            onClick={() => {
              setType("");
              setPriority("");
              setStatus("all");
              setLifecycle("active");
              setPage(1);
            }}
          >
            Reset filters
          </Button>
        </div>
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
        {inbox.list.isError || inbox.count.isError ? null : inbox.list.isPending || inbox.count.isPending ? (
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
                  {icon(n.type)}
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
                    {time(n.created_at)}
                  </time>
                  <small>{n.is_read ? "Read" : "Unread"}</small>
                </span>
              </button>
            ))}
          </div>
        )}
        {inbox.list.isSuccess && inbox.count.isSuccess && <footer className="notification-pagination">
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
        </footer>}
      </section>
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
                  <Alert severity="success">
                    This alert has been resolved.
                  </Alert>
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
    </Box>
  );
}
