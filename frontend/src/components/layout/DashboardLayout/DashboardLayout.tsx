import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";

import Navbar from "../Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";

import "./DashboardLayout.css";

export interface DashboardNotification {
  id: string;
  title: string;
  message: string;
  path: string;
}

const DashboardLayout = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] =
    useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] =
    useState(false);
  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem("retailpulse-theme") === "dark",
  );
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);

  useEffect(() => {
    document.body.classList.toggle("dark-theme", isDarkMode);
    localStorage.setItem("retailpulse-theme", isDarkMode ? "dark" : "light");

    return () => document.body.classList.remove("dark-theme");
  }, [isDarkMode]);

  useEffect(() => {
    const handlePageChange = (event: Event) => {
      const detail = (event as CustomEvent<Omit<DashboardNotification, "id">>).detail;

      setNotifications((current) => [
        { ...detail, id: `${Date.now()}-${detail.path}` },
        ...current,
      ]);
    };

    window.addEventListener("retailpulse:notification", handlePageChange);
    return () => window.removeEventListener("retailpulse:notification", handlePageChange);
  }, []);

  const handleOpenMobileSidebar = () => {
    setIsMobileSidebarOpen(true);
  };

  const handleCloseMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((currentValue) => !currentValue);
  };

  return (
    <Box
      className={`dashboard-layout ${
        isSidebarCollapsed
          ? "dashboard-layout--sidebar-collapsed"
          : ""
      } ${isDarkMode ? "dashboard-layout--dark" : ""}`}
    >
      <Sidebar
        mobileOpen={isMobileSidebarOpen}
        collapsed={isSidebarCollapsed}
        onMobileClose={handleCloseMobileSidebar}
      />

      <Box className="dashboard-layout__main">
        <Navbar
          sidebarCollapsed={isSidebarCollapsed}
          onOpenMobileSidebar={handleOpenMobileSidebar}
          onToggleSidebar={handleToggleSidebar}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode((current) => !current)}
          notifications={notifications}
          onClearNotifications={() => setNotifications([])}
          onReviewNotification={(id) =>
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
