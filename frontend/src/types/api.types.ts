/* Teaching guide: This file contains api.types TypeScript shapes.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

import type {
  AccountStatus,
  UserRole,
} from "./user.types";
// Imports the needed tools from ./company.types.
import type { CompanySummary } from "./company.types";

// Defines the fields allowed in login request.
export interface LoginRequest {
  email: string;
  password: string;
}

// Defines the fields allowed in login response user.
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

// Defines the fields allowed in login response.
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn?: number;
  user: LoginResponseUser;
}

// Defines the fields allowed in refresh token request.
export interface RefreshTokenRequest {
  refreshToken: string;
}

// Defines the fields allowed in refresh token response.
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn?: number;
}

// Defines the fields allowed in forgot password request.
export interface ForgotPasswordRequest {
  email: string;
}

// Defines the fields allowed in reset password form data.
export interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

// Defines the fields allowed in reset password request.
export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

// Defines the fields allowed in change password request.
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
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
  createdAt?: string;
  company: CompanySummary;
}

// Defines the fields allowed in auth state.
export interface AuthState {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Defines the fields allowed in stored tokens.
export interface StoredTokens {
  accessToken: string;
  refreshToken: string | null;
}

// Defines the fields allowed in message response.
export interface MessageResponse {
  message: string;
}

// Defines the fields allowed in jwt payload.
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