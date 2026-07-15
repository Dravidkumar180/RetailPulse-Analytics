import type {
  AccountStatus,
  UserRole,
} from "./user.types";

export interface MessageResponse {
  message: string;
}

export interface ApiErrorResponse {
  detail?: string;
  message?: string;
  errorCode?: string;
  errors?: Record<string, string[]>;
}

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

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: AuthenticatedUser;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  resetToken?: string | null;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends PaginationMeta {
  items: T[];
}

export interface ApiResponse<T> {
  message?: string;
  data: T;
}

export interface SelectOption<T = string> {
  label: string;
  value: T;
}

export interface QueryParameters {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
