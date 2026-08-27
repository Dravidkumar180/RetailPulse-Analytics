// Defines inventory forecast types and the API request used by the replenishment dashboard.
import axiosInstance from "./axiosInstance";
// The exported types describe the data exchanged with the backend.
export type StockRisk =
  | "OUT_OF_STOCK"
  | "STOCKOUT_RISK"
  | "LOW_STOCK"
  | "HEALTHY"
  | "OVERSTOCK";
export interface InventoryForecastItem {
  productId: string;
  product: string;
  sku: string;
  category: string;
  supplier: string;
  currentStock: number;
  averageDailySales: number;
  forecastedDemand: number;
  daysRemaining: number | null;
  reorderPoint: number;
  safetyStock: number;
  recommendedStock: number;
  recommendedQuantity: number;
  reorderRequired: boolean;
  risk: StockRisk;
  recommendation: string;
  hasSalesHistory: boolean;
  historyDays: number;
  dataQuality: "SUFFICIENT" | "LIMITED" | "NO_HISTORY";
  historicalDemand: { date: string; quantity: number }[];
  forecastDemand: { date: string; quantity: number }[];
  stockProjection: { date: string; stock: number }[];
}
export interface InventoryForecastResponse {
  items: InventoryForecastItem[];
  summary: Record<StockRisk, number> & {
    reorderRequired: number;
    total: number;
  };
  method: {
    name: string;
    lookbackDays: number;
    weights: number[];
    leadTimeDays: number;
    safetyStockFormula: string;
    reorderPointFormula: string;
    recommendedQuantityFormula: string;
  };
  generatedAt: string;
  cacheSeconds: number;
}
export const getInventoryForecast = async (days = 30) => {
  const response = (
    await axiosInstance.get<InventoryForecastResponse>("/inventory/forecast", {
      params: { forecast_days: days },
    })
  ).data;
  return {
    ...response,
    cacheSeconds: response.cacheSeconds ?? 300,
    method: {
      ...response.method,
      safetyStockFormula:
        response.method.safetyStockFormula ?? "50% of lead-time demand",
    },
    items: response.items.map((item) => ({
      ...item,
      historyDays: item.historyDays ?? (item.hasSalesHistory ? 30 : 0),
      dataQuality:
        item.dataQuality ?? (item.hasSalesHistory ? "LIMITED" : "NO_HISTORY"),
      historicalDemand: item.historicalDemand ?? [],
      forecastDemand: item.forecastDemand ?? [],
      stockProjection: item.stockProjection ?? [],
    })),
  } satisfies InventoryForecastResponse;
};
