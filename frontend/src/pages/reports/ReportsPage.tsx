/* Connects report state to the generate, scheduled, and history tabs and dialogs. */
import {
  Alert,
  Box,
  Button,
  Chip,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import {
  AssessmentOutlined,
  Schedule,
  History,
  ShieldOutlined,
} from "@mui/icons-material";
import GenerateReports from "./GenerateReports";
import ScheduledReports from "./ScheduledReports";
import ReportHistory from "./ReportHistory";
import ScheduleDialog from "./ScheduleDialog";
import DeleteScheduleDialog from "./DeleteScheduleDialog";
import { useReports } from "./useReports";
import "./ReportsPage.css";

export default function ReportsPage() {
  const reports = useReports();
  const { canSchedule, tab, setTab, options, error, setError, setRefresh } =
    reports;
  return (
    <Box className="reports-page">
      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 750 }}>
            Reports
          </Typography>
          <Typography color="text.secondary">
            Turn your business data into clear, actionable reports.
          </Typography>
        </Box>
        <Chip
          icon={<ShieldOutlined />}
          label={options?.company || "Company reports"}
          color="success"
          variant="outlined"
        />
      </Stack>
      <Tabs
        value={tab}
        onChange={(_, v) => {
          setTab(v);
          setError("");
        }}
        className="reports-tabs"
      >
        <Tab
          icon={<AssessmentOutlined />}
          iconPosition="start"
          label="Generate reports"
        />
        {
          <Tab
            disabled={!canSchedule}
            icon={<Schedule />}
            iconPosition="start"
            label="Scheduled reports"
          />
        }
        <Tab icon={<History />} iconPosition="start" label="Report history" />
      </Tabs>
      {error && (
        <Alert
          severity="error"
          action={
            <Button
              onClick={() => {
                setError("");
                setRefresh((v) => v + 1);
              }}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      {tab === 0 && <GenerateReports {...reports} />}
      {tab === 1 && <ScheduledReports {...reports} />}
      {tab === 2 && <ReportHistory {...reports} />}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mt: 2 }}
      >
        Report data is restricted to your company. All times in the history are
        shown in your local timezone.
      </Typography>
      <ScheduleDialog {...reports} />
      <DeleteScheduleDialog {...reports} />
    </Box>
  );
}
