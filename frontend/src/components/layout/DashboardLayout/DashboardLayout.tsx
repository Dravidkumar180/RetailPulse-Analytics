/* Teaching guide: This file contains the dashboard layout user interface.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Imports the needed tools from react.
import { useEffect, useState } from "react";
// Imports the needed tools from react-router-dom.
import { Outlet } from "react-router-dom";
// Imports the needed tools from @mui/material.
import { Box } from "@mui/material";
import { useNotifications } from "../../../hooks/useNotifications";

// Imports the needed tools from ../Navbar/Navbar.
import Navbar from "../Navbar/Navbar";
// Imports the needed tools from ../Sidebar/Sidebar.
import Sidebar from "../Sidebar/Sidebar";

// Loads ./DashboardLayout.css styles or setup.
import "./DashboardLayout.css";

// Defines the fields allowed in dashboard notification.
export interface DashboardNotification {
  id: string;
  title: string;
  message: string;
  path: string;
}

// Shows the dashboard layout.
const DashboardLayout = () => {
  const inbox = useNotifications({ status: "unread", page_size: 5 });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem("retailpulse-theme") === "dark",
  );
  const visibleNotifications = (inbox.list.data?.items ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    message: item.message,
    path: `/notifications?notification=${item.id}`,
  }));

  useEffect(() => {
    document.body.classList.toggle("dark-theme", isDarkMode);
    localStorage.setItem("retailpulse-theme", isDarkMode ? "dark" : "light");

    // Builds the visible interface below.
    return () => document.body.classList.remove("dark-theme");
  }, [isDarkMode]);

  // Handles open mobile sidebar.
  const handleOpenMobileSidebar = () => {
    // Updates the page or stored state with this result.
    setIsMobileSidebarOpen(true);
  };

  // Handles close mobile sidebar.
  const handleCloseMobileSidebar = () => {
    // Updates the page or stored state with this result.
    setIsMobileSidebarOpen(false);
  };

  // Handles toggle sidebar.
  const handleToggleSidebar = () => {
    // Updates the page or stored state with this result.
    setIsSidebarCollapsed((currentValue) => !currentValue);
  };

  // Builds the visible interface below.
  return (
    <Box
      className={`dashboard-layout ${
        isSidebarCollapsed ? "dashboard-layout--sidebar-collapsed" : ""
      } ${isDarkMode ? "dashboard-layout--dark" : ""}`}
    >
      <Sidebar
        mobileOpen={isMobileSidebarOpen}
        collapsed={isSidebarCollapsed}
        onMobileClose={handleCloseMobileSidebar}
      />

      <Box className="dashboard-layout__main">
        {/* Navbar receives persistent Inventory alerts and clear behavior. */}
        <Navbar
          sidebarCollapsed={isSidebarCollapsed}
          onOpenMobileSidebar={handleOpenMobileSidebar}
          onToggleSidebar={handleToggleSidebar}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode((current) => !current)}
          notifications={visibleNotifications}
          unreadCount={inbox.count.data ?? 0}
          notificationError={inbox.list.isError || inbox.count.isError}
          notificationLoading={inbox.list.isPending}
          onClearNotifications={() => inbox.readAll.mutate()}
          onReviewNotification={(id) => inbox.read.mutate(id)}
        />

        <Box component="main" className="dashboard-layout__content">
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
