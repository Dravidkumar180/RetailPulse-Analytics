/* Edits a recurring report schedule, including timing, filters, format, and recipients. */
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { types } from "./reportConstants";
import ReportFilters from "./ReportFilters";
import type { ReportsState } from "./useReports";

type Props = Pick<
  ReportsState,
  | "options"
  | "busy"
  | "edit"
  | "setEdit"
  | "recipients"
  | "setRecipients"
  | "dialogError"
  | "scheduleErrors"
  | "saveSchedule"
>;

export default function ScheduleDialog({
  options,
  busy,
  edit,
  setEdit,
  recipients,
  setRecipients,
  dialogError,
  scheduleErrors,
  saveSchedule,
}: Props) {
  return (
    <Dialog
      open={!!edit}
      onClose={() => !busy && setEdit(undefined)}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        {edit?.id ? "Edit scheduled report" : "Create scheduled report"}
      </DialogTitle>
      <DialogContent>
        {edit && (
          <Stack sx={{ gap: 3, pt: 1 }}>
            {dialogError && (
              <Alert severity="error" sx={{ whiteSpace: "pre-line" }}>
                {dialogError}
              </Alert>
            )}
            <div className="report-filter-grid">
              <TextField
                label="Schedule name"
                required
                error={!!scheduleErrors.name}
                helperText={scheduleErrors.name}
                value={edit.name}
                onChange={(e) => setEdit({ ...edit, name: e.target.value })}
              />
              <TextField
                select
                label="Report type"
                value={edit.report_type}
                onChange={(e) =>
                  setEdit({ ...edit, report_type: e.target.value })
                }
              >
                {types.map((t) => (
                  <MenuItem value={t.id} key={t.id}>
                    {t.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Frequency"
                value={edit.frequency}
                onChange={(e) =>
                  setEdit({ ...edit, frequency: e.target.value })
                }
              >
                {["Daily", "Weekly", "Monthly"].map((f) => (
                  <MenuItem key={f} value={f}>
                    {f}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                type="time"
                label="Execution time"
                slotProps={{ inputLabel: { shrink: true } }}
                value={edit.execution_time}
                onChange={(e) =>
                  setEdit({ ...edit, execution_time: e.target.value })
                }
              />
              <TextField
                label="Timezone"
                value={edit.timezone}
                onChange={(e) => setEdit({ ...edit, timezone: e.target.value })}
              />
              {edit.frequency === "Weekly" && (
                <TextField
                  select
                  label="Day of week"
                  value={edit.weekday}
                  onChange={(e) =>
                    setEdit({ ...edit, weekday: Number(e.target.value) })
                  }
                >
                  {[
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday",
                  ].map((d, i) => (
                    <MenuItem key={d} value={i}>
                      {d}
                    </MenuItem>
                  ))}
                </TextField>
              )}
              {edit.frequency === "Monthly" && (
                <TextField
                  type="number"
                  label="Day of month (1â€“28)"
                  value={edit.month_day}
                  onChange={(e) =>
                    setEdit({ ...edit, month_day: Number(e.target.value) })
                  }
                />
              )}
              <TextField
                select
                label="Reporting period"
                value={edit.period}
                onChange={(e) => setEdit({ ...edit, period: e.target.value })}
              >
                <MenuItem value="previous_period">
                  Previous day / 7 days / calendar month
                </MenuItem>
                <MenuItem value="fixed">Fixed date range</MenuItem>
              </TextField>
              <TextField
                select
                label="Export format"
                value={edit.format}
                onChange={(e) => setEdit({ ...edit, format: e.target.value })}
              >
                <MenuItem value="CSV">CSV</MenuItem>
                <MenuItem value="PDF">PDF</MenuItem>
              </TextField>
            </div>
            <Typography sx={{ fontWeight: 600 }}>Report filters</Typography>
            <ReportFilters
              selected={edit.report_type}
              value={edit.filters}
              change={(f) => setEdit({ ...edit, filters: f })}
              rolling={edit.period === "previous_period"}
              options={options}
            />
            <TextField
              label="Recipients (comma separated)"
              required
              error={!!scheduleErrors.recipients}
              helperText={
                scheduleErrors.recipients ||
                "Enter 1â€“20 email addresses to receive the report."
              }
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
            />
            <Stack direction="row" sx={{ alignItems: "center" }}>
              <Switch
                checked={edit.active}
                onChange={(e) => setEdit({ ...edit, active: e.target.checked })}
                slotProps={{ input: { "aria-label": "Schedule active" } }}
              />
              Active
            </Stack>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button disabled={busy} onClick={() => setEdit(undefined)}>
          Cancel
        </Button>
        <Button variant="contained" disabled={busy} onClick={saveSchedule}>
          Save schedule
        </Button>
      </DialogActions>
    </Dialog>
  );
}
