/* Teaching guide: This file contains API requests and responses for auth api.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Imports the needed tools from ./axiosInstance.
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

// Imports the needed tools from ../types/api.types.
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
// Adds company.
export const registerCompany = async (
  registrationData: CompanyRegistrationRequest,
): Promise<CompanyRegistrationResponse> => {
  // Stores response for the steps below.
  const response =
    // Waits for this asynchronous work to finish.
    await axiosInstance.post<CompanyRegistrationResponse>(
      "/auth/register-company",
      registrationData,
    );

  // Returns the completed result to the caller.
  return response.data;
};

/**
 * Authenticate the user and store access and refresh tokens.
 */
// Logs the user in.
export const login = async (
  credentials: LoginRequest,
): Promise<LoginResponse> => {
  // Stores response for the steps below.
  const response = await axiosInstance.post<LoginResponse>(
    "/auth/login",
    credentials,
  );

  storeAuthTokens(
    response.data.accessToken,
    response.data.refreshToken,
  );

  // Returns the completed result to the caller.
  return response.data;
};

/**
 * Generate a new access token using the stored refresh token.
 */
// Runs refresh access token logic.
export const refreshAccessToken =
  async (): Promise<RefreshTokenResponse> => {
    // Stores refresh token for the steps below.
    const refreshToken = getStoredRefreshToken();

    // Checks whether this condition is true.
    if (!refreshToken) {
      clearAuthTokens();

      // Stops here and reports the problem.
      throw new Error("Refresh token is not available.");
    }

    // Stores response for the steps below.
    const response =
      // Waits for this asynchronous work to finish.
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

    // Returns the completed result to the caller.
    return response.data;
  };

/**
 * Logout the user and remove locally stored authentication tokens.
 */
// Logs the user out.
export const logout = async (): Promise<MessageResponse> => {
  // Stores refresh token for the steps below.
  const refreshToken = getStoredRefreshToken();

  // Tries the operation and watches for errors.
  try {
    // Checks whether this condition is true.
    if (!refreshToken) {
      // Returns the completed result to the caller.
      return {
        message: "Logged out successfully.",
      };
    }

    // Stores response for the steps below.
    const response =
      // Waits for this asynchronous work to finish.
      await axiosInstance.post<MessageResponse>(
        "/auth/logout",
        {
          refreshToken,
        },
      );

    // Returns the completed result to the caller.
    return response.data;
  } finally {
    clearAuthTokens();
  }
};

/**
 * Change the password of the currently authenticated user.
 */
// Runs change password logic.
export const changePassword = async (
  passwordData: ChangePasswordRequest,
): Promise<MessageResponse> => {
  // Stores response for the steps below.
  const response =
    // Waits for this asynchronous work to finish.
    await axiosInstance.post<MessageResponse>(
      "/auth/change-password",
      passwordData,
    );

  // Returns the completed result to the caller.
  return response.data;
};

/**
 * Request a password reset link.
 */
// Runs forgot password logic.
export const forgotPassword = async (
  forgotPasswordData: ForgotPasswordRequest,
): Promise<ForgotPasswordResponse> => {
  // Stores response for the steps below.
  const response =
    // Waits for this asynchronous work to finish.
    await axiosInstance.post<ForgotPasswordResponse>(
      "/auth/forgot-password",
      forgotPasswordData,
    );

  // Returns the completed result to the caller.
  return response.data;
};

/**
 * Reset the password using the token received through email.
 */
// Runs reset password logic.
export const resetPassword = async (
  resetPasswordData: ResetPasswordRequest,
): Promise<MessageResponse> => {
  // Stores response for the steps below.
  const response =
    // Waits for this asynchronous work to finish.
    await axiosInstance.post<MessageResponse>(
      "/auth/reset-password",
      resetPasswordData,
    );

  // Returns the completed result to the caller.
  return response.data;
};
