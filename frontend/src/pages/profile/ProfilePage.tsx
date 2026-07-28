import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Avatar,
  Box,
  Chip,
  Dialog,
  DialogContent,
  IconButton,
  Typography,
} from "@mui/material";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import LockResetOutlinedIcon from "@mui/icons-material/LockResetOutlined";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";

import {
  getAuditLogs,
  type AuditAction,
  type AuditLog,
} from "../../api/auditLogApi";
import {
  getCurrentUserProfile,
  type UserProfile,
} from "../../api/profileApi";
import ChangePasswordForm from "../../components/auth/ChangePasswordForm/ChangePasswordForm";
import Button from "../../components/common/Button/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner/LoadingSpinner";
import StatusBadge from "../../components/common/StatusBadge/StatusBadge";

import "./ProfilePage.css";

const formatDateTime = (date?: string | null): string => {
  if (!date) return "Not available";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
};

const formatRole = (value: string): string =>
  value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const getInitials = (name?: string): string =>
  (name || "User")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

const activityLabels: Partial<Record<AuditAction, string>> = {
  USER_LOGIN: "Logged in",
  USER_LOGOUT: "Logged out",
  PASSWORD_CHANGED: "Changed password",
  USER_INVITED: "Invited a user",
  USER_UPDATED: "Updated a user",
  SALE_CREATED: "Recorded a sale",
  SALE_UPDATED: "Updated a sale",
  SALE_DELETED: "Deleted a sale",
  INVENTORY_UPDATED: "Updated inventory",
  PRODUCT_OUT_OF_STOCK: "Product out of stock",
  DASHBOARD_VIEWED: "Viewed dashboard",
  REPORT_EXPORTED: "Exported a report",
  DASHBOARD_FILTERS_APPLIED: "Applied dashboard filters",
};

const activityIcon = (action: AuditAction) => {
  if (action === "USER_LOGIN" || action === "USER_LOGOUT") {
    return <LoginOutlinedIcon />;
  }
  if (action.startsWith("SALE_")) return <PointOfSaleOutlinedIcon />;
  if (
    action === "USER_INVITED" ||
    action === "USER_UPDATED"
  ) {
    return <ManageAccountsOutlinedIcon />;
  }
  if (action === "PASSWORD_CHANGED") return <SecurityOutlinedIcon />;
  return <HistoryOutlinedIcon />;
};

const ActivityItem = ({ activity }: { activity: AuditLog }) => (
  <Box className="profile-page__activity-item">
    <Box className="profile-page__activity-icon">
      {activityIcon(activity.action)}
    </Box>
    <Box>
      <Typography component="strong">
        {activityLabels[activity.action] ?? formatRole(activity.action)}
      </Typography>
      {activity.details && (
        <Typography component="p">{activity.details}</Typography>
      )}
      <Typography component="time">
        {formatDateTime(activity.timestamp)}
      </Typography>
    </Box>
  </Box>
);

const ProfilePage = () => {
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const profileQuery = useQuery<UserProfile>({
    queryKey: ["current-user-profile"],
    queryFn: getCurrentUserProfile,
  });

  const activityQuery = useQuery({
    queryKey: ["profile-activity", profileQuery.data?.id],
    queryFn: () =>
      getAuditLogs({
        page: 1,
        pageSize: 10,
        userId: profileQuery.data?.id,
      }),
    enabled: Boolean(profileQuery.data?.id),
  });

  if (profileQuery.isLoading) {
    return <LoadingSpinner message="Loading your profile..." />;
  }
  if (profileQuery.isError || !profileQuery.data) {
    return (
      <Alert severity="error">
        Unable to load your profile information.
      </Alert>
    );
  }

  const profile = profileQuery.data;

  return (
    <Box className="profile-page">
      <Typography component="h1" className="profile-page__title">
        Profile
      </Typography>

      {passwordSuccess && (
        <Alert
          severity="success"
          className="profile-page__success-alert"
          onClose={() => setPasswordSuccess(false)}
        >
          Your password was changed successfully.
        </Alert>
      )}

      <Box className="profile-page__layout">
        <Box className="profile-page__left-column">
          <Box className="profile-page__account-card">
            <Box className="profile-page__identity">
              <Avatar className="profile-page__avatar">
                {getInitials(profile.name)}
              </Avatar>
              <Box>
                <Typography component="h2">{profile.name}</Typography>
                <Typography component="p">{profile.email}</Typography>
              </Box>
            </Box>

            <Box className="profile-page__divider" />

            <Box className="profile-page__account-row">
              <Typography component="span">Role</Typography>
              <Chip label={formatRole(profile.role)} />
            </Box>
            <Box className="profile-page__account-row">
              <Typography component="span">Company</Typography>
              <Typography component="strong">
                {profile.company.name}
              </Typography>
            </Box>
            <Box className="profile-page__account-row">
              <Typography component="span">Account Status</Typography>
              <StatusBadge status={profile.status} />
            </Box>
            <Box className="profile-page__account-row">
              <Typography component="span">Last Login</Typography>
              <Typography component="strong">
                {formatDateTime(profile.lastLogin)}
              </Typography>
            </Box>
          </Box>

          <Box className="profile-page__password-card">
            <Typography component="h2">Password & Security</Typography>
            <Typography component="p">
              Keep your account secure by using a strong, unique password.
            </Typography>
            <Button
              className="profile-page__password-button"
              startIcon={<LockResetOutlinedIcon />}
              onClick={() => setPasswordDialogOpen(true)}
            >
              Change Password
            </Button>
          </Box>
        </Box>

        <Box className="profile-page__activity-card">
          <Box className="profile-page__activity-heading">
            <HistoryOutlinedIcon />
            <Typography component="span">Recent Activity</Typography>
            <Typography component="h2">
              Your latest account actions.
            </Typography>
            <Typography component="p">
              A live feed of logins, password changes, user management,
              sales and catalog activity from the audit log.
            </Typography>
          </Box>

          <Box className="profile-page__activity-list">
            {activityQuery.isLoading ? (
              <LoadingSpinner message="Loading recent activity..." />
            ) : activityQuery.isError ? (
              <Alert severity="error">
                Unable to load recent activity.
              </Alert>
            ) : activityQuery.data?.items.length ? (
              activityQuery.data.items.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))
            ) : (
              <Typography className="profile-page__activity-empty">
                No account activity has been recorded yet.
              </Typography>
            )}
          </Box>

          <Box className="profile-page__activity-footer">
            <Box className="profile-page__metadata">
              <Typography component="span">Member since</Typography>
              <Typography component="strong">
                {formatDateTime(profile.createdAt)}
              </Typography>
              <Typography component="span">Company industry</Typography>
              <Typography component="strong">
                {profile.company.industry || "Not specified"}
              </Typography>
            </Box>
            <Box className="profile-page__trust-badges">
              <Chip label="Tenant isolated" />
              <Chip label="JWT protected" />
              <Chip label="Audit logged" />
            </Box>
          </Box>
        </Box>
      </Box>

      <Dialog
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        className="profile-page__password-dialog"
      >
        <IconButton
          className="profile-page__dialog-close"
          aria-label="Close change password dialog"
          onClick={() => setPasswordDialogOpen(false)}
        >
          <CloseOutlinedIcon />
        </IconButton>
        <DialogContent>
          <ChangePasswordForm
            onPasswordChanged={() => {
              setPasswordDialogOpen(false);
              setPasswordSuccess(true);
              activityQuery.refetch();
            }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ProfilePage;
