/* Teaching guide: This file contains the protected route user interface.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Imports the needed tools from react-router-dom.
import { Navigate, Outlet, useLocation } from "react-router-dom";

// Imports the needed tools from ../common/LoadingSpinner/LoadingSpinner.
import LoadingSpinner from "../common/LoadingSpinner/LoadingSpinner";
// Imports the needed tools from ../../hooks/useAuth.
import { useAuth } from "../../hooks/useAuth";

// Defines the fields allowed in protected route props.
interface ProtectedRouteProps {
  redirectPath?: string;
}

// Shows the protected route.
const ProtectedRoute = ({
  redirectPath = "/login",
}: ProtectedRouteProps) => {
  // Stores location for the steps below.
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  // Checks whether this condition is true.
  if (isLoading) {
    // Builds the visible interface below.
    return (
      <LoadingSpinner
        fullScreen
        message="Checking your authentication..."
      />
    );
  }

  // Checks whether this condition is true.
  if (!isAuthenticated) {
    // Builds the visible interface below.
    return (
      <Navigate
        to={redirectPath}
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  // Returns the completed result to the caller.
  return <Outlet />;
};

export default ProtectedRoute;