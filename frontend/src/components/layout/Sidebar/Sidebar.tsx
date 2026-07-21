/* Teaching guide: This file contains the sidebar user interface.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Imports the needed tools from react.
import type { ReactNode } from "react";
// Imports the needed tools from react-router-dom.
import { NavLink } from "react-router-dom";
import {
  Box,
  Divider,
  Drawer,
  Tooltip,
  Typography,
} from "@mui/material";
// Imports the needed tools from @mui/icons-material/DashboardOutlined.
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
// Imports the needed tools from @mui/icons-material/Inventory2Outlined.
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
// Imports the needed tools from @mui/icons-material/PointOfSaleOutlined.
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
// Imports the needed tools from @mui/icons-material/AssessmentOutlined.
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
// Imports the needed tools from @mui/icons-material/AnalyticsOutlined.
import AnalyticsOutlinedIcon from "@mui/icons-material/AnalyticsOutlined";
// Imports the needed tools from @mui/icons-material/PeopleOutlined.
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutlined";
// Imports the needed tools from @mui/icons-material/PersonOutlined.
import PersonOutlineIcon from "@mui/icons-material/PersonOutlined";
// Imports the needed tools from @mui/icons-material/HistoryOutlined.
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
// Imports the needed tools from @mui/icons-material/SettingsOutlined.
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
// Imports the needed tools from @mui/icons-material/BusinessOutlined.
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
// Imports the needed tools from @mui/icons-material/BarChartOutlined.
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";

// Imports the needed tools from ../../../hooks/useAuth.
import { useAuth } from "../../../hooks/useAuth";

// Loads ./Sidebar.css styles or setup.
import "./Sidebar.css";

// Defines the user role type.
type UserRole = "SUPER_ADMIN" | "COMPANY_ADMIN" | "ANALYST" | "VIEWER";

// Defines the fields allowed in sidebar props.
interface SidebarProps {
  mobileOpen: boolean;
  collapsed: boolean;
  onMobileClose: () => void;
}

// Defines the fields allowed in sidebar menu item.
interface SidebarMenuItem {
  label: string;
  path: string;
  icon: ReactNode;
  allowedRoles?: UserRole[];
}

// Stores menu items for the steps below.
const menuItems: SidebarMenuItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: <DashboardOutlinedIcon />,
  },
  {
    label: "Products",
    path: "/products",
    icon: <Inventory2OutlinedIcon />,
    allowedRoles: [
      "SUPER_ADMIN",
      "COMPANY_ADMIN",
    ],
  },
  {
    label: "Categories",
    path: "/categories",
    icon: <BusinessOutlinedIcon />,
    allowedRoles: ["SUPER_ADMIN", "COMPANY_ADMIN"],
  },
  {
    label: "Sales",
    path: "/sales",
    icon: <PointOfSaleOutlinedIcon />,
    allowedRoles: [
      "SUPER_ADMIN",
      "COMPANY_ADMIN",
      "ANALYST",
      "VIEWER",
    ],
  },
  {
    label: "Analytics",
    path: "/analytics",
    icon: <AnalyticsOutlinedIcon />,
    allowedRoles: [
      "SUPER_ADMIN",
      "COMPANY_ADMIN",
      "ANALYST",
      "VIEWER",
    ],
  },
  {
    label: "Reports",
    path: "/reports",
    icon: <AssessmentOutlinedIcon />,
    allowedRoles: [
      "SUPER_ADMIN",
      "COMPANY_ADMIN",
      "ANALYST",
      "VIEWER",
    ],
  },
  {
    label: "Companies",
    path: "/companies",
    icon: <BusinessOutlinedIcon />,
    allowedRoles: ["SUPER_ADMIN"],
  },
  {
    label: "Users",
    path: "/users",
    icon: <PeopleOutlineIcon />,
    allowedRoles: ["SUPER_ADMIN", "COMPANY_ADMIN"],
  },
  {
    label: "Audit Logs",
    path: "/audit-logs",
    icon: <HistoryOutlinedIcon />,
    allowedRoles: ["SUPER_ADMIN", "COMPANY_ADMIN"],
  },
  {
    label: "Profile",
    path: "/profile",
    icon: <PersonOutlineIcon />,
  },
  {
    label: "Settings",
    path: "/settings",
    icon: <SettingsOutlinedIcon />,
    allowedRoles: ["SUPER_ADMIN", "COMPANY_ADMIN"],
  },
];

// Shows the sidebar.
const Sidebar = ({
  mobileOpen,
  collapsed,
  onMobileClose,
}: SidebarProps) => {
  const { user } = useAuth();

  // Runs visible menu items logic.
  const visibleMenuItems = menuItems.filter((item) => {
    // Checks whether this condition is true.
    if (!item.allowedRoles) {
      // Returns the completed result to the caller.
      return true;
    }

    // Checks whether this condition is true.
    if (!user?.role) {
      // Returns the completed result to the caller.
      return false;
    }

    // Returns the completed result to the caller.
    return item.allowedRoles.includes(user.role);
  });

  // Stores sidebar content for the steps below.
  const sidebarContent = (
    <Box
      className={`sidebar ${
        collapsed ? "sidebar--collapsed" : ""
      }`}
    >
      <Box className="sidebar__brand">
        <Box className="sidebar__brand-icon">
          <BarChartOutlinedIcon />
        </Box>

        {!collapsed && (
          <Box className="sidebar__brand-text">
            <Typography component="h1">RetailPulse</Typography>
            <Typography component="p">Analytics</Typography>
          </Box>
        )}
      </Box>

      <Divider className="sidebar__divider" />

      {!collapsed && (
        <Typography component="p" className="sidebar__section-title">
          Main Menu
        </Typography>
      )}

      <Box component="nav" className="sidebar__navigation">
        {visibleMenuItems.map((item) => {
          // Runs navigation link logic.
          const navigationLink = (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onMobileClose}
              className={({ isActive }) =>
                `sidebar__link ${
                  isActive ? "sidebar__link--active" : ""
                }`
              }
            >
              <Box className="sidebar__link-icon">{item.icon}</Box>

              {!collapsed && (
                <Typography
                  component="span"
                  className="sidebar__link-label"
                >
                  {item.label}
                </Typography>
              )}
            </NavLink>
          );

          // Checks whether this condition is true.
          if (!collapsed) {
            // Returns the completed result to the caller.
            return navigationLink;
          }

          // Builds the visible interface below.
          return (
            <Tooltip
              key={item.path}
              title={item.label}
              placement="right"
              arrow
            >
              {navigationLink}
            </Tooltip>
          );
        })}
      </Box>

      <Box className="sidebar__company">
        {!collapsed ? (
          <>
            <Typography
              component="p"
              className="sidebar__company-label"
            >
              Current Company
            </Typography>

            <Typography
              component="p"
              className="sidebar__company-name"
              title={user?.company?.name}
            >
              {user?.company?.name ?? "RetailPulse Company"}
            </Typography>
          </>
        ) : (
          <Tooltip
            title={user?.company?.name ?? "Current company"}
            placement="right"
          >
            <Box className="sidebar__company-icon">
              <BusinessOutlinedIcon />
            </Box>
          </Tooltip>
        )}
      </Box>
    </Box>
  );

  // Builds the visible interface below.
  return (
    <>
      <Box className="sidebar__desktop-container">
        {sidebarContent}
      </Box>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{
          keepMounted: true,
        }}
        className="sidebar__mobile-drawer"
      >
        {sidebarContent}
      </Drawer>
    </>
  );
};

export default Sidebar;
