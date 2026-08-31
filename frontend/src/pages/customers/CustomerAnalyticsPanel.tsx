/* Teaching guide: This file contains customer analytics panel page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
// Renders the customer analytics panel section for the customers feature.
import { Box, Typography } from "@mui/material";
import type {
  Customer,
  CustomerAnalytics as CustomerAnalyticsData,
} from "../../api/customerApi";
import CustomerAnalytics from "./CustomerAnalytics";
import CustomerExportButtons from "./CustomerExportButtons";
// This component receives prepared data and renders the feature-specific interface.
export default function CustomerAnalyticsPanel({
  data,
  customers,
  editable,
  onExport,
}: {
  data?: CustomerAnalyticsData;
  customers: Customer[];
  editable: boolean;
  onExport: (format: "CSV" | "PDF") => void;
}) {
  return (
    <Box className="component-panel">
      <Box className="component-panel__header">
        <Typography component="h2">Customer Analytics</Typography>
        {editable && <CustomerExportButtons onExport={onExport} />}
      </Box>
      <CustomerAnalytics data={data} customers={customers} />
    </Box>
  );
}
