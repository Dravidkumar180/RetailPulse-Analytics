import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Avatar, Box, Dialog, DialogContent, Typography } from "@mui/material";
import LockResetOutlinedIcon from "@mui/icons-material/LockResetOutlined";

import { getCurrentUserProfile, type UserProfile } from "../../api/profileApi";
import ChangePasswordForm from "../../components/auth/ChangePasswordForm/ChangePasswordForm";
import Button from "../../components/common/Button/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner/LoadingSpinner";
import StatusBadge from "../../components/common/StatusBadge/StatusBadge";
import "./ProfilePage.css";

const formatDateTime = (date?: string | null): string => {
  if (!date) return "Not available";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(date));
};

const formatRole = (role: string): string => role
  .toLowerCase().replaceAll("_", " ")
  .replace(/\b\w/g, (character) => character.toUpperCase());

const getInitials = (name?: string): string => (name || "User")
  .trim().split(/\s+/).slice(0, 2)
  .map((part) => part.charAt(0).toUpperCase()).join("");

const ProfilePage = () => {
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const profileQuery = useQuery<UserProfile>({
    queryKey: ["current-user-profile"], queryFn: getCurrentUserProfile,
  });

  if (profileQuery.isLoading) return <LoadingSpinner message="Loading your profile..." />;
  if (profileQuery.isError || !profileQuery.data) {
    return <Alert severity="error">Unable to load your profile information.</Alert>;
  }

  const profile = profileQuery.data;
  const details = [
    ["Full Name", profile.name],
    ["Email", profile.email],
    ["Role", formatRole(profile.role)],
    ["Company", profile.company.name],
    ["Last Login", formatDateTime(profile.lastLogin)],
  ];

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
          setPasswordDialogOpen(false);
          setPasswordSuccess(true);
        }} />
      </DialogContent>
    </Dialog>
  </Box>;
};

export default ProfilePage;
