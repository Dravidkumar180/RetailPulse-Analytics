import axiosInstance from "./axiosInstance";

export type Recommendation = "IMMEDIATE_RESTOCK" | "REORDER_SOON" | "STOCK_HEALTHY" | "OVERSTOCK_RISK";
export interface ForecastProduct {
  id: string; productId: string; name: string; sku: string; brand?: string; category: string; categoryId: string;
  currentStock: number; reorderLevel: number; historicalSales: number; predictedDemand: number;
  confidence: number; growth: number; recommendation: Recommendation; generatedAt: string;
}
export interface ForecastCategory { name: string; historicalSales: number; predictedDemand: number; growth: number; confidence: number }
export interface ForecastDashboard {
  products: ForecastProduct[]; categories: ForecastCategory[]; generatedAt: string | null;
  options?: { brands: string[]; categories: string[] };
}
export const getForecasts = async (period: string) =>
  (await axiosInstance.get<ForecastDashboard>("/forecasts", { params: { period } })).data;
export const generateForecast = async (period: string, refresh = false) =>
  (await axiosInstance.post<ForecastDashboard>("/forecasts/generate", { period, refresh })).data;
export const recordForecastExport = async (report: string, period: string) =>
  (await axiosInstance.post("/forecasts/export", { report, period })).data;
