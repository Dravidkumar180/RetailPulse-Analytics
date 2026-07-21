/* Teaching guide: This file contains company.types TypeScript shapes.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

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

// Defines the fields allowed in company summary.
export interface CompanySummary {
  id: string;
  name: string;
  industry?: string;
  email?: string;
}

// Defines the fields allowed in company registration request.
export interface CompanyRegistrationRequest {
  companyName: string;
  industry: string;
  companyEmail: string;
  companyAddress: string;
  companyPhoneNumber: string;
  ownerName: string;
  ownerEmail: string;
  password: string;
  confirmPassword: string;
}

// Defines the fields allowed in company registration response.
export interface CompanyRegistrationResponse {
  message: string;
  companyId: string;
  adminUserId: string;
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