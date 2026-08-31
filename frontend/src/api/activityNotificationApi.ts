/* Teaching guide: This file contains activity notification api API requests, response types, and data mapping.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
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
