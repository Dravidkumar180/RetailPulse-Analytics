import { Alert, Box, Chip, Typography } from "@mui/material";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import type { AuditAction, AuditLog } from "../../api/auditLogApi";
import type { UserProfile } from "../../api/profileApi";
import LoadingSpinner from "../../components/common/LoadingSpinner/LoadingSpinner";
import {
  formatProfileDateTime,
  formatProfileRole,
  profileActivityLabels,
} from "./profileUtils";

// Choose an icon that represents the type of audit activity.
function activityIcon(action: AuditAction) {
  if (action === "USER_LOGIN" || action === "USER_LOGOUT")
    return <LoginOutlinedIcon />;
  if (action.startsWith("SALE_")) return <PointOfSaleOutlinedIcon />;
  if (action === "USER_INVITED" || action === "USER_UPDATED")
    return <ManageAccountsOutlinedIcon />;
  if (action === "PASSWORD_CHANGED") return <SecurityOutlinedIcon />;
  return <HistoryOutlinedIcon />;
}

// Render one entry returned by the audit-log API.
function ProfileActivityItem({ activity }: { activity: AuditLog }) {
  return (
    <Box className="profile-page__activity-item">
      <Box className="profile-page__activity-icon">
        {activityIcon(activity.action)}
      </Box>
      <Box>
        <Typography component="strong">
          {profileActivityLabels[activity.action] ??
            formatProfileRole(activity.action)}
        </Typography>
        {activity.details && (
          <Typography component="p">{activity.details}</Typography>
        )}
        <Typography component="time">
          {formatProfileDateTime(activity.timestamp)}
        </Typography>
      </Box>
    </Box>
  );
}

type Props = {
  profile: UserProfile;
  activities?: AuditLog[];
  loading: boolean;
  failed: boolean;
};

// Keep activity loading, error, empty, and success states in one component.
export default function ProfileActivityCard({
  profile,
  activities,
  loading,
  failed,
}: Props) {
  return (
    <Box className="profile-page__activity-card">
      <Box className="profile-page__activity-heading">
        <HistoryOutlinedIcon />
        <Typography component="span">Recent Activity</Typography>
        <Typography component="h2">Your latest account actions.</Typography>
        <Typography component="p">
          A live feed of logins, password changes, user management, sales and
          catalog activity from the audit log.
        </Typography>
      </Box>
      <Box className="profile-page__activity-list">
        {loading ? (
          <LoadingSpinner message="Loading recent activity..." />
        ) : failed ? (
          <Alert severity="error">Unable to load recent activity.</Alert>
        ) : activities?.length ? (
          activities.map((activity) => (
            <ProfileActivityItem key={activity.id} activity={activity} />
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
            {formatProfileDateTime(profile.createdAt)}
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
  );
}
