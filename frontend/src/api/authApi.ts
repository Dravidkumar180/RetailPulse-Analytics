import axiosInstance from "./axiosInstance";


import {
  clearAuthTokens,
  getStoredRefreshToken,
  storeAuthTokens,
} from "../services/tokenService";

import type {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  ResetPasswordRequest,
} from "../types/auth.types";

import type {
  CompanyRegistrationRequest,
  CompanyRegistrationResponse,
} from "../types/company.types";

import type { MessageResponse } from "../types/api.types";

import type {
  AccountStatus,
  UserRole,
} from "../types/user.types";

/*
 * Re-export these types so existing files can continue importing
 * them from api/authApi.ts.
 *
 * Example:
 * import type { LoginRequest, UserRole } from "../../api/authApi";
 */
export type {
  AccountStatus,
  ChangePasswordRequest,
  CompanyRegistrationRequest,
  CompanyRegistrationResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  MessageResponse,
  RefreshTokenResponse,
  ResetPasswordRequest,
  UserRole,
};

/**
 * Register a new company and create its first Company Admin.
 */
export const registerCompany = async (
  registrationData: CompanyRegistrationRequest,
): Promise<CompanyRegistrationResponse> => {
  const response =
    await axiosInstance.post<CompanyRegistrationResponse>(
      "/auth/register-company",
      registrationData,
    );

  return response.data;
};

/**
 * Authenticate the user and store access and refresh tokens.
 */
export const login = async (
  credentials: LoginRequest,
): Promise<LoginResponse> => {
  const response = await axiosInstance.post<LoginResponse>(
    "/auth/login",
    credentials,
  );

  storeAuthTokens(
    response.data.accessToken,
    response.data.refreshToken,
  );

  return response.data;
};

/**
 * Generate a new access token using the stored refresh token.
 */
export const refreshAccessToken =
  async (): Promise<RefreshTokenResponse> => {
    const refreshToken = getStoredRefreshToken();

    if (!refreshToken) {
      clearAuthTokens();

      throw new Error("Refresh token is not available.");
    }

    const response =
      await axiosInstance.post<RefreshTokenResponse>(
        "/auth/refresh",
        {
          refreshToken,
        },
      );

    storeAuthTokens(
      response.data.accessToken,
      response.data.refreshToken,
    );

    return response.data;
  };

/**
 * Logout the user and remove locally stored authentication tokens.
 */
export const logout = async (): Promise<MessageResponse> => {
  const refreshToken = getStoredRefreshToken();

  try {
    if (!refreshToken) {
      return {
        message: "Logged out successfully.",
      };
    }

    const response =
      await axiosInstance.post<MessageResponse>(
        "/auth/logout",
        {
          refreshToken,
        },
      );

    return response.data;
  } finally {
    clearAuthTokens();
  }
};

/**
 * Change the password of the currently authenticated user.
 */
export const changePassword = async (
  passwordData: ChangePasswordRequest,
): Promise<MessageResponse> => {
  const response =
    await axiosInstance.post<MessageResponse>(
      "/auth/change-password",
      passwordData,
    );

  return response.data;
};

/**
 * Request a password reset link.
 */
export const forgotPassword = async (
  forgotPasswordData: ForgotPasswordRequest,
): Promise<ForgotPasswordResponse> => {
  const response =
    await axiosInstance.post<ForgotPasswordResponse>(
      "/auth/forgot-password",
      forgotPasswordData,
    );

  return response.data;
};

/**
 * Reset the password using the token received through email.
 */
export const resetPassword = async (
  resetPasswordData: ResetPasswordRequest,
): Promise<MessageResponse> => {
  const response =
    await axiosInstance.post<MessageResponse>(
      "/auth/reset-password",
      resetPasswordData,
    );

  return response.data;
};
