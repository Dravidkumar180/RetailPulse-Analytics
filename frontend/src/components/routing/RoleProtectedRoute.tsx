/* Teaching guide: This file contains the role protected route user interface.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Imports the needed tools from react.
import type { ReactNode } from "react";
// Imports the needed tools from react-router-dom.
import { Navigate, Outlet } from "react-router-dom";

// Imports the needed tools from ../../api/authApi.
import type { UserRole } from "../../api/authApi";
// Imports the needed tools from ../common/LoadingSpinner/LoadingSpinner.
import LoadingSpinner from "../common/LoadingSpinner/LoadingSpinner";
// Imports the needed tools from ../../hooks/useAuth.
import { useAuth } from "../../hooks/useAuth";

// Defines the fields allowed in role protected route props.
interface RoleProtectedRouteProps {
  allowedRoles: UserRole[];
  redirectPath?: string;
  children?: ReactNode;
}

// Shows the role protected route.
const RoleProtectedRoute = ({
  allowedRoles,
  redirectPath = "/unauthorized",
  children,
}: RoleProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Checks whether this condition is true.
  if (isLoading) {
    // Builds the visible interface below.
    return (
      <LoadingSpinner
        fullScreen
        message="Checking your permissions..."
      />
    );
  }

  // Checks whether this condition is true.
  if (!isAuthenticated) {
    // Builds the visible interface below.
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // Checks whether this condition is true.
  if (!user?.role || !allowedRoles.includes(user.role)) {
    // Builds the visible interface below.
    return (
      <Navigate
        to={redirectPath}
        replace
      />
    );
  }

  // Checks whether this condition is true.
  if (children) {
    // Returns the completed result to the caller.
    return children;
  }

  // Returns the completed result to the caller.
  return <Outlet />;
};

export default RoleProtectedRoute;