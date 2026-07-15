import axiosInstance from "./axiosInstance";

export interface Company {
  id: string;
  name: string;
  industry: string;
  email: string;
  address: string;
  phone: string;
  createdAt: string;
  updatedAt?: string | null;
}

export interface UpdateCompanyRequest {
  name?: string;
  industry?: string;
  email?: string;
  address?: string;
  phone?: string;
}

export interface CompanyDashboardSummary {
  companyId: string;
  totalUsers: number;
  totalProducts: number;
  totalSales: number;
  totalReports: number;
}

export const getCurrentCompany = async (): Promise<Company> => {
  const response = await axiosInstance.get<Company>("/companies/me");

  return response.data;
};

export const updateCurrentCompany = async (
  companyData: UpdateCompanyRequest,
): Promise<Company> => {
  const response = await axiosInstance.patch<Company>(
    "/companies/me",
    companyData,
  );

  return response.data;
};

export const getCompanyDashboardSummary =
  async (): Promise<CompanyDashboardSummary> => {
    const response =
      await axiosInstance.get<CompanyDashboardSummary>(
        "/companies/me/dashboard-summary",
      );

    return response.data;
  };