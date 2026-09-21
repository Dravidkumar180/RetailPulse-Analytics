/* Connects inbox state to the header, filters, list, and details dialog. */
import { Box } from "@mui/material";
import NotificationsHeader from "./NotificationsHeader";
import NotificationSummary from "./NotificationSummary";
import NotificationFilters from "./NotificationFilters";
import NotificationList from "./NotificationList";
import NotificationDetailsDialog from "./NotificationDetailsDialog";
import { useNotificationsPage } from "./useNotificationsPage";
import "./NotificationsPage.css";

export default function NotificationsPage() {
  const notifications = useNotificationsPage();

  return (
    <Box className="notification-center">
      <NotificationsHeader {...notifications} />
      <NotificationSummary {...notifications} />
      <section className="notification-panel" aria-label="Notification center">
        <NotificationFilters {...notifications} />
        <NotificationList {...notifications} />
      </section>
      <NotificationDetailsDialog {...notifications} />
    </Box>
  );
}
