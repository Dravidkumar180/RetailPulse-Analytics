/* Filters the inbox by read status, type, priority, and lifecycle. */
import { Button } from "@mui/material";
import { notificationLabel as label } from "../../api/notificationApi";
import { notificationTypes } from "./notificationConstants";
import type { NotificationsPageState } from "./useNotificationsPage";

type Props = Pick<
  NotificationsPageState,
  | "status"
  | "setStatus"
  | "type"
  | "setType"
  | "priority"
  | "setPriority"
  | "lifecycle"
  | "setLifecycle"
  | "setPage"
  | "change"
>;

export default function NotificationFilters({
  status,
  setStatus,
  type,
  setType,
  priority,
  setPriority,
  lifecycle,
  setLifecycle,
  setPage,
  change,
}: Props) {
  return (
    <>
      {/* Read-status tabs share the same filter-change handler as the dropdowns. */}
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
            {notificationTypes.map((t) => (
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
    </>
  );
}
