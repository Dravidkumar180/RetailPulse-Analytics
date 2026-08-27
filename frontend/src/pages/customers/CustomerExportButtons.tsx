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
