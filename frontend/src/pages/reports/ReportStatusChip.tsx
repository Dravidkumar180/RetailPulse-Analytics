/* Displays a small status label with a success, error, or neutral color. */
import { Chip } from "@mui/material";

export default function ReportStatusChip({ status }: { status: string }) {
  return (
    <Chip
      size="small"
      label={status.replaceAll("_", " ")}
      color={
        ["COMPLETED", "SENT"].includes(status)
          ? "success"
          : status === "FAILED"
            ? "error"
            : "default"
      }
      variant="outlined"
    />
  );
}
