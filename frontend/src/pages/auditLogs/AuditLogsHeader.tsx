/* Shows the audit page title and buttons for exporting or clearing old logs. */
import { Box } from "@mui/material";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import Button from "../../components/common/Button/Button";
import PageHeader from "../../components/common/PageHeader/PageHeader";

type Props = {
  exporting: boolean;
  exportCsv: () => Promise<void>;
  exportPdf: () => Promise<void>;
  onClear: () => void;
};

export default function AuditLogsHeader({
  exporting,
  exportCsv,
  exportPdf,
  onClear,
}: Props) {
  return (
    <PageHeader
      title="Audit Logs & Activity Monitoring"
      subtitle="Review user activities and system events across your company."
      icon={<HistoryOutlinedIcon />}
      actions={
        <Box className="audit-logs-page__header-actions">
          <span className="audit-logs-page__live">
            <i />
            Live updates
          </span>
          <Button
            loading={exporting}
            variant="outlined"
            startIcon={<DownloadOutlinedIcon />}
            onClick={exportCsv}
          >
            Export CSV
          </Button>
          <Button
            loading={exporting}
            color="error"
            variant="outlined"
            startIcon={<DownloadOutlinedIcon />}
            onClick={exportPdf}
          >
            Export PDF
          </Button>
          <Button
            color="error"
            variant="outlined"
            startIcon={<DeleteOutlineIcon />}
            onClick={onClear}
          >
            Clear logs
          </Button>
        </Box>
      }
    />
  );
}
