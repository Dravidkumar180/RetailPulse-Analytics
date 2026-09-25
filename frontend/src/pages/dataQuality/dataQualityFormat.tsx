// Shared date, ID and status-chip presentation.
import { Chip } from "@mui/material";
export const fmt = (date?: string | null) =>
  date ? new Date(date).toLocaleString() : "—";

export const short = (id: string) => id.slice(0, 8).toUpperCase();

const color = (
  s: string,
): "error" | "warning" | "success" | "info" | "default" =>
  s === "Error" || s === "Failed"
    ? "error"
    : s === "Warning" || s === "Open" || s === "Completed with Issues"
      ? "warning"
      : s === "Resolved" || s === "Completed"
        ? "success"
        : s === "Investigating" || s === "Running"
          ? "info"
          : "default";

export const badge = (s: string) => (
  <Chip size="small" label={s} color={color(s)} variant="outlined" />
);
