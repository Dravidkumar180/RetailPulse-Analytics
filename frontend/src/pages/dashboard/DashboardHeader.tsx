/* Teaching guide: This file contains dashboard header page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
// Renders the dashboard header controls for the dashboard feature.
import { Box, Typography } from "@mui/material";
import type { UserProfile } from "../../api/profileApi";

// This component receives prepared data and renders the feature-specific interface.
export default function DashboardHeader({
  profile,
}: {
  profile?: UserProfile;
}) {
  const date = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());
  return (
    <Box className="overview-dashboard__header">
      <Box>
        <Typography component="h1">Dashboard</Typography>
        <Typography component="p">
          Welcome back, {profile?.name ?? "Admin"}! Here&apos;s what&apos;s
          happening at {profile?.company.name ?? "your company"}.
        </Typography>
      </Box>
      <Box className="overview-dashboard__date">{date}</Box>
    </Box>
  );
}
