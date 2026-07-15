import { useState } from "react";
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
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import MenuOpenOutlinedIcon from "@mui/icons-material/MenuOpenOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import type { DashboardNotification } from "../DashboardLayout/DashboardLayout";

import { useAuth } from "../../../hooks/useAuth";

import "./Navbar.css";

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

const getInitials = (name?: string): string => {
  if (!name) {
    return "U";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const formatRole = (role?: string): string => {
  if (!role) {
    return "";
  }

  return role
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

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
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [profileAnchorElement, setProfileAnchorElement] =
    useState<null | HTMLElement>(null);
  const [notificationAnchorElement, setNotificationAnchorElement] =
    useState<null | HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const searchablePages = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Products", path: "/products" },
    { label: "Categories", path: "/categories" },
    { label: "Sales", path: "/sales" },
    { label: "Analytics", path: "/analytics" },
    { label: "Reports", path: "/reports" },
    { label: "Users", path: "/users" },
    { label: "Audit Logs", path: "/audit-logs" },
    { label: "Profile", path: "/profile" },
    { label: "Settings", path: "/settings" },
  ];
  const searchResults = searchQuery.trim()
    ? searchablePages.filter((page) =>
        page.label.toLowerCase().includes(searchQuery.trim().toLowerCase()),
      )
    : [];

  const isProfileMenuOpen = Boolean(profileAnchorElement);

  const handleOpenProfileMenu = (
    event: React.MouseEvent<HTMLElement>,
  ) => {
    setProfileAnchorElement(event.currentTarget);
  };

  const handleCloseProfileMenu = () => {
    setProfileAnchorElement(null);
  };

  const handleNavigate = (path: string) => {
    handleCloseProfileMenu();
    navigate(path);
  };

  const handleLogout = async () => {
    handleCloseProfileMenu();

    try {
      await logout();
    } finally {
      navigate("/login", {
        replace: true,
      });
    }
  };

  return (
    <Box component="header" className="navbar">
      <Box className="navbar__left">
        <Tooltip
          title={
            sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
          }
        >
          <IconButton
            className="navbar__desktop-menu-button"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? (
              <MenuOutlinedIcon />
            ) : (
              <MenuOpenOutlinedIcon />
            )}
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
                    navigate(result.path);
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
        <Tooltip title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}>
          <IconButton
            className="navbar__theme-button"
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            onClick={onToggleTheme}
          >
            {isDarkMode ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
          </IconButton>
        </Tooltip>

        <Tooltip title="Notifications">
          <IconButton
            className="navbar__notification-button"
            aria-label="Notifications"
            onClick={(event) => setNotificationAnchorElement(event.currentTarget)}
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
            <Box component="button" onClick={onClearNotifications} disabled={notifications.length === 0}>
              Mark all read
            </Box>
          </Box>
          <Divider />
          {notifications.length === 0 ? (
            <Typography component="p" className="navbar__notification-empty">
              No new notifications
            </Typography>
          ) : notifications.map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => {
                onReviewNotification(notification.id);
                setNotificationAnchorElement(null);
                navigate(notification.path);
              }}
            >
              <ListItemIcon><AssessmentOutlinedIcon fontSize="small" /></ListItemIcon>
              <Box className="navbar__notification-copy">
                <Typography component="p">{notification.title}</Typography>
                <Typography component="span">{notification.message}</Typography>
              </Box>
            </MenuItem>
          ))}
        </Menu>

        <Divider
          orientation="vertical"
          flexItem
          className="navbar__divider"
        />

        <Box
          component="button"
          className="navbar__profile-button"
          onClick={handleOpenProfileMenu}
          aria-haspopup="true"
          aria-expanded={isProfileMenuOpen}
        >
          <Avatar className="navbar__avatar">
            {getInitials(user?.name)}
          </Avatar>

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

            <Typography component="span">
              {user?.email}
            </Typography>
          </Box>

          <Divider />

          <MenuItem onClick={() => handleNavigate("/profile")}>
            <ListItemIcon>
              <PersonOutlineIcon fontSize="small" />
            </ListItemIcon>
            My Profile
          </MenuItem>

          {(user?.role === "SUPER_ADMIN" ||
            user?.role === "COMPANY_ADMIN") && (
            <MenuItem onClick={() => handleNavigate("/settings")}>
              <ListItemIcon>
                <SettingsOutlinedIcon fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>
          )}

          <Divider />

          <MenuItem
            onClick={handleLogout}
            className="navbar__logout-menu-item"
          >
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
