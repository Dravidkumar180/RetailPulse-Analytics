/* Teaching guide: This file contains app routes application logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

import { Navigate, Route, Routes } from "react-router-dom";

// Imports the needed tools from ../components/layout/AuthLayout/AuthLayout.
import AuthLayout from "../components/layout/AuthLayout/AuthLayout";
// Imports the needed tools from ../components/layout/DashboardLayout/DashboardLayout.
import DashboardLayout from "../components/layout/DashboardLayout/DashboardLayout";
// Imports the needed tools from ../components/routing/ProtectedRoute.
import ProtectedRoute from "../components/routing/ProtectedRoute";
// Imports the needed tools from ../components/routing/RoleProtectedRoute.
import RoleProtectedRoute from "../components/routing/RoleProtectedRoute";

// Imports the needed tools from ../pages/auth/LoginPage/LoginPage.
import LoginPage from "../pages/auth/LoginPage/LoginPage";
// Imports the needed tools from ../pages/auth/CompanyRegistrationPage/CompanyRegistrationPage.
import CompanyRegistrationPage from "../pages/auth/CompanyRegistrationPage/CompanyRegistrationPage";
// Imports the needed tools from ../pages/auth/ForgotPasswordPage/ForgotPasswordPage.
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage/ForgotPasswordPage";
// Imports the needed tools from ../pages/auth/ResetPasswordPage/ResetPasswordPage.
import ResetPasswordPage from "../pages/auth/ResetPasswordPage/ResetPasswordPage";

// Imports the needed tools from ../pages/dashboard/DashboardPage.
import DashboardPage from "../pages/dashboard/DashboardPage";
// Imports the needed tools from ../pages/profile/ProfilePage.
import ProfilePage from "../pages/profile/ProfilePage";
// Imports the needed tools from ../pages/users/UsersPage.
import UsersPage from "../pages/users/UsersPage";
// Imports the needed tools from ../pages/auditLogs/AuditLogsPage.
import AuditLogsPage from "../pages/auditLogs/AuditLogsPage";
// Imports the needed tools from ../pages/unauthorized/UnauthorizedPage.
import UnauthorizedPage from "../pages/unauthorized/UnauthorizedPage";
// Imports the needed tools from ../pages/section/SectionPage.
import SectionPage from "../pages/section/SectionPage";
// Imports the needed tools from ../pages/products/ProductsPage.
import ProductsPage from "../pages/products/ProductsPage";
// Imports the needed tools from ../pages/categories/CategoriesPage.
import CategoriesPage from "../pages/categories/CategoriesPage";
// Imports the needed tools from ../pages/sales/SalesPage.
import SalesPage from "../pages/sales/SalesPage";
// Imports the Inventory Management overview and stock movement page.
import InventoryPage from "../pages/inventory/InventoryPage";

// Imports the needed tools from ./routePaths.
import { ROUTE_PATHS } from "./routePaths";

// Shows the app routes.
const AppRoutes = () => {
  // Builds the visible interface below.
  return (
    <Routes>
      {/* Public authentication routes */}
      <Route element={<AuthLayout />}>
        <Route
          path={ROUTE_PATHS.authentication.login}
          element={<LoginPage />}
        />

        <Route
          path={ROUTE_PATHS.authentication.registerCompany}
          element={<CompanyRegistrationPage />}
        />

        <Route
          path={ROUTE_PATHS.authentication.forgotPassword}
          element={<ForgotPasswordPage />}
        />

        <Route
          path={ROUTE_PATHS.authentication.resetPassword}
          element={<ResetPasswordPage />}
        />
      </Route>

      {/* All routes inside this section require authentication */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path={ROUTE_PATHS.dashboard} element={<DashboardPage />} />

          <Route path={ROUTE_PATHS.profile} element={<ProfilePage />} />

          <Route
            element={
              <RoleProtectedRoute
                allowedRoles={["SUPER_ADMIN", "COMPANY_ADMIN", "ANALYST"]}
              />
            }
          >
            <Route path={ROUTE_PATHS.sales} element={<SalesPage />} />
            {/* Inventory is shared by Admins and Analysts under this role guard. */}
            <Route path={ROUTE_PATHS.inventory} element={<InventoryPage />} />
          </Route>

          {[ROUTE_PATHS.analytics, ROUTE_PATHS.reports].map((path) => (
            <Route key={path} path={path} element={<SectionPage />} />
          ))}

          {/* Company Admin and Super Admin routes */}
          <Route
            element={
              <RoleProtectedRoute
                allowedRoles={["SUPER_ADMIN", "COMPANY_ADMIN"]}
              />
            }
          >
            <Route path={ROUTE_PATHS.products} element={<ProductsPage />} />
            <Route path={ROUTE_PATHS.categories} element={<CategoriesPage />} />
            <Route path={ROUTE_PATHS.users} element={<UsersPage />} />

            <Route path={ROUTE_PATHS.auditLogs} element={<AuditLogsPage />} />

            <Route path={ROUTE_PATHS.settings} element={<SectionPage />} />
          </Route>

          <Route
            element={<RoleProtectedRoute allowedRoles={["SUPER_ADMIN"]} />}
          >
            <Route path={ROUTE_PATHS.companies} element={<SectionPage />} />
          </Route>
        </Route>
      </Route>

      <Route path={ROUTE_PATHS.unauthorized} element={<UnauthorizedPage />} />

      <Route
        path={ROUTE_PATHS.root}
        element={<Navigate to={ROUTE_PATHS.authentication.login} replace />}
      />

      <Route
        path={ROUTE_PATHS.notFound}
        element={<Navigate to={ROUTE_PATHS.dashboard} replace />}
      />
    </Routes>
  );
};

export default AppRoutes;
