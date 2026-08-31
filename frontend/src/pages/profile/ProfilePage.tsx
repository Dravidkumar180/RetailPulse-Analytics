/* Teaching guide: This file contains profile page page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
import { useState } from "react";
import { Alert, Box, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { getAuditLogs } from "../../api/auditLogApi";
import { getCurrentUserProfile, type UserProfile } from "../../api/profileApi";
import LoadingSpinner from "../../components/common/LoadingSpinner/LoadingSpinner";
import ChangePasswordDialog from "./ChangePasswordDialog";
import ProfileAccountCard from "./ProfileAccountCard";
import ProfileActivityCard from "./ProfileActivityCard";
import ProfileSecurityCard from "./ProfileSecurityCard";
import "./ProfilePage.css";

export default function ProfilePage() {
  // These values control the change-password dialog and its success message.
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Load the signed-in user's profile from the backend.
  const profileQuery = useQuery<UserProfile>({
    queryKey: ["current-user-profile"],
    queryFn: getCurrentUserProfile,
  });

  // Activity needs the user ID, so this request starts only after the profile loads.
  const activityQuery = useQuery({
    queryKey: ["profile-activity", profileQuery.data?.id],
    queryFn: () =>
      getAuditLogs({ page: 1, pageSize: 10, userId: profileQuery.data?.id }),
    enabled: Boolean(profileQuery.data?.id),
  });

  // Stop here while the main profile request is loading or has failed.
  if (profileQuery.isLoading)
    return <LoadingSpinner message="Loading your profile..." />;
  if (profileQuery.isError || !profileQuery.data)
    return (
      <Alert severity="error">Unable to load your profile information.</Alert>
    );
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
          <ProfileAccountCard profile={profile} />
          <ProfileSecurityCard
            onChangePassword={() => setPasswordDialogOpen(true)}
          />
        </Box>
        <ProfileActivityCard
          profile={profile}
          activities={activityQuery.data?.items}
          loading={activityQuery.isLoading}
          failed={activityQuery.isError}
        />
      </Box>
      <ChangePasswordDialog
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
        onChanged={() => {
          // Close the dialog, show confirmation, and reload the activity list.
          setPasswordDialogOpen(false);
          setPasswordSuccess(true);
          activityQuery.refetch();
        }}
      />
    </Box>
  );
}
