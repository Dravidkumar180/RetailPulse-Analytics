/* Loads the inbox and unread count, and marks notifications as read. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuth } from "./useAuth";
import {
  getUnreadCount,
  listNotifications,
  readAllNotifications,
  readNotification,
  type NotificationFilters,
} from "../api/notificationApi";
export function useNotifications(filters: NotificationFilters = {}) {
  const { user } = useAuth();
  const client = useQueryClient();
  // Keep cached notifications separate for each company, user, and role.
  const key = ["notifications", user?.companyId, user?.id, user?.role];
  // Refresh the current inbox page every 15 seconds while the user is signed in.
  const list = useQuery({
    queryKey: [...key, "list", filters],
    queryFn: () => listNotifications(filters),
    enabled: !!user,
    refetchInterval: 15000,
  });
  // Load the unread total separately so it is not limited to the current page.
  const count = useQuery({
    queryKey: [...key, "count"],
    queryFn: getUnreadCount,
    enabled: !!user,
    refetchInterval: 15000,
  });
  // Reload notification queries after a successful read action.
  const refresh = () => client.invalidateQueries({ queryKey: key });
  const onError = () =>
    toast.error("Could not update notifications. Please try again.");
  // These mutations update the server; failures show a toast message.
  const read = useMutation({
    mutationFn: readNotification,
    onSuccess: refresh,
    onError,
  });
  const readAll = useMutation({
    mutationFn: readAllNotifications,
    onSuccess: refresh,
    onError,
  });
  return { list, count, read, readAll };
}
