/* Stores the starting values used when audit filters are opened or cleared. */
import type { AuditFilters } from "./AuditLogFilters";

export const initialFilters: AuditFilters = {
  search: "",
  action: "",
  userId: "",
  resourceType: "",
  status: "",
  startDate: "",
  endDate: "",
  sortOrder: "newest",
};
