/* Keeps inbox filters, URL selection, detail loading, and read actions together. */
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useNotifications } from "../../hooks/useNotifications";
import { useAuth } from "../../hooks/useAuth";
import { getNotification, type Notification } from "../../api/notificationApi";

export function useNotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  // Store the current filter choices and page number.
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("");
  const [priority, setPriority] = useState("");
  const [lifecycle, setLifecycle] = useState("active");
  const [page, setPage] = useState(1);
  const inbox = useNotifications({
    status,
    type: type || undefined,
    priority: priority || undefined,
    lifecycle,
    page,
    page_size: 10,
  });
  // Use the URL parameter so a notification can be opened through a direct link.
  const selectedId = params.get("notification");
  // Remember which notification already triggered an automatic read request.
  const attemptedRead = useRef<string | null>(null);
  // Fetch full details only when the URL contains a notification ID.
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
  // Mark an unread notification as read when its details arrive.
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
  // Open a row in the details dialog and mark it read immediately.
  const open = (item: Notification) => {
    setParams({ notification: item.id });
    if (!item.is_read) {
      attemptedRead.current = item.id;
      inbox.read.mutate(item.id);
    }
  };
  // Return to page one whenever a filter changes.
  const change = (setter: (s: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };
  const total = inbox.list.data?.total ?? 0;
  const item = details.data;
  return {
    user,
    navigate,
    setParams,
    status,
    setStatus,
    type,
    setType,
    priority,
    setPriority,
    lifecycle,
    setLifecycle,
    page,
    setPage,
    inbox,
    selectedId,
    details,
    open,
    change,
    total,
    item,
  };
}

export type NotificationsPageState = ReturnType<typeof useNotificationsPage>;
