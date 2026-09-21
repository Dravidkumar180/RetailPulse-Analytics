/* Lists recurring reports and provides edit, enable, history, and delete actions. */
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Add, Schedule } from "@mui/icons-material";
import { types } from "./reportConstants";
import { dateTime } from "./reportUtils";
import ReportStatusChip from "./ReportStatusChip";
import type { ReportsState } from "./useReports";

type Props = Pick<
  ReportsState,
  | "setTab"
  | "busy"
  | "tableBusy"
  | "schedules"
  | "setHistoryPage"
  | "setScheduleFilter"
  | "setDeleteId"
  | "openSchedule"
  | "toggle"
>;

export default function ScheduledReports({
  setTab,
  busy,
  tableBusy,
  schedules,
  setHistoryPage,
  setScheduleFilter,
  setDeleteId,
  openSchedule,
  toggle,
}: Props) {
  return (
    <Paper variant="outlined" className="report-panel">
      <Stack direction="row" sx={{ justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h6">Scheduled Reports</Typography>
          <Typography color="text.secondary">
            Automate recurring reports and email delivery.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => openSchedule()}
        >
          Create schedule
        </Button>
      </Stack>
      {tableBusy ? (
        <CircularProgress />
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {[
                  "Name / Report",
                  "Frequency / Time",
                  "Recipients",
                  "Format",
                  "Status",
                  "Last run / Next run",
                  "Actions",
                ].map((h) => (
                  <TableCell key={h}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {schedules.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <strong>{s.name}</strong>
                    <br />
                    {types.find((t) => t.id === s.report_type)?.name}
                  </TableCell>
                  <TableCell>
                    {s.frequency} Â· {s.execution_time}
                    <br />
                    <small>{s.timezone}</small>
                  </TableCell>
                  <TableCell>{s.recipients.join(", ")}</TableCell>
                  <TableCell>{s.format}</TableCell>
                  <TableCell>
                    <Switch
                      checked={s.active}
                      disabled={busy}
                      onChange={() => toggle(s)}
                      slotProps={{
                        input: { "aria-label": `Enable ${s.name}` },
                      }}
                    />
                    {s.active ? "Active" : "Inactive"}
                  </TableCell>
                  <TableCell>
                    {s.last_report ? (
                      <>
                        {<ReportStatusChip status={s.last_report.status} />}{" "}
                        {s.last_report.delivery_status && (
                          <ReportStatusChip
                            status={s.last_report.delivery_status}
                          />
                        )}
                        <br />
                        {s.last_report.error && (
                          <Typography variant="caption" color="error">
                            {s.last_report.error}
                          </Typography>
                        )}
                      </>
                    ) : (
                      "Not yet run"
                    )}
                    <br />
                    <small>
                      Last: {dateTime(s.last_run)}
                      <br />
                      Next: {s.active ? dateTime(s.next_run) : "Paused"}
                    </small>
                  </TableCell>
                  <TableCell>
                    <Button onClick={() => openSchedule(s)}>Edit</Button>
                    <Button
                      onClick={() => {
                        setScheduleFilter(s.id!);
                        setHistoryPage(0);
                        setTab(2);
                      }}
                    >
                      Runs
                    </Button>
                    <Button color="error" onClick={() => setDeleteId(s.id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {!tableBusy && !schedules.length && (
        <div className="report-empty">
          <Schedule />
          <Typography variant="h6">No scheduled reports yet</Typography>
          <Typography>Create your first recurring report above.</Typography>
        </div>
      )}
    </Paper>
  );
}
