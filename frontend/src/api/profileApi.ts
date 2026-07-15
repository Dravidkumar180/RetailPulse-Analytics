import axiosInstance from "./axiosInstance";
import type { AccountStatus, UserRole } from "./authApi";

export interface UserCompany {
  id: string;
  name: string;
  industry: string;
  email: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  lastLogin: string | null;
  createdAt: string;
  company: UserCompany;
}

export interface UpdateProfileRequest {
  name: string;
}

export const getCurrentUserProfile =
  async (): Promise<UserProfile> => {
    const response =
      await axiosInstance.get<UserProfile>("/profiles/me");

    return response.data;
  };

export const updateCurrentUserProfile = async (
  profileData: UpdateProfileRequest,
): Promise<UserProfile> => {
  const response = await axiosInstance.patch<UserProfile>(
    "/profiles/me",
    profileData,
  );

  return response.data;
};