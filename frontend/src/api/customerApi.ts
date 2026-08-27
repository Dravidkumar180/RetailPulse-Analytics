// Defines customer types and the API requests for customer management and analytics.
import axiosInstance from "./axiosInstance";

// The exported types describe the data exchanged with the backend.
export type CustomerType = "RETAIL" | "WHOLESALE" | "CORPORATE";
export type CustomerStatus = "ACTIVE" | "INACTIVE";
export interface PurchaseSummary {
  totalOrders: number;
  totalRevenue: number;
  totalProductsPurchased: number;
  averageOrderValue: number;
  purchaseFrequency: number;
  firstPurchaseDate?: string;
  lastPurchaseDate?: string;
  favoriteProduct?: string;
  favoriteCategory?: string;
}
export interface Customer {
  id: string;
  customerId: string;
  fullName: string;
  email: string;
  phone: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  customerType: CustomerType;
  preferredSalesChannel?: string;
  status: CustomerStatus;
  segment: string;
  createdAt: string;
  updatedAt: string;
  summary: PurchaseSummary;
  timeline: {
    id: string;
    event: string;
    details?: string;
    occurredAt: string;
  }[];
  recentTransactions: {
    id: string;
    invoiceNumber: string;
    saleDate: string;
    totalAmount: number;
    paymentMethod: string;
    salesChannel: string;
  }[];
  mostPurchasedProducts: {
    productName: string;
    quantity: number;
    purchaseCount: number;
  }[];
}
export type CustomerInput = Omit<
  Customer,
  | "id"
  | "customerId"
  | "segment"
  | "createdAt"
  | "updatedAt"
  | "summary"
  | "timeline"
  | "recentTransactions"
  | "mostPurchasedProducts"
>;
export interface CustomerAnalytics {
  kpis: {
    totalCustomers: number;
    activeCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    averageCustomerSpend: number;
    totalRevenue: number;
    averagePurchaseFrequency: number;
  };
  growth: { name: string; value: number }[];
  newVsReturning: { name: string; value: number }[];
  revenueByType: { name: string; value: number }[];
  topCustomers: { name: string; value: number }[];
  purchaseFrequency: { name: string; value: number }[];
  locations: { name: string; value: number }[];
  topCustomersByPeriod: {
    day: { name: string; value: number }[];
    month: { name: string; value: number }[];
    year: { name: string; value: number }[];
  };
  acquisition: { name: string; value: number }[];
  segments: { name: string; value: number }[];
}
export const getCustomers = async (
  params: Record<string, string | undefined> = {},
) =>
  (
    await axiosInstance.get<{ items: Customer[]; total: number }>(
      "/customers",
      { params },
    )
  ).data;
export const getCustomer = async (id: string) =>
  (await axiosInstance.get<Customer>(`/customers/${id}`)).data;
export const createCustomer = async (data: CustomerInput) =>
  (await axiosInstance.post<Customer>("/customers", data)).data;
export const updateCustomer = async (id: string, data: CustomerInput) =>
  (await axiosInstance.put<Customer>(`/customers/${id}`, data)).data;
export const deleteCustomer = async (id: string) => {
  await axiosInstance.delete(`/customers/${id}`);
};
export const getCustomerAnalytics = async () =>
  (await axiosInstance.get<CustomerAnalytics>("/customers/analytics")).data;
export const logCustomerExport = async (report: string) => {
  await axiosInstance.post("/customers/export", null, { params: { report } });
};
export const getCustomerNotifications = async () =>
  (
    await axiosInstance.get<
      {
        id: string;
        title: string;
        message: string;
        customerId: string;
        createdAt: string;
      }[]
    >("/customers/notifications")
  ).data;
export const clearCustomerNotifications = async () => {
  await axiosInstance.delete("/customers/notifications");
};
