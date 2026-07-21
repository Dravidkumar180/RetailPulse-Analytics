/* Teaching guide: This file contains constants helper logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

import type {
  AccountStatus,
  UserRole,
} from "../types/user.types";
// Imports the needed tools from ../types/auditLog.types.
import type { AuditAction } from "../types/auditLog.types";

// Stores app name for the steps below.
export const APP_NAME = "RetailPulse Analytics";

// Stores api base url for the steps below.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "/api/v1";

// Stores access token key for the steps below.
export const ACCESS_TOKEN_KEY =
  "retailpulse_access_token";

// Stores refresh token key for the steps below.
export const REFRESH_TOKEN_KEY =
  "retailpulse_refresh_token";

// Stores default page for the steps below.
export const DEFAULT_PAGE = 1;
// Stores default page size for the steps below.
export const DEFAULT_PAGE_SIZE = 10;

// Stores minimum password length for the steps below.
export const MINIMUM_PASSWORD_LENGTH = 8;
// Stores maximum password length for the steps below.
export const MAXIMUM_PASSWORD_LENGTH = 128;

// Stores user roles for the steps below.
export const USER_ROLES: {
  label: string;
  value: UserRole;
}[] = [
  {
    label: "Super Admin",
    value: "SUPER_ADMIN",
  },
  {
    label: "Company Admin",
    value: "COMPANY_ADMIN",
  },
  {
    label: "Analyst",
    value: "ANALYST",
  },
  {
    label: "Viewer",
    value: "VIEWER",
  },
];

// Stores company user roles for the steps below.
export const COMPANY_USER_ROLES: {
  label: string;
  value: Exclude<UserRole, "SUPER_ADMIN">;
}[] = [
  {
    label: "Company Admin",
    value: "COMPANY_ADMIN",
  },
  {
    label: "Analyst",
    value: "ANALYST",
  },
  {
    label: "Viewer",
    value: "VIEWER",
  },
];

// Stores account statuses for the steps below.
export const ACCOUNT_STATUSES: {
  label: string;
  value: AccountStatus;
}[] = [
  {
    label: "Active",
    value: "ACTIVE",
  },
  {
    label: "Inactive",
    value: "INACTIVE",
  },
  {
    label: "Suspended",
    value: "SUSPENDED",
  },
];

// Stores audit actions for the steps below.
export const AUDIT_ACTIONS: {
  label: string;
  value: AuditAction;
}[] = [
  {
    label: "Company Registered",
    value: "COMPANY_REGISTERED" as AuditAction,
  },
  {
    label: "User Login",
    value: "USER_LOGIN" as AuditAction,
  },
  {
    label: "User Logout",
    value: "USER_LOGOUT" as AuditAction,
  },
  {
    label: "Password Changed",
    value: "PASSWORD_CHANGED" as AuditAction,
  },
];

// Stores industry options for the steps below.
export const INDUSTRY_OPTIONS = [
  "Retail",
  "E-Commerce",
  "Technology",
  "Healthcare",
  "Finance",
  "Manufacturing",
  "Hospitality",
  "Education",
  "Logistics",
  "Other",
] as const;

// Stores date time locale for the steps below.
export const DATE_TIME_LOCALE = "en-IN";
