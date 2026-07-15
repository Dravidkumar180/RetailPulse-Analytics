import axiosInstance from "./axiosInstance";
import type {
  AccountStatus,
  UserRole,
} from "./authApi";

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

export interface UserFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: UserRole | "";
  status?: AccountStatus | "";
}

export interface UserListResponse {
  items: CompanyUser[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: Exclude<UserRole, "SUPER_ADMIN">;
}

export interface UpdateUserStatusRequest {
  status: AccountStatus;
}

export const getCompanyUsers = async (
  filters: UserFilters = {},
): Promise<UserListResponse> => {
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

  return response.data;
};

export const createCompanyUser = async (
  userData: CreateUserRequest,
): Promise<CompanyUser> => {
  const response = await axiosInstance.post<CompanyUser>(
    "/users",
    userData,
  );

  return response.data;
};

export const updateUserStatus = async (
  userId: string,
  requestData: UpdateUserStatusRequest,
): Promise<CompanyUser> => {
  const response = await axiosInstance.patch<CompanyUser>(
    `/users/${userId}/status`,
    requestData,
  );

  return response.data;
};