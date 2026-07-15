import type { CompanySummary } from "./company.types";

export type UserRole =
  | "SUPER_ADMIN"
  | "COMPANY_ADMIN"
  | "ANALYST"
  | "VIEWER";

export type AccountStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED";

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE";

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

export interface UpdateProfileRequest {
  name: string;
}

export interface UserFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: UserRole | "";
  status?: AccountStatus | "";
}

export interface UserListResponse {
  items: User[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: Exclude<UserRole, "SUPER_ADMIN">;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: Exclude<UserRole, "SUPER_ADMIN">;
  status?: AccountStatus;
}

export interface UpdateUserStatusRequest {
  status: AccountStatus;
}