/* Teaching guide: This file contains the profile page page.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Imports the needed tools from react.
import { useState } from "react";
// Imports the needed tools from @tanstack/react-query.
import { useQuery } from "@tanstack/react-query";
// Imports the needed tools from @mui/material.
import { Alert, Avatar, Box, Dialog, DialogContent, Typography } from "@mui/material";
// Imports the needed tools from @mui/icons-material/LockResetOutlined.
import LockResetOutlinedIcon from "@mui/icons-material/LockResetOutlined";

// Imports the needed tools from ../../api/profileApi.
import { getCurrentUserProfile, type UserProfile } from "../../api/profileApi";
// Imports the needed tools from ../../components/auth/ChangePasswordForm/ChangePasswordForm.
import ChangePasswordForm from "../../components/auth/ChangePasswordForm/ChangePasswordForm";
// Imports the needed tools from ../../components/common/Button/Button.
import Button from "../../components/common/Button/Button";
// Imports the needed tools from ../../components/common/LoadingSpinner/LoadingSpinner.
import LoadingSpinner from "../../components/common/LoadingSpinner/LoadingSpinner";
// Imports the needed tools from ../../components/common/StatusBadge/StatusBadge.
import StatusBadge from "../../components/common/StatusBadge/StatusBadge";
// Loads ./ProfilePage.css styles or setup.
import "./ProfilePage.css";

// Runs format date time logic.
const formatDateTime = (date?: string | null): string => {
  // Checks whether this condition is true.
  if (!date) return "Not available";
  // Returns the completed result to the caller.
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(date));
};

// Runs format role logic.
const formatRole = (role: string): string => role
  .toLowerCase().replaceAll("_", " ")
  .replace(/\b\w/g, (character) => character.toUpperCase());

// Gets initials.
const getInitials = (name?: string): string => (name || "User")
  .trim().split(/\s+/).slice(0, 2)
  .map((part) => part.charAt(0).toUpperCase()).join("");

// Shows the profile page.
const ProfilePage = () => {
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  // Stores profile query for the steps below.
  const profileQuery = useQuery<UserProfile>({
    queryKey: ["current-user-profile"], queryFn: getCurrentUserProfile,
  });

  // Checks whether this condition is true.
  if (profileQuery.isLoading) return <LoadingSpinner message="Loading your profile..." />;
  // Checks whether this condition is true.
  if (profileQuery.isError || !profileQuery.data) {
    // Returns the completed result to the caller.
    return <Alert severity="error">Unable to load your profile information.</Alert>;
  }

  // Stores profile for the steps below.
  const profile = profileQuery.data;
  // Stores details for the steps below.
  const details = [
    ["Full Name", profile.name],
    ["Email", profile.email],
    ["Role", formatRole(profile.role)],
    ["Company", profile.company.name],
    ["Last Login", formatDateTime(profile.lastLogin)],
  ];

  // Returns the completed result to the caller.
  return <Box className="profile-page">
    <Typography component="h1" className="profile-page__title">My Profile</Typography>

    {passwordSuccess && <Alert severity="success" className="profile-page__success-alert" onClose={() => setPasswordSuccess(false)}>
      Your password was changed successfully.
    </Alert>}

    <Box className="profile-page__profile-card">
      <Box className="profile-page__identity-section">
        <Avatar className="profile-page__avatar">{getInitials(profile.name)}</Avatar>
        <Box>
          <Typography component="h2">{profile.name}</Typography>
          <Typography component="p">{formatRole(profile.role)}</Typography>
          <StatusBadge status={profile.status} />
        </Box>
      </Box>

      <Box className="profile-page__details-grid">
        {details.map(([label, value]) => <Box className="profile-page__detail" key={label}>
          <Typography component="span">{label}</Typography>
          <Typography component="strong">{value}</Typography>
        </Box>)}
        <Box className="profile-page__detail">
          <Typography component="span">Account Status</Typography>
          <Typography component="strong">{formatRole(profile.status)}</Typography>
        </Box>
      </Box>

      <Button className="profile-page__password-button" startIcon={<LockResetOutlinedIcon />} onClick={() => setPasswordDialogOpen(true)}>
        Change Password
      </Button>
    </Box>

    <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} fullWidth maxWidth="sm">
      <DialogContent className="profile-page__password-dialog">
        <ChangePasswordForm onPasswordChanged={() => {
          // Updates the page or stored state with this result.
          setPasswordDialogOpen(false);
          // Updates the page or stored state with this result.
          setPasswordSuccess(true);
        }} />
      </DialogContent>
    </Dialog>
  </Box>;
};

export default ProfilePage;
