import Chip from "@mui/material/Chip";

import "./StatusBadge.css";

export type StatusBadgeValue =
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED"
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "EXPIRED"
  | "REVOKED";

interface StatusBadgeProps {
  status: StatusBadgeValue | string;
  label?: string;
  size?: "small" | "medium";
  className?: string;
}

const formatStatusLabel = (status: string): string => {
  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const StatusBadge = ({
  status,
  label,
  size = "small",
  className = "",
}: StatusBadgeProps) => {
  const normalizedStatus = status.toUpperCase();

  return (
    <Chip
      label={label ?? formatStatusLabel(status)}
      size={size}
      className={`status-badge status-badge--${normalizedStatus.toLowerCase()} ${className}`.trim()}
    />
  );
};

export default StatusBadge;