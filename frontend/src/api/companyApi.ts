/* Teaching guide: This file contains API requests and responses for company api.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Imports the needed tools from ./axiosInstance.
import axiosInstance from "./axiosInstance";

// Defines the fields allowed in company.
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

// Defines the fields allowed in update company request.
export interface UpdateCompanyRequest {
  name?: string;
  industry?: string;
  email?: string;
  address?: string;
  phone?: string;
}

// Defines the fields allowed in company dashboard summary.
export interface CompanyDashboardSummary {
  companyId: string;
  totalUsers: number;
  totalProducts: number;
  totalSales: number;
  totalReports: number;
}

// Gets current company.
export const getCurrentCompany = async (): Promise<Company> => {
  // Stores response for the steps below.
  const response = await axiosInstance.get<Company>("/companies/me");

  // Returns the completed result to the caller.
  return response.data;
};

// Saves current company.
export const updateCurrentCompany = async (
  companyData: UpdateCompanyRequest,
): Promise<Company> => {
  // Stores response for the steps below.
  const response = await axiosInstance.patch<Company>(
    "/companies/me",
    companyData,
  );

  // Returns the completed result to the caller.
  return response.data;
};

// Gets company dashboard summary.
export const getCompanyDashboardSummary =
  async (): Promise<CompanyDashboardSummary> => {
    // Stores response for the steps below.
    const response =
      // Waits for this asynchronous work to finish.
      await axiosInstance.get<CompanyDashboardSummary>(
        "/companies/me/dashboard-summary",
      );

    // Returns the completed result to the caller.
    return response.data;
  };