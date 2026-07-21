/* Teaching guide: This file contains audit log.types TypeScript shapes.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Imports the needed tools from ./company.types.
import type { CompanySummary } from "./company.types";

// Defines the user role type.
export type UserRole =
  | "SUPER_ADMIN"
  | "COMPANY_ADMIN"
  | "ANALYST"
  | "VIEWER";

// Defines the account status type.
export type AccountStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED";

// Defines the audit action type.
export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE";

// Defines the fields allowed in user.
export interface User {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  lastLogin: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

// Defines the fields allowed in user profile.
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  lastLogin: string | null;
  createdAt: string;
  company: CompanySummary & {
    industry: string;
    email: string;
  };
}

// Defines the fields allowed in update profile request.
export interface UpdateProfileRequest {
  name: string;
}

// Defines the fields allowed in user filters.
export interface UserFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: UserRole | "";
  status?: AccountStatus | "";
}

// Defines the fields allowed in user list response.
export interface UserListResponse {
  items: User[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

// Defines the fields allowed in create user request.
export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: Exclude<UserRole, "SUPER_ADMIN">;
}

// Defines the fields allowed in update user request.
export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: Exclude<UserRole, "SUPER_ADMIN">;
  status?: AccountStatus;
}

// Defines the fields allowed in update user status request.
export interface UpdateUserStatusRequest {
  status: AccountStatus;
}