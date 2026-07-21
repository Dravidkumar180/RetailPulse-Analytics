/* Teaching guide: This file contains API requests and responses for sales api.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Imports the needed tools from ./axiosInstance.
import axiosInstance from "./axiosInstance";

// Defines the sales channel type.
export type SalesChannel = "RETAIL_STORE" | "ONLINE_STORE" | "MARKETPLACE";
// Defines the payment method type.
export type PaymentMethod = "CASH" | "CARD" | "UPI" | "BANK_TRANSFER";
// Defines the fields allowed in sale item input.
export interface SaleItemInput { productId:string; quantity:number; unitPrice:number; discount:number; tax:number; }
// Defines the fields allowed in sale input.
export interface SaleInput { customerName:string; saleDate:string; salesChannel:SalesChannel; paymentMethod:PaymentMethod; items:SaleItemInput[]; }
// Defines the fields allowed in sale item.
export interface SaleItem extends SaleItemInput { id:string; productName:string; categoryId:string; categoryName:string; total:number; remainingStock:number; }
// Defines the fields allowed in sale.
export interface Sale { id:string; invoiceNumber:string; customerName:string; saleDate:string; salesChannel:SalesChannel; paymentMethod:PaymentMethod; totalAmount:number; createdByName:string; items:SaleItem[]; createdAt:string; updatedAt:string; inventoryAlerts:string[]; }
// Defines the fields allowed in sales summary.
export interface SalesSummary { totalSales:number; totalRevenue:number; totalOrders:number; averageOrderValue:number; }
// Defines the fields allowed in sales filters.
export interface SalesFilters { search?:string; startDate?:string; endDate?:string; categoryId?:string; salesChannel?:string; paymentMethod?:string; sort?:string; }

// Gets sales.
export const getSales = async (params:SalesFilters={}) => (await axiosInstance.get<{items:Sale[];total:number}>("/sales", { params })).data;
// Gets sales summary.
export const getSalesSummary = async () => (await axiosInstance.get<SalesSummary>("/sales/summary")).data;
// Adds sale.
export const createSale = async (data:SaleInput) => (await axiosInstance.post<Sale>("/sales", data)).data;
// Saves sale.
export const updateSale = async (id:string,data:SaleInput) => (await axiosInstance.put<Sale>(`/sales/${id}`, data)).data;
// Removes sale.
export const deleteSale = async (id:string) => { await axiosInstance.delete(`/sales/${id}`); };
