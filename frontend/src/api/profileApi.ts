/* Teaching guide: This file contains API requests and responses for profile api.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Imports the needed tools from ./axiosInstance.
import axiosInstance from "./axiosInstance";
// Imports the needed tools from ./authApi.
import type { AccountStatus, UserRole } from "./authApi";

// Defines the fields allowed in user company.
export interface UserCompany {
  id: string;
  name: string;
  industry: string;
  email: string;
}

// Defines the fields allowed in user profile.
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

// Defines the fields allowed in update profile request.
export interface UpdateProfileRequest {
  name: string;
}

// Gets current user profile.
export const getCurrentUserProfile =
  async (): Promise<UserProfile> => {
    // Stores response for the steps below.
    const response =
      // Waits for this asynchronous work to finish.
      await axiosInstance.get<UserProfile>("/profiles/me");

    // Returns the completed result to the caller.
    return response.data;
  };

// Saves current user profile.
export const updateCurrentUserProfile = async (
  profileData: UpdateProfileRequest,
): Promise<UserProfile> => {
  // Stores response for the steps below.
  const response = await axiosInstance.patch<UserProfile>(
    "/profiles/me",
    profileData,
  );

  // Returns the completed result to the caller.
  return response.data;
};