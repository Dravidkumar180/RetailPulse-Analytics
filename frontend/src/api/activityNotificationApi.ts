import axiosInstance from "./axiosInstance";

export interface ActivityNotification {
  id: string;
  title: string;
  message: string;
  path: string;
  action: string;
  createdAt: string;
}

export const getActivityNotifications = async () =>
  (await axiosInstance.get<ActivityNotification[]>("/notifications")).data;

export const markActivityNotificationRead = async (id: string) => {
  await axiosInstance.patch(`/notifications/${id}/read`);
};

export const clearActivityNotifications = async () => {
  await axiosInstance.delete("/notifications");
};
