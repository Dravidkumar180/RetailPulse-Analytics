# Notifications page

Start with `NotificationsPage.tsx`. It assembles the page and connects the components below to the page hook.

| File | Purpose |
| --- | --- |
| `NotificationsHeader.tsx` | Page title and the mark-all-as-read action. |
| `NotificationSummary.tsx` | Unread count and company information. |
| `NotificationFilters.tsx` | Read-status tabs, type/priority/lifecycle filters, and reset button. |
| `NotificationList.tsx` | Notification rows, loading/error/empty states, retry, and pagination. |
| `NotificationDetailsDialog.tsx` | Selected notification details, mark-as-read action, and link to related activity. |
| `NotificationIcon.tsx` | Selects an icon based on the notification type. |
| `useNotificationsPage.ts` | Filter state, URL selection, detail query, navigation, and automatic read marking. |
| `notificationConstants.ts` | Notification types available in the filter. |
| `notificationUtils.ts` | Relative time formatting for notification rows. |
| `NotificationsPage.css` | Styles shared by the page and its components. |

`NotificationsPage` calls `useNotificationsPage` once and passes its state and handlers to the display components. Each component lists its required fields using `Pick<NotificationsPageState, ...>`.

The existing `../../hooks/useNotifications.ts` continues to fetch the inbox and unread count, refresh them automatically, and manage read mutations. API calls and notification types remain in `../../api/notificationApi.ts`.

Opening a notification sets the `notification` URL parameter and marks the notification as read. Closing the details dialog clears the selection. Changing a filter resets pagination to the first page.
