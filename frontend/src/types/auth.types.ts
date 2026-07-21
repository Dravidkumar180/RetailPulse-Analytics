/* Teaching guide: This file contains auth.types TypeScript shapes.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

import type {
  AccountStatus,
  UserRole,
} from "./user.types";

// Defines the fields allowed in message response.
export interface MessageResponse {
  message: string;
}

// Defines the fields allowed in api error response.
export interface ApiErrorResponse {
  detail?: string;
  message?: string;
  errorCode?: string;
  errors?: Record<string, string[]>;
}

// Defines the fields allowed in authenticated user.
export interface AuthenticatedUser {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  lastLogin: string | null;
  createdAt: string;
}

// Defines the fields allowed in login request.
export interface LoginRequest {
  email: string;
  password: string;
}

// Defines the fields allowed in login response.
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: AuthenticatedUser;
}

// Defines the fields allowed in refresh token response.
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
}

// Defines the fields allowed in change password request.
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Defines the fields allowed in forgot password request.
export interface ForgotPasswordRequest {
  email: string;
}

// Defines the fields allowed in forgot password response.
export interface ForgotPasswordResponse {
  message: string;
  resetToken?: string | null;
}

// Defines the fields allowed in reset password request.
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

// Defines the fields allowed in reset password form data.
export interface ResetPasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

// Defines the fields allowed in pagination meta.
export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

// Defines the fields allowed in paginated response.
export interface PaginatedResponse<T> extends PaginationMeta {
  items: T[];
}

// Defines the fields allowed in api response.
export interface ApiResponse<T> {
  message?: string;
  data: T;
}

// Defines the fields allowed in select option.
export interface SelectOption<T = string> {
  label: string;
  value: T;
}

// Defines the fields allowed in query parameters.
export interface QueryParameters {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
