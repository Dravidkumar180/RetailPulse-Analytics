/* Teaching guide: This file contains dashboard page page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
import { useQuery } from "@tanstack/react-query";
import { Box } from "@mui/material";
import {
  getCompanyDashboardSummary,
  type CompanyDashboardSummary,
} from "../../api/companyApi";
import { getCurrentUserProfile, type UserProfile } from "../../api/profileApi";
import LoadingSpinner from "../../components/common/LoadingSpinner/LoadingSpinner";
import DashboardBreakdown from "./DashboardBreakdown";
import DashboardHeader from "./DashboardHeader";
import DashboardMetrics from "./DashboardMetrics";
import DashboardTables from "./DashboardTables";
import SalesOverviewChart from "./SalesOverviewChart";
import "./DashboardPage.css";

/** Loads dashboard data and composes the focused dashboard sections. */
// This component receives prepared data and renders the feature-specific interface.
const DashboardPage = () => {
  const summaryQuery = useQuery<CompanyDashboardSummary>({
    queryKey: ["company-dashboard-summary"],
    queryFn: getCompanyDashboardSummary,
  });
  const profileQuery = useQuery<UserProfile>({
    queryKey: ["current-user-profile"],
    queryFn: getCurrentUserProfile,
  });
  if (summaryQuery.isLoading || profileQuery.isLoading)
    return <LoadingSpinner message="Loading dashboard..." />;
  return (
    <Box className="overview-dashboard">
      <DashboardHeader profile={profileQuery.data} />
      <DashboardMetrics summary={summaryQuery.data} />
      <DashboardBreakdown />
      <SalesOverviewChart />
      <DashboardTables />
    </Box>
  );
};

export default DashboardPage;
