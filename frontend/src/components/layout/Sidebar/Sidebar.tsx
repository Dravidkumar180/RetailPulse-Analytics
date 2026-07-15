import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import {
  Box,
  Divider,
  Drawer,
  Tooltip,
  Typography,
} from "@mui/material";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import AnalyticsOutlinedIcon from "@mui/icons-material/AnalyticsOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";

import { useAuth } from "../../../hooks/useAuth";

import "./Sidebar.css";

type UserRole = "SUPER_ADMIN" | "COMPANY_ADMIN" | "ANALYST" | "VIEWER";

interface SidebarProps {
  mobileOpen: boolean;
  collapsed: boolean;
  onMobileClose: () => void;
}

interface SidebarMenuItem {
  label: string;
  path: string;
  icon: ReactNode;
  allowedRoles?: UserRole[];
}

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

const Sidebar = ({
  mobileOpen,
  collapsed,
  onMobileClose,
}: SidebarProps) => {
  const { user } = useAuth();

  const visibleMenuItems = menuItems.filter((item) => {
    if (!item.allowedRoles) {
      return true;
    }

    if (!user?.role) {
      return false;
    }

    return item.allowedRoles.includes(user.role);
  });

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

          if (!collapsed) {
            return navigationLink;
          }

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
