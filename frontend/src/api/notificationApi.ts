/* Sends notification requests to the server and defines the data returned to the inbox. */
import api from "./axiosInstance";
// The fields returned for one inbox notification.
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  resource_type: string | null;
  resource_id: string | null;
  path: string | null;
  details: Record<string, string | number>;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
  resolved_at: string | null;
  expires_at: string | null;
}
// Optional values sent to the server to narrow the inbox results.
export interface NotificationFilters {
  page?: number;
  page_size?: number;
  status?: string;
  type?: string;
  priority?: string;
  lifecycle?: string;
}
// Load one page and reject responses that do not contain a usable list.
export const listNotifications = async (params: NotificationFilters = {}) => {
  const { data } = await api.get<{ items: Notification[]; total: number }>("/notifications", { params });
  if (!data || !Array.isArray(data.items) || typeof data.total !== "number") {
    throw new Error("The notification API returned an incompatible response.");
  }
  return data;
};
// Read the unread total used by the inbox badge.
export const getUnreadCount = async () => {
  const { data } = await api.get<{ count: number }>("/notifications/unread-count");
  if (!data || typeof data.count !== "number") {
    throw new Error("The notification count API returned an incompatible response.");
  }
  return data.count;
};
// Mark one notification as read on the server.
export const readNotification = async (id: string) =>
  (await api.patch<Notification>(`/notifications/${id}/read`)).data;
// Mark all notifications available to the current user as read.
export const readAllNotifications = async () =>
  (await api.patch("/notifications/read-all")).data;
// Load the full details for a selected notification.
export const getNotification = async (id: string) =>
  (await api.get<Notification>(`/notifications/${id}`)).data;
// Turn codes such as LOW_STOCK into readable labels such as Low Stock.
export const notificationLabel = (value: string) =>
  value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
