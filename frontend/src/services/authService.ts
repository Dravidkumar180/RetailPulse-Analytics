import {
  changePassword,
  forgotPassword,
  login,
  logout,
  refreshAccessToken,
  registerCompany,
  resetPassword,
  type ChangePasswordRequest,
  type CompanyRegistrationRequest,
  type CompanyRegistrationResponse,
  type ForgotPasswordRequest,
  type LoginRequest,
  type LoginResponse,
  type MessageResponse,
  type RefreshTokenResponse,
  type ResetPasswordRequest,
} from "../api/authApi";
import {
  getCurrentUserProfile,
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

export const loginUser = async (
  credentials: LoginRequest,
): Promise<LoginResponse> => {
  const normalizedCredentials: LoginRequest = {
    email: credentials.email.trim().toLowerCase(),
    password: credentials.password,
  };

  const response = await login(normalizedCredentials);

  storeAuthTokens(
    response.accessToken,
    response.refreshToken,
  );

  return response;
};

export const registerCompanyAccount = async (
  registrationData: CompanyRegistrationRequest,
): Promise<CompanyRegistrationResponse> => {
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

  return registerCompany(
    normalizedRegistrationData,
  );
};

export const refreshUserAccessToken =
  async (): Promise<RefreshTokenResponse> => {
    if (!hasRefreshToken()) {
      clearAuthTokens();

      throw new Error(
        "A refresh token is not available.",
      );
    }

    const response = await refreshAccessToken();

    storeAuthTokens(
      response.accessToken,
      response.refreshToken,
    );

    return response;
  };

export const restoreUserSession =
  async (): Promise<UserProfile | null> => {
    if (!hasAccessToken()) {
      return null;
    }

    try {
      if (!hasValidAccessToken()) {
        if (!hasRefreshToken()) {
          clearAuthTokens();
          return null;
        }

        await refreshUserAccessToken();
      }

      return await getCurrentUserProfile();
    } catch {
      clearAuthTokens();
      return null;
    }
  };

export const logoutUser =
  async (): Promise<void> => {
    const refreshToken = getStoredRefreshToken();

    try {
      if (refreshToken) {
        await logout();
      }
    } finally {
      clearAuthTokens();
    }
  };

export const requestPasswordReset = async (
  requestData: ForgotPasswordRequest,
): Promise<MessageResponse> => {
  return forgotPassword({
    email: requestData.email.trim().toLowerCase(),
  });
};

export const submitPasswordReset = async (
  requestData: ResetPasswordRequest,
): Promise<MessageResponse> => {
  return resetPassword(requestData);
};

export const updateUserPassword = async (
  requestData: ChangePasswordRequest,
): Promise<MessageResponse> => {
  return changePassword(requestData);
};