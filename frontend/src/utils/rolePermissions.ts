import type { UserRole } from "../types/user.types";

export type Permission =
  | "VIEW_DASHBOARD"
  | "VIEW_PROFILE"
  | "VIEW_PRODUCTS"
  | "MANAGE_PRODUCTS"
  | "VIEW_SALES"
  | "MANAGE_SALES"
  | "VIEW_ANALYTICS"
  | "CREATE_ANALYTICS"
  | "VIEW_REPORTS"
  | "MANAGE_USERS"
  | "VIEW_AUDIT_LOGS"
  | "MANAGE_COMPANIES"
  | "MANAGE_SETTINGS";

const rolePermissionMap: Record<
  UserRole,
  Permission[]
> = {
  SUPER_ADMIN: [
    "VIEW_DASHBOARD",
    "VIEW_PROFILE",
    "VIEW_PRODUCTS",
    "MANAGE_PRODUCTS",
    "VIEW_SALES",
    "MANAGE_SALES",
    "VIEW_ANALYTICS",
    "CREATE_ANALYTICS",
    "VIEW_REPORTS",
    "MANAGE_USERS",
    "VIEW_AUDIT_LOGS",
    "MANAGE_COMPANIES",
    "MANAGE_SETTINGS",
  ],

  COMPANY_ADMIN: [
    "VIEW_DASHBOARD",
    "VIEW_PROFILE",
    "VIEW_PRODUCTS",
    "MANAGE_PRODUCTS",
    "VIEW_SALES",
    "MANAGE_SALES",
    "VIEW_ANALYTICS",
    "CREATE_ANALYTICS",
    "VIEW_REPORTS",
    "MANAGE_USERS",
    "VIEW_AUDIT_LOGS",
    "MANAGE_SETTINGS",
  ],

  ANALYST: [
    "VIEW_DASHBOARD",
    "VIEW_PROFILE",
    "VIEW_PRODUCTS",
    "VIEW_SALES",
    "VIEW_ANALYTICS",
    "CREATE_ANALYTICS",
    "VIEW_REPORTS",
  ],

  VIEWER: [
    "VIEW_DASHBOARD",
    "VIEW_PROFILE",
    "VIEW_PRODUCTS",
    "VIEW_SALES",
    "VIEW_ANALYTICS",
    "VIEW_REPORTS",
  ],
};

export const hasPermission = (
  role: UserRole | undefined | null,
  permission: Permission,
): boolean => {
  if (!role) {
    return false;
  }

  return rolePermissionMap[role].includes(permission);
};

export const hasAnyPermission = (
  role: UserRole | undefined | null,
  permissions: Permission[],
): boolean => {
  return permissions.some((permission) =>
    hasPermission(role, permission),
  );
};

export const hasAllPermissions = (
  role: UserRole | undefined | null,
  permissions: Permission[],
): boolean => {
  return permissions.every((permission) =>
    hasPermission(role, permission),
  );
};

export const isRoleAllowed = (
  role: UserRole | undefined | null,
  allowedRoles: UserRole[],
): boolean => {
  if (!role) {
    return false;
  }

  return allowedRoles.includes(role);
};

export const formatRoleLabel = (
  role?: UserRole | null,
): string => {
  if (!role) {
    return "Unknown";
  }

  return role
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
};