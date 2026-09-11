import api from "./axiosInstance";
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
export interface NotificationFilters {
  page?: number;
  page_size?: number;
  status?: string;
  type?: string;
  priority?: string;
  lifecycle?: string;
}
export const listNotifications = async (params: NotificationFilters = {}) => {
  const { data } = await api.get<{ items: Notification[]; total: number }>("/notifications", { params });
  if (!data || !Array.isArray(data.items) || typeof data.total !== "number") {
    throw new Error("The notification API returned an incompatible response.");
  }
  return data;
};
export const getUnreadCount = async () => {
  const { data } = await api.get<{ count: number }>("/notifications/unread-count");
  if (!data || typeof data.count !== "number") {
    throw new Error("The notification count API returned an incompatible response.");
  }
  return data.count;
};
export const readNotification = async (id: string) =>
  (await api.patch<Notification>(`/notifications/${id}/read`)).data;
export const readAllNotifications = async () =>
  (await api.patch("/notifications/read-all")).data;
export const getNotification = async (id: string) =>
  (await api.get<Notification>(`/notifications/${id}`)).data;
export const notificationLabel = (value: string) =>
  value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
