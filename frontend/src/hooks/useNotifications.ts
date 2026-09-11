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
  const key = ["notifications", user?.companyId, user?.id, user?.role];
  const list = useQuery({
    queryKey: [...key, "list", filters],
    queryFn: () => listNotifications(filters),
    enabled: !!user,
    refetchInterval: 15000,
  });
  const count = useQuery({
    queryKey: [...key, "count"],
    queryFn: getUnreadCount,
    enabled: !!user,
    refetchInterval: 15000,
  });
  const refresh = () => client.invalidateQueries({ queryKey: key });
  const onError = () =>
    toast.error("Could not update notifications. Please try again.");
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
