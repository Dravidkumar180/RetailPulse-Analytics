import type {
  AccountStatus,
  UserRole,
} from "./user.types";
import type { CompanySummary } from "./company.types";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponseUser {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  lastLogin: string | null;
  createdAt: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn?: number;
  user: LoginResponseUser;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn?: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthenticatedUser {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  lastLogin: string | null;
  createdAt?: string;
  company: CompanySummary;
}

export interface AuthState {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface StoredTokens {
  accessToken: string;
  refreshToken: string | null;
}

export interface MessageResponse {
  message: string;
}

export interface JwtPayload {
  sub?: string;
  userId?: string;
  companyId?: string;
  role?: UserRole;
  tokenType?: "access" | "refresh";
  exp?: number;
  iat?: number;
  jti?: string;
  [key: string]: unknown;
}