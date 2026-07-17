import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import AuthLayout from "../components/layout/AuthLayout/AuthLayout";
import DashboardLayout from "../components/layout/DashboardLayout/DashboardLayout";
import ProtectedRoute from "../components/routing/ProtectedRoute";
import RoleProtectedRoute from "../components/routing/RoleProtectedRoute";

import LoginPage from "../pages/auth/LoginPage/LoginPage";
import CompanyRegistrationPage from "../pages/auth/CompanyRegistrationPage/CompanyRegistrationPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage/ResetPasswordPage";

import DashboardPage from "../pages/dashboard/DashboardPage";
import ProfilePage from "../pages/profile/ProfilePage";
import UsersPage from "../pages/users/UsersPage";
import AuditLogsPage from "../pages/auditLogs/AuditLogsPage";
import UnauthorizedPage from "../pages/unauthorized/UnauthorizedPage";
import SectionPage from "../pages/section/SectionPage";
import ProductsPage from "../pages/products/ProductsPage";
import CategoriesPage from "../pages/categories/CategoriesPage";
import SalesPage from "../pages/sales/SalesPage";

import { ROUTE_PATHS } from "./routePaths";

const AppRoutes = () => {
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
          <Route
            path={ROUTE_PATHS.dashboard}
            element={<DashboardPage />}
          />

          <Route
            path={ROUTE_PATHS.profile}
            element={<ProfilePage />}
          />

          <Route
            element={<RoleProtectedRoute allowedRoles={["SUPER_ADMIN", "COMPANY_ADMIN", "ANALYST"]} />}
          >
            <Route path={ROUTE_PATHS.sales} element={<SalesPage />} />
          </Route>

          {[ROUTE_PATHS.analytics, ROUTE_PATHS.reports].map((path) => (
            <Route key={path} path={path} element={<SectionPage />} />
          ))}

          {/* Company Admin and Super Admin routes */}
          <Route
            element={
              <RoleProtectedRoute
                allowedRoles={[
                  "SUPER_ADMIN",
                  "COMPANY_ADMIN",
                ]}
              />
            }
          >
            <Route path={ROUTE_PATHS.products} element={<ProductsPage />} />
            <Route path={ROUTE_PATHS.categories} element={<CategoriesPage />} />
            <Route
              path={ROUTE_PATHS.users}
              element={<UsersPage />}
            />

            <Route
              path={ROUTE_PATHS.auditLogs}
              element={<AuditLogsPage />}
            />

            <Route path={ROUTE_PATHS.settings} element={<SectionPage />} />
          </Route>

          <Route element={<RoleProtectedRoute allowedRoles={["SUPER_ADMIN"]} />}>
            <Route path={ROUTE_PATHS.companies} element={<SectionPage />} />
          </Route>
        </Route>
      </Route>

      <Route
        path={ROUTE_PATHS.unauthorized}
        element={<UnauthorizedPage />}
      />

      <Route
        path={ROUTE_PATHS.root}
        element={
          <Navigate
            to={ROUTE_PATHS.authentication.login}
            replace
          />
        }
      />

      <Route
        path={ROUTE_PATHS.notFound}
        element={
          <Navigate
            to={ROUTE_PATHS.dashboard}
            replace
          />
        }
      />
    </Routes>
  );
};

export default AppRoutes;
