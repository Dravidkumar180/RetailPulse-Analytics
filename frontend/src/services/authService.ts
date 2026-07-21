/* Teaching guide: This file contains auth service business logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

import {
  changePassword,
  forgotPassword,
  login,
  logout,
  refreshAccessToken,
  registerCompany,
  resetPassword,
  // Defines the change password request type.
  type ChangePasswordRequest,
  // Defines the company registration request type.
  type CompanyRegistrationRequest,
  // Defines the company registration response type.
  type CompanyRegistrationResponse,
  // Defines the forgot password request type.
  type ForgotPasswordRequest,
  // Defines the login request type.
  type LoginRequest,
  // Defines the login response type.
  type LoginResponse,
  // Defines the message response type.
  type MessageResponse,
  // Defines the refresh token response type.
  type RefreshTokenResponse,
  // Defines the reset password request type.
  type ResetPasswordRequest,
} from "../api/authApi";
import {
  getCurrentUserProfile,
  // Defines the user profile type.
  type UserProfile,
} from "../api/profileApi";
import {
  clearAuthTokens,
  getStoredRefreshToken,
  hasAccessToken,
  hasRefreshToken,
  hasValidAccessToken,
  storeAuthTokens,
} from "./tokenService";

// Logs the user in.
export const loginUser = async (
  credentials: LoginRequest,
): Promise<LoginResponse> => {
  // Stores normalized credentials for the steps below.
  const normalizedCredentials: LoginRequest = {
    email: credentials.email.trim().toLowerCase(),
    password: credentials.password,
  };

  // Stores response for the steps below.
  const response = await login(normalizedCredentials);

  storeAuthTokens(
    response.accessToken,
    response.refreshToken,
  );

  // Returns the completed result to the caller.
  return response;
};

// Adds company account.
export const registerCompanyAccount = async (
  registrationData: CompanyRegistrationRequest,
): Promise<CompanyRegistrationResponse> => {
  // Stores normalized registration data for the steps below.
  const normalizedRegistrationData: CompanyRegistrationRequest =
    {
      ...registrationData,
      companyName:
        registrationData.companyName.trim(),
      industry: registrationData.industry.trim(),
      companyEmail:
        registrationData.companyEmail
          .trim()
          .toLowerCase(),
      companyAddress:
        registrationData.companyAddress.trim(),
      companyPhoneNumber:
        registrationData.companyPhoneNumber.trim(),
      ownerName:
        registrationData.ownerName.trim(),
      ownerEmail:
        registrationData.ownerEmail
          .trim()
          .toLowerCase(),
    };

  // Returns the completed result to the caller.
  return registerCompany(
    normalizedRegistrationData,
  );
};

// Runs refresh user access token logic.
export const refreshUserAccessToken =
  async (): Promise<RefreshTokenResponse> => {
    // Checks whether this condition is true.
    if (!hasRefreshToken()) {
      clearAuthTokens();

      // Stops here and reports the problem.
      throw new Error(
        "A refresh token is not available.",
      );
    }

    // Stores response for the steps below.
    const response = await refreshAccessToken();

    storeAuthTokens(
      response.accessToken,
      response.refreshToken,
    );

    // Returns the completed result to the caller.
    return response;
  };

// Runs restore user session logic.
export const restoreUserSession =
  async (): Promise<UserProfile | null> => {
    // Checks whether this condition is true.
    if (!hasAccessToken()) {
      // Returns the completed result to the caller.
      return null;
    }

    // Tries the operation and watches for errors.
    try {
      // Checks whether this condition is true.
      if (!hasValidAccessToken()) {
        // Checks whether this condition is true.
        if (!hasRefreshToken()) {
          clearAuthTokens();
          // Returns the completed result to the caller.
          return null;
        }

        // Waits for this asynchronous work to finish.
        await refreshUserAccessToken();
      }

      // Returns the completed result to the caller.
      return await getCurrentUserProfile();
    } catch {
      clearAuthTokens();
      // Returns the completed result to the caller.
      return null;
    }
  };

// Logs the user out.
export const logoutUser =
  async (): Promise<void> => {
    // Stores refresh token for the steps below.
    const refreshToken = getStoredRefreshToken();

    // Tries the operation and watches for errors.
    try {
      // Checks whether this condition is true.
      if (refreshToken) {
        // Waits for this asynchronous work to finish.
        await logout();
      }
    } finally {
      clearAuthTokens();
    }
  };

// Runs request password reset logic.
export const requestPasswordReset = async (
  requestData: ForgotPasswordRequest,
): Promise<MessageResponse> => {
  // Returns the completed result to the caller.
  return forgotPassword({
    email: requestData.email.trim().toLowerCase(),
  });
};

// Runs submit password reset logic.
export const submitPasswordReset = async (
  requestData: ResetPasswordRequest,
): Promise<MessageResponse> => {
  // Returns the completed result to the caller.
  return resetPassword(requestData);
};

// Saves user password.
export const updateUserPassword = async (
  requestData: ChangePasswordRequest,
): Promise<MessageResponse> => {
  // Returns the completed result to the caller.
  return changePassword(requestData);
};