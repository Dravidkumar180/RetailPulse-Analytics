/* Teaching guide: This file contains the navbar user interface.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Imports the needed tools from react.
import { useState } from "react";
// Imports the needed tools from react-router-dom.
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Badge,
  Box,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";
// Imports the needed tools from @mui/icons-material/MenuOutlined.
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
// Imports the needed tools from @mui/icons-material/MenuOpenOutlined.
import MenuOpenOutlinedIcon from "@mui/icons-material/MenuOpenOutlined";
// Imports the needed tools from @mui/icons-material/NotificationsNoneOutlined.
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
// Imports the needed tools from @mui/icons-material/PersonOutlined.
import PersonOutlineIcon from "@mui/icons-material/PersonOutlined";
// Imports the needed tools from @mui/icons-material/LogoutOutlined.
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
// Imports the needed tools from @mui/icons-material/SettingsOutlined.
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
// Imports the needed tools from @mui/icons-material/KeyboardArrowDownOutlined.
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";
// Imports the needed tools from @mui/icons-material/SearchOutlined.
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
// Imports the needed tools from @mui/icons-material/AssessmentOutlined.
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
// Imports the needed tools from @mui/icons-material/DarkModeOutlined.
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
// Imports the needed tools from @mui/icons-material/LightModeOutlined.
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
// Imports the needed tools from ../DashboardLayout/DashboardLayout.
import type { DashboardNotification } from "../DashboardLayout/DashboardLayout";

// Imports the needed tools from ../../../hooks/useAuth.
import { useAuth } from "../../../hooks/useAuth";

// Loads ./Navbar.css styles or setup.
import "./Navbar.css";

// Defines the fields allowed in navbar props.
interface NavbarProps {
  sidebarCollapsed: boolean;
  onOpenMobileSidebar: () => void;
  onToggleSidebar: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  notifications: DashboardNotification[];
  onClearNotifications: () => void;
  onReviewNotification: (id: string) => void;
}

// Gets initials.
const getInitials = (name?: string): string => {
  // Checks whether this condition is true.
  if (!name) {
    // Returns the completed result to the caller.
    return "U";
  }

  // Returns the completed result to the caller.
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

// Runs format role logic.
const formatRole = (role?: string): string => {
  // Checks whether this condition is true.
  if (!role) {
    // Returns the completed result to the caller.
    return "";
  }

  // Returns the completed result to the caller.
  return role
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

// Stores navbar for the steps below.
const Navbar = ({
  sidebarCollapsed,
  onOpenMobileSidebar,
  onToggleSidebar,
  isDarkMode,
  onToggleTheme,
  notifications,
  onClearNotifications,
  onReviewNotification,
}: NavbarProps) => {
  // Stores navigate for the steps below.
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [profileAnchorElement, setProfileAnchorElement] =
    useState<null | HTMLElement>(null);
  const [notificationAnchorElement, setNotificationAnchorElement] =
    useState<null | HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Stores searchable pages for the steps below.
  const searchablePages = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Products", path: "/products" },
    { label: "Categories", path: "/categories" },
    { label: "Sales", path: "/sales" },
    // Makes the Inventory Management page available through global page search.
    { label: "Inventory", path: "/inventory" },
    { label: "Analytics", path: "/analytics" },
    { label: "Reports", path: "/reports" },
    { label: "Users", path: "/users" },
    { label: "Audit Logs", path: "/audit-logs" },
    { label: "Profile", path: "/profile" },
    { label: "Settings", path: "/settings" },
  ];
  // Runs search results logic.
  const searchResults = searchQuery.trim()
    ? searchablePages.filter((page) =>
        page.label.toLowerCase().includes(searchQuery.trim().toLowerCase()),
      )
    : [];

  // Checks profile menu open.
  const isProfileMenuOpen = Boolean(profileAnchorElement);

  // Handles open profile menu.
  const handleOpenProfileMenu = (event: React.MouseEvent<HTMLElement>) => {
    // Updates the page or stored state with this result.
    setProfileAnchorElement(event.currentTarget);
  };

  // Handles close profile menu.
  const handleCloseProfileMenu = () => {
    // Updates the page or stored state with this result.
    setProfileAnchorElement(null);
  };

  // Handles navigate.
  const handleNavigate = (path: string) => {
    handleCloseProfileMenu();
    // Updates the page or stored state with this result.
    navigate(path);
  };

  // Handles logout.
  const handleLogout = async () => {
    handleCloseProfileMenu();

    // Tries the operation and watches for errors.
    try {
      // Waits for this asynchronous work to finish.
      await logout();
    } finally {
      // Updates the page or stored state with this result.
      navigate("/login", {
        replace: true,
      });
    }
  };

  // Builds the visible interface below.
  return (
    <Box component="header" className="navbar">
      <Box className="navbar__left">
        <Tooltip
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <IconButton
            className="navbar__desktop-menu-button"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? <MenuOutlinedIcon /> : <MenuOpenOutlinedIcon />}
          </IconButton>
        </Tooltip>

        <IconButton
          className="navbar__mobile-menu-button"
          onClick={onOpenMobileSidebar}
          aria-label="Open sidebar"
        >
          <MenuOutlinedIcon />
        </IconButton>

        <Box className="navbar__page-title">
          <Typography component="h2">RetailPulse Analytics</Typography>

          <Typography component="p">
            {user?.company?.name ?? "Company dashboard"}
          </Typography>
        </Box>

        <Box className="navbar__search">
          <Box className="navbar__search-field">
            <SearchOutlinedIcon />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search pages..."
              aria-label="Search pages"
            />
          </Box>
          {searchResults.length > 0 && (
            <Box className="navbar__search-results">
              {searchResults.map((result) => (
                <Box
                  component="button"
                  key={result.path}
                  onClick={() => {
                    // Updates the page or stored state with this result.
                    navigate(result.path);
                    // Updates the page or stored state with this result.
                    setSearchQuery("");
                  }}
                >
                  <SearchOutlinedIcon />
                  {result.label}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      <Box className="navbar__right">
        <Tooltip
          title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          <IconButton
            className="navbar__theme-button"
            aria-label={
              isDarkMode ? "Switch to light mode" : "Switch to dark mode"
            }
            onClick={onToggleTheme}
          >
            {isDarkMode ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
          </IconButton>
        </Tooltip>

        <Tooltip title="Notifications">
          <IconButton
            className="navbar__notification-button"
            aria-label="Notifications"
            onClick={(event) =>
              setNotificationAnchorElement(event.currentTarget)
            }
          >
            <Badge badgeContent={notifications.length} color="error">
              <NotificationsNoneOutlinedIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={notificationAnchorElement}
          open={Boolean(notificationAnchorElement)}
          onClose={() => setNotificationAnchorElement(null)}
          className="navbar__notification-menu"
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
        >
          <Box className="navbar__notification-header">
            <Typography component="p">Notifications</Typography>
            <Box
              component="button"
              onClick={onClearNotifications}
              disabled={notifications.length === 0}
            >
              Mark all read
            </Box>
          </Box>
          <Divider />
          {notifications.length === 0 ? (
            <Typography component="p" className="navbar__notification-empty">
              No new notifications
            </Typography>
          ) : (
            notifications.map((notification) => (
              <MenuItem
                key={notification.id}
                onClick={() => {
                  onReviewNotification(notification.id);
                  // Updates the page or stored state with this result.
                  setNotificationAnchorElement(null);
                  // Updates the page or stored state with this result.
                  navigate(notification.path);
                }}
              >
                <ListItemIcon>
                  <AssessmentOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <Box className="navbar__notification-copy">
                  <Typography component="p">{notification.title}</Typography>
                  <Typography component="span">
                    {notification.message}
                  </Typography>
                </Box>
              </MenuItem>
            ))
          )}
        </Menu>

        <Divider orientation="vertical" flexItem className="navbar__divider" />

        <Box
          component="button"
          className="navbar__profile-button"
          onClick={handleOpenProfileMenu}
          aria-haspopup="true"
          aria-expanded={isProfileMenuOpen}
        >
          <Avatar className="navbar__avatar">{getInitials(user?.name)}</Avatar>

          <Box className="navbar__user-information">
            <Typography component="p" className="navbar__user-name">
              {user?.name ?? "User"}
            </Typography>

            <Typography component="p" className="navbar__user-role">
              {formatRole(user?.role)}
            </Typography>
          </Box>

          <KeyboardArrowDownOutlinedIcon className="navbar__arrow" />
        </Box>

        <Menu
          anchorEl={profileAnchorElement}
          open={isProfileMenuOpen}
          onClose={handleCloseProfileMenu}
          onClick={handleCloseProfileMenu}
          className="navbar__profile-menu"
          anchorOrigin={{
            horizontal: "right",
            vertical: "bottom",
          }}
          transformOrigin={{
            horizontal: "right",
            vertical: "top",
          }}
        >
          <Box className="navbar__menu-header">
            <Typography component="p">{user?.name}</Typography>

            <Typography component="span">{user?.email}</Typography>
          </Box>

          <Divider />

          <MenuItem onClick={() => handleNavigate("/profile")}>
            <ListItemIcon>
              <PersonOutlineIcon fontSize="small" />
            </ListItemIcon>
            My Profile
          </MenuItem>

          {(user?.role === "SUPER_ADMIN" || user?.role === "COMPANY_ADMIN") && (
            <MenuItem onClick={() => handleNavigate("/settings")}>
              <ListItemIcon>
                <SettingsOutlinedIcon fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>
          )}

          <Divider />

          <MenuItem onClick={handleLogout} className="navbar__logout-menu-item">
            <ListItemIcon>
              <LogoutOutlinedIcon fontSize="small" />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export default Navbar;
