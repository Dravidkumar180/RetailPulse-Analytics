// Renders the analytics header section for the analytics feature.
import { Box, Button, Typography } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import RefreshIcon from "@mui/icons-material/Refresh";

// This component receives prepared data and renders the feature-specific interface.
export default function AnalyticsHeader({
  refreshing,
  hasData,
  exporting,
  onRefresh,
  onExport,
}: {
  refreshing: boolean;
  hasData: boolean;
  exporting: "CSV" | "PDF" | null;
  onRefresh: () => void;
  onExport: (format: "CSV" | "PDF") => void;
}) {
  return (
    <Box className="analytics-header">
      <Box>
        <Typography component="h1">Sales Analytics</Typography>
        <Typography>
          Revenue, orders, customers and payment performance
        </Typography>
      </Box>
      <Box className="analytics-actions">
        <Button
          startIcon={
            <RefreshIcon className={refreshing ? "analytics-spin" : ""} />
          }
          disabled={refreshing || Boolean(exporting)}
          onClick={onRefresh}
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </Button>
        <Button
          startIcon={<DownloadIcon />}
          disabled={!hasData || Boolean(exporting)}
          onClick={() => onExport("CSV")}
        >
          {exporting === "CSV" ? "Exporting…" : "Export CSV"}
        </Button>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          disabled={!hasData || Boolean(exporting)}
          onClick={() => onExport("PDF")}
        >
          {exporting === "PDF" ? "Exporting…" : "Export PDF"}
        </Button>
      </Box>
    </Box>
  );
}
