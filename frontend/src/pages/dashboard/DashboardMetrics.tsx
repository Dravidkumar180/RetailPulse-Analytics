/* Teaching guide: This file contains dashboard metrics page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
// Renders the dashboard metrics section for the dashboard feature.
import { Box, Card, CardContent } from "@mui/material";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import type { CompanyDashboardSummary } from "../../api/companyApi";

// This component receives prepared data and renders the feature-specific interface.
export default function DashboardMetrics({
  summary,
}: {
  summary?: CompanyDashboardSummary;
}) {
  const primary = [
    [
      summary?.totalSales
        ? `₹${summary.totalSales.toLocaleString("en-IN")}`
        : "₹12.45M",
      "Total Sales",
      "+12% from last month",
    ],
    ["8,652", "Total Orders", "+8% from last month"],
    [
      summary?.totalUsers?.toLocaleString("en-IN") || "1",
      "Total Customers",
      "+15% from last month",
    ],
    [
      summary?.totalProducts?.toLocaleString("en-IN") || "0",
      "Total Products",
      "+5% from last month",
    ],
  ];
  const compact = [
    [<Inventory2OutlinedIcon />, "24", "Low Stock Items"],
    [<ShoppingCartOutlinedIcon />, "18", "Pending Orders"],
    [<PeopleOutlineIcon />, "326", "Repeat Customers"],
    [
      <AssessmentOutlinedIcon />,
      summary?.totalReports?.toLocaleString("en-IN") || "0",
      "Generated Reports",
    ],
  ];
  return (
    <>
      <Box className="overview-dashboard__primary">
        {primary.map(([value, label, change]) => (
          <Card key={String(label)}>
            <CardContent>
              <strong>{value}</strong>
              <span>{label}</span>
              <small>{change}</small>
            </CardContent>
          </Card>
        ))}
      </Box>
      <Box className="overview-dashboard__compact">
        {compact.map(([icon, value, label]) => (
          <Card key={String(label)}>
            <CardContent>
              <i>{icon}</i>
              <Box>
                <strong>{value}</strong>
                <span>{label}</span>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </>
  );
}
