/* Teaching guide: This file contains the status badge user interface.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Imports the needed tools from @mui/material/Chip.
import Chip from "@mui/material/Chip";

// Loads ./StatusBadge.css styles or setup.
import "./StatusBadge.css";

// Defines the status badge value type.
export type StatusBadgeValue =
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED"
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "EXPIRED"
  | "REVOKED";

// Defines the fields allowed in status badge props.
interface StatusBadgeProps {
  status: StatusBadgeValue | string;
  label?: string;
  size?: "small" | "medium";
  className?: string;
}

// Runs format status label logic.
const formatStatusLabel = (status: string): string => {
  // Returns the completed result to the caller.
  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

// Shows the status badge.
const StatusBadge = ({
  status,
  label,
  size = "small",
  className = "",
}: StatusBadgeProps) => {
  // Stores normalized status for the steps below.
  const normalizedStatus = status.toUpperCase();

  // Builds the visible interface below.
  return (
    <Chip
      label={label ?? formatStatusLabel(status)}
      size={size}
      className={`status-badge status-badge--${normalizedStatus.toLowerCase()} ${className}`.trim()}
    />
  );
};

export default StatusBadge;