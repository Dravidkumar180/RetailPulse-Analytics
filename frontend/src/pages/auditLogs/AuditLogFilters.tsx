// Renders search, action, and date filters for the audit-log request.
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import type { AuditAction } from "../../api/auditLogApi";
import { auditActions, formatAuditAction } from "./auditLogUtils";

type Props = {
  search: string;
  action: AuditAction | "";
  startDate: string;
  endDate: string;
  onSearch: (value: string) => void;
  onAction: (value: AuditAction | "") => void;
  onStartDate: (value: string) => void;
  onEndDate: (value: string) => void;
};

// This component receives prepared data and renders the feature-specific interface.
export default function AuditLogFilters(props: Props) {
  return (
    <Box className="audit-logs-page__filters">
      <TextField
        label="Search"
        placeholder="User, company, details, IP or browser"
        value={props.search}
        onChange={(event) => props.onSearch(event.target.value)}
      />
      <FormControl>
        <InputLabel id="audit-action-label">Action</InputLabel>
        <Select
          labelId="audit-action-label"
          label="Action"
          value={props.action}
          onChange={(event) =>
            props.onAction(event.target.value as AuditAction | "")
          }
        >
          <MenuItem value="">All Actions</MenuItem>
          {auditActions.map((action) => (
            <MenuItem key={action} value={action}>
              {formatAuditAction(action)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        label="Start Date"
        type="date"
        value={props.startDate}
        onChange={(event) => props.onStartDate(event.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
      />
      <TextField
        label="End Date"
        type="date"
        value={props.endDate}
        onChange={(event) => props.onEndDate(event.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
      />
    </Box>
  );
}
