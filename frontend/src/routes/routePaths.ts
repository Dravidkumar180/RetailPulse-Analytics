/* Teaching guide: This file contains route paths application logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Stores route paths for the steps below.
export const ROUTE_PATHS = {
  root: "/",

  authentication: {
    login: "/login",
    registerCompany: "/register-company",
    forgotPassword: "/forgot-password",
    resetPassword: "/reset-password",
  },

  dashboard: "/dashboard",
  profile: "/profile",
  users: "/users",
  auditLogs: "/audit-logs",

  products: "/products",
  categories: "/categories",
  sales: "/sales",
  // Stores the Inventory Management sidebar and protected-route path.
  inventory: "/inventory",
  reports: "/reports",
  analytics: "/analytics",
  companies: "/companies",
  settings: "/settings",

  unauthorized: "/unauthorized",
  notFound: "*",
} as const;

// Defines the route path type.
export type RoutePath =
  | typeof ROUTE_PATHS.root
  | typeof ROUTE_PATHS.authentication.login
  | typeof ROUTE_PATHS.authentication.registerCompany
  | typeof ROUTE_PATHS.authentication.forgotPassword
  | typeof ROUTE_PATHS.authentication.resetPassword
  | typeof ROUTE_PATHS.dashboard
  | typeof ROUTE_PATHS.profile
  | typeof ROUTE_PATHS.users
  | typeof ROUTE_PATHS.auditLogs
  | typeof ROUTE_PATHS.products
  | typeof ROUTE_PATHS.categories
  | typeof ROUTE_PATHS.sales
  // Includes Inventory in the compile-time list of supported application paths.
  | typeof ROUTE_PATHS.inventory
  | typeof ROUTE_PATHS.reports
  | typeof ROUTE_PATHS.analytics
  | typeof ROUTE_PATHS.companies
  | typeof ROUTE_PATHS.settings
  | typeof ROUTE_PATHS.unauthorized;
