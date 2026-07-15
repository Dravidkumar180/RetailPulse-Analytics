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
  reports: "/reports",
  analytics: "/analytics",
  companies: "/companies",
  settings: "/settings",

  unauthorized: "/unauthorized",
  notFound: "*",
} as const;

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
  | typeof ROUTE_PATHS.reports
  | typeof ROUTE_PATHS.analytics
  | typeof ROUTE_PATHS.companies
  | typeof ROUTE_PATHS.settings
  | typeof ROUTE_PATHS.unauthorized;
