/* Teaching guide: This file contains API requests and responses for user api.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Imports the needed tools from ./axiosInstance.
import axiosInstance from "./axiosInstance";
import type {
  AccountStatus,
  UserRole,
} from "./authApi";

// Defines the fields allowed in company user.
export interface CompanyUser {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  lastLogin: string | null;
  createdAt: string;
}

// Defines the fields allowed in user filters.
export interface UserFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: UserRole | "";
  status?: AccountStatus | "";
}

// Defines the fields allowed in user list response.
export interface UserListResponse {
  items: CompanyUser[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

// Defines the fields allowed in create user request.
export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: Exclude<UserRole, "SUPER_ADMIN">;
}

// Defines the fields allowed in update user status request.
export interface UpdateUserStatusRequest {
  status: AccountStatus;
}

// Gets company users.
export const getCompanyUsers = async (
  filters: UserFilters = {},
): Promise<UserListResponse> => {
  // Stores response for the steps below.
  const response = await axiosInstance.get<UserListResponse>(
    "/users",
    {
      params: {
        page: filters.page ?? 1,
        pageSize: filters.pageSize ?? 10,
        search: filters.search || undefined,
        role: filters.role || undefined,
        status: filters.status || undefined,
      },
    },
  );

  // Returns the completed result to the caller.
  return response.data;
};

// Adds company user.
export const createCompanyUser = async (
  userData: CreateUserRequest,
): Promise<CompanyUser> => {
  // Stores response for the steps below.
  const response = await axiosInstance.post<CompanyUser>(
    "/users",
    userData,
  );

  // Returns the completed result to the caller.
  return response.data;
};

// Saves user status.
export const updateUserStatus = async (
  userId: string,
  requestData: UpdateUserStatusRequest,
): Promise<CompanyUser> => {
  // Stores response for the steps below.
  const response = await axiosInstance.patch<CompanyUser>(
    `/users/${userId}/status`,
    requestData,
  );

  // Returns the completed result to the caller.
  return response.data;
};