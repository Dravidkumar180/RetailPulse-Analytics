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

export interface CompanySummary {
  id: string;
  name: string;
  industry?: string;
  email?: string;
}

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

export interface CompanyRegistrationResponse {
  message: string;
  companyId: string;
  adminUserId: string;
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