/* Shows counts for all logs, successful events, failed events, and today. */
import type { ReactNode } from "react";
import { Box } from "@mui/material";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import TodayOutlinedIcon from "@mui/icons-material/TodayOutlined";
import type { AuditLogSummary } from "../../api/auditLogApi";

export default function AuditLogStats({ stats }: { stats: AuditLogSummary }) {
  return (
    <Box className="audit-logs-page__stats">
      <Stat
        icon={<HistoryOutlinedIcon />}
        label="Total Logs"
        value={stats.total}
      />
      <Stat
        icon={<CheckCircleOutlineIcon />}
        label="Successful"
        value={stats.successful}
        tone="green"
      />
      <Stat
        icon={<ErrorOutlineIcon />}
        label="Failed"
        value={stats.failed}
        tone="red"
      />
      <Stat
        icon={<TodayOutlinedIcon />}
        label="Today's Logs"
        value={stats.today}
      />
    </Box>
  );
}

function Stat({
  icon,
  label,
  value,
  tone = "blue",
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <Box className={`audit-logs-page__stat audit-logs-page__stat--${tone}`}>
      <i>{icon}</i>
      <span>
        {label}
        <strong>{value.toLocaleString()}</strong>
      </span>
    </Box>
  );
}
