/* Teaching guide: This file contains role permissions helper logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Imports the needed tools from ../types/user.types.
import type { UserRole } from "../types/user.types";

// Defines the permission type.
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

// Stores role permission map for the steps below.
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

// Checks permission.
export const hasPermission = (
  role: UserRole | undefined | null,
  permission: Permission,
): boolean => {
  // Checks whether this condition is true.
  if (!role) {
    // Returns the completed result to the caller.
    return false;
  }

  // Returns the completed result to the caller.
  return rolePermissionMap[role].includes(permission);
};

// Checks any permission.
export const hasAnyPermission = (
  role: UserRole | undefined | null,
  permissions: Permission[],
): boolean => {
  // Returns the completed result to the caller.
  return permissions.some((permission) =>
    hasPermission(role, permission),
  );
};

// Checks all permissions.
export const hasAllPermissions = (
  role: UserRole | undefined | null,
  permissions: Permission[],
): boolean => {
  // Returns the completed result to the caller.
  return permissions.every((permission) =>
    hasPermission(role, permission),
  );
};

// Checks role allowed.
export const isRoleAllowed = (
  role: UserRole | undefined | null,
  allowedRoles: UserRole[],
): boolean => {
  // Checks whether this condition is true.
  if (!role) {
    // Returns the completed result to the caller.
    return false;
  }

  // Returns the completed result to the caller.
  return allowedRoles.includes(role);
};

// Runs format role label logic.
export const formatRoleLabel = (
  role?: UserRole | null,
): string => {
  // Checks whether this condition is true.
  if (!role) {
    // Returns the completed result to the caller.
    return "Unknown";
  }

  // Returns the completed result to the caller.
  return role
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
};