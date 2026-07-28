import axiosInstance from "./axiosInstance";

export interface AnalyticsFilters {
  startDate?: string; endDate?: string; productId?: string; categoryId?: string;
  brand?: string; salesChannel?: string; paymentMethod?: string; interval?: string;
}
export interface MetricItem { name: string; value?: number; units?: number; revenue?: number; quantity?: number; }
export interface AnalyticsDashboard {
  kpis: Record<string, number>;
  trend: { label:string; revenue:number; sales:number; orders:number }[];
  topProducts: { name:string; units:number; revenue:number; transactions:{id:string;invoiceNumber:string;date:string;quantity:number;amount:number;customer:string}[] }[];
  topCategories: { name:string; units:number; revenue:number }[];
  paymentMethods: MetricItem[];
  salesChannels: MetricItem[];
  inventoryByCategory: MetricItem[];
  stockStatus: MetricItem[];
  lowStock: {productId:string;name:string;sku:string;stock:number;reorderLevel:number}[];
  outOfStock: {productId:string;name:string;sku:string}[];
  options: {products:{id:string;name:string}[];categories:{id:string;name:string}[];brands:string[]};
  lastUpdated: string;
}
export const getAnalyticsDashboard = async (params: AnalyticsFilters) =>
  (await axiosInstance.get<AnalyticsDashboard>("/analytics/dashboard", { params })).data;
export const logAnalyticsAction = async (action:string, details:string) =>
  (await axiosInstance.post("/analytics/audit", { action, details })).data;
