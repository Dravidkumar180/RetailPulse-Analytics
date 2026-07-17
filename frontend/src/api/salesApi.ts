import axiosInstance from "./axiosInstance";

export type SalesChannel = "RETAIL_STORE" | "ONLINE_STORE" | "MARKETPLACE";
export type PaymentMethod = "CASH" | "CARD" | "UPI" | "BANK_TRANSFER";
export interface SaleItemInput { productId:string; quantity:number; unitPrice:number; discount:number; tax:number; }
export interface SaleInput { customerName:string; saleDate:string; salesChannel:SalesChannel; paymentMethod:PaymentMethod; items:SaleItemInput[]; }
export interface SaleItem extends SaleItemInput { id:string; productName:string; categoryId:string; categoryName:string; total:number; remainingStock:number; }
export interface Sale { id:string; invoiceNumber:string; customerName:string; saleDate:string; salesChannel:SalesChannel; paymentMethod:PaymentMethod; totalAmount:number; createdByName:string; items:SaleItem[]; createdAt:string; updatedAt:string; inventoryAlerts:string[]; }
export interface SalesSummary { totalSales:number; totalRevenue:number; totalOrders:number; averageOrderValue:number; }
export interface SalesFilters { search?:string; startDate?:string; endDate?:string; categoryId?:string; salesChannel?:string; paymentMethod?:string; sort?:string; }

export const getSales = async (params:SalesFilters={}) => (await axiosInstance.get<{items:Sale[];total:number}>("/sales", { params })).data;
export const getSalesSummary = async () => (await axiosInstance.get<SalesSummary>("/sales/summary")).data;
export const createSale = async (data:SaleInput) => (await axiosInstance.post<Sale>("/sales", data)).data;
export const updateSale = async (id:string,data:SaleInput) => (await axiosInstance.put<Sale>(`/sales/${id}`, data)).data;
export const deleteSale = async (id:string) => { await axiosInstance.delete(`/sales/${id}`); };
