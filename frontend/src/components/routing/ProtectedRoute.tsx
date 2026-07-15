import { Navigate, Outlet, useLocation } from "react-router-dom";

import LoadingSpinner from "../common/LoadingSpinner/LoadingSpinner";
import { useAuth } from "../../hooks/useAuth";

interface ProtectedRouteProps {
  redirectPath?: string;
}

const ProtectedRoute = ({
  redirectPath = "/login",
}: ProtectedRouteProps) => {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <LoadingSpinner
        fullScreen
        message="Checking your authentication..."
      />
    );
  }

  if (!isAuthenticated) {
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

  return <Outlet />;
};

export default ProtectedRoute;