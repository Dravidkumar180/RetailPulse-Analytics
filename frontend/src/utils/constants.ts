import type {
  AccountStatus,
  UserRole,
} from "../types/user.types";
import type { AuditAction } from "../types/auditLog.types";

export const APP_NAME = "RetailPulse Analytics";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://127.0.0.1:8001/api/v1";

export const ACCESS_TOKEN_KEY =
  "retailpulse_access_token";

export const REFRESH_TOKEN_KEY =
  "retailpulse_refresh_token";

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;

export const MINIMUM_PASSWORD_LENGTH = 8;
export const MAXIMUM_PASSWORD_LENGTH = 128;

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

export const DATE_TIME_LOCALE = "en-IN";
