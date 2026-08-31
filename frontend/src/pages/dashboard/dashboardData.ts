/* Teaching guide: This file contains dashboard data page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
// Converts dashboard API data into the values used by dashboard cards and charts.
// The shared values below keep formatting and business rules consistent.
export const SALES_CHANNELS = [
  ["Online Store", "₹982K", 100],
  ["Amazon", "₹642K", 68],
  ["Retail Outlet", "₹512K", 54],
  ["Flipkart", "₹314K", 34],
] as const;
export const TOP_CATEGORIES = [
  ["Electronics", "35%"],
  ["Fashion", "25%"],
  ["Home & Kitchen", "20%"],
  ["Beauty", "10%"],
  ["Others", "10%"],
] as const;
export const BEST_SELLERS = [
  ["Sony WH-1000XM5", "Electronics", "₹245,800", "1,245"],
  ["Apple AirPods Pro", "Electronics", "₹198,500", "1,103"],
  ["Nike Air Max 270", "Fashion", "₹154,300", "980"],
  ["Samsung Galaxy S23", "Electronics", "₹142,600", "876"],
  ["Adidas Ultraboost 22", "Fashion", "₹112,400", "765"],
] as const;
export const RECENT_ORDERS = [
  ["#ORD-001", "John Smith", "₹12,450", "Delivered"],
  ["#ORD-002", "Sarah Johnson", "₹8,990", "Processing"],
  ["#ORD-003", "Mike Brown", "₹15,230", "Shipped"],
  ["#ORD-004", "Emily Davis", "₹7,450", "Delivered"],
] as const;
