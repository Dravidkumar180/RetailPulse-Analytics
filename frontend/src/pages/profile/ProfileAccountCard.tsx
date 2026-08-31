/* Teaching guide: This file contains profile account card page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
import { Avatar, Box, Chip, Typography } from "@mui/material";
import type { UserProfile } from "../../api/profileApi";
import StatusBadge from "../../components/common/StatusBadge/StatusBadge";
import {
  formatProfileDateTime,
  formatProfileRole,
  getProfileInitials,
} from "./profileUtils";

// Display the user's identity and read-only account information.
// This component receives prepared data and renders the feature-specific interface.
export default function ProfileAccountCard({
  profile,
}: {
  profile: UserProfile;
}) {
  return (
    <Box className="profile-page__account-card">
      <Box className="profile-page__identity">
        <Avatar className="profile-page__avatar">
          {getProfileInitials(profile.name)}
        </Avatar>
        <Box>
          <Typography component="h2">{profile.name}</Typography>
          <Typography component="p">{profile.email}</Typography>
        </Box>
      </Box>
      <Box className="profile-page__divider" />
      <Box className="profile-page__account-row">
        <Typography component="span">Role</Typography>
        <Chip label={formatProfileRole(profile.role)} />
      </Box>
      <Box className="profile-page__account-row">
        <Typography component="span">Company</Typography>
        <Typography component="strong">{profile.company.name}</Typography>
      </Box>
      <Box className="profile-page__account-row">
        <Typography component="span">Account Status</Typography>
        <StatusBadge status={profile.status} />
      </Box>
      <Box className="profile-page__account-row">
        <Typography component="span">Last Login</Typography>
        <Typography component="strong">
          {formatProfileDateTime(profile.lastLogin)}
        </Typography>
      </Box>
    </Box>
  );
}
