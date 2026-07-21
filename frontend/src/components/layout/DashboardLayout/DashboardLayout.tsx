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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// Imports Inventory notification requests for the shared navbar bell.
import {
  clearInventoryNotifications,
  getInventoryNotifications,
} from "../../../api/inventoryApi";
import { useAuth } from "../../../hooks/useAuth";

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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem("retailpulse-theme") === "dark",
  );
  const [notifications, setNotifications] = useState<DashboardNotification[]>(
    [],
  );
  /* =======================================================
   * Inventory Management notifications
   * ======================================================= */

  // Inventory alerts are visible only to Company Admins and Super Admins.
  const canSeeInventoryNotifications =
    user?.role === "SUPER_ADMIN" || user?.role === "COMPANY_ADMIN";
  // Poll the backend so new low-stock and out-of-stock alerts reach the bell.
  const inventoryNotifications = useQuery({
    queryKey: ["inventory-notifications"],
    queryFn: getInventoryNotifications,
    enabled: canSeeInventoryNotifications,
    refetchInterval: 30000,
  });
  // Mark all Inventory notifications as read on the backend.
  const clearNotificationsMutation = useMutation({
    mutationFn: clearInventoryNotifications,
    onSuccess: () => queryClient.setQueryData(["inventory-notifications"], []),
  });
  // Merge persistent Inventory alerts with local dashboard notifications.
  const visibleNotifications: DashboardNotification[] = [
    ...(inventoryNotifications.data ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      message: item.message,
      path: "/inventory",
    })),
    ...notifications,
  ];

  useEffect(() => {
    document.body.classList.toggle("dark-theme", isDarkMode);
    localStorage.setItem("retailpulse-theme", isDarkMode ? "dark" : "light");

    // Builds the visible interface below.
    return () => document.body.classList.remove("dark-theme");
  }, [isDarkMode]);

  useEffect(() => {
    // Handles page change.
    const handlePageChange = (event: Event) => {
      // Runs detail logic.
      const detail = (event as CustomEvent<Omit<DashboardNotification, "id">>)
        .detail;

      // Updates the page or stored state with this result.
      setNotifications((current) => [
        { ...detail, id: `${Date.now()}-${detail.path}` },
        ...current,
      ]);
    };

    window.addEventListener("retailpulse:notification", handlePageChange);
    // Builds the visible interface below.
    return () =>
      window.removeEventListener("retailpulse:notification", handlePageChange);
  }, []);

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
          onClearNotifications={() => {
            setNotifications([]);
            if (canSeeInventoryNotifications)
              clearNotificationsMutation.mutate();
          }}
          onReviewNotification={(id) =>
            // Updates the page or stored state with this result.
            setNotifications((current) =>
              current.filter((notification) => notification.id !== id),
            )
          }
        />

        <Box component="main" className="dashboard-layout__content">
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
