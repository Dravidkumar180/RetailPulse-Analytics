/* Teaching guide: This file contains customer export buttons page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
// Renders the customer export buttons controls for the customers feature.
import { Box, Button } from "@mui/material";
import DownloadIcon from "@mui/icons-material/DownloadOutlined";
// This component receives prepared data and renders the feature-specific interface.
export default function CustomerExportButtons({
  onExport,
}: {
  onExport: (format: "CSV" | "PDF") => void;
}) {
  return (
    <Box className="component-export">
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={() => onExport("CSV")}
      >
        CSV
      </Button>
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={() => onExport("PDF")}
      >
        PDF
      </Button>
    </Box>
  );
}
