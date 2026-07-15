import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";

import type { UserRole } from "../../api/authApi";
import LoadingSpinner from "../common/LoadingSpinner/LoadingSpinner";
import { useAuth } from "../../hooks/useAuth";

interface RoleProtectedRouteProps {
  allowedRoles: UserRole[];
  redirectPath?: string;
  children?: ReactNode;
}

const RoleProtectedRoute = ({
  allowedRoles,
  redirectPath = "/unauthorized",
  children,
}: RoleProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <LoadingSpinner
        fullScreen
        message="Checking your permissions..."
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (!user?.role || !allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to={redirectPath}
        replace
      />
    );
  }

  if (children) {
    return children;
  }

  return <Outlet />;
};

export default RoleProtectedRoute;