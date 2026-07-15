import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, Box } from "@mui/material";

import LoginForm from "../../../components/auth/LoginForm/LoginForm";
import { useAuth } from "../../../hooks/useAuth";

import "./LoginPage.css";

interface LoginLocationState {
  registrationSuccess?: string;
  passwordResetSuccess?: string;
}

const LoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  const locationState =
    location.state as LoginLocationState | null;

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/dashboard", {
        replace: true,
      });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return null;
  }

  return (
    <Box className="login-page">
      {locationState?.registrationSuccess && (
        <Alert
          severity="success"
          className="login-page__alert"
          onClose={() => {
            navigate(location.pathname, {
              replace: true,
              state: {},
            });
          }}
        >
          {locationState.registrationSuccess}
        </Alert>
      )}

      {locationState?.passwordResetSuccess && (
        <Alert
          severity="success"
          className="login-page__alert"
          onClose={() => {
            navigate(location.pathname, {
              replace: true,
              state: {},
            });
          }}
        >
          {locationState.passwordResetSuccess}
        </Alert>
      )}

      <Box className="login-page__card">
        <LoginForm />
      </Box>
    </Box>
  );
};

export default LoginPage;