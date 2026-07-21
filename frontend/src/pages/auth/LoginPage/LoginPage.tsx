/* Teaching guide: This file contains the login page page.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Imports the needed tools from react.
import { useEffect } from "react";
// Imports the needed tools from react-router-dom.
import { useLocation, useNavigate } from "react-router-dom";
// Imports the needed tools from @mui/material.
import { Alert, Box } from "@mui/material";

// Imports the needed tools from ../../../components/auth/LoginForm/LoginForm.
import LoginForm from "../../../components/auth/LoginForm/LoginForm";
// Imports the needed tools from ../../../hooks/useAuth.
import { useAuth } from "../../../hooks/useAuth";

// Loads ./LoginPage.css styles or setup.
import "./LoginPage.css";

// Defines the fields allowed in login location state.
interface LoginLocationState {
  registrationSuccess?: string;
  passwordResetSuccess?: string;
}

// Shows the login page.
const LoginPage = () => {
  // Stores location for the steps below.
  const location = useLocation();
  // Runs navigate logic.
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  // Runs location state logic.
  const locationState =
    location.state as LoginLocationState | null;

  useEffect(() => {
    // Checks whether this condition is true.
    if (!isLoading && isAuthenticated) {
      // Updates the page or stored state with this result.
      navigate("/dashboard", {
        replace: true,
      });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Checks whether this condition is true.
  if (isLoading) {
    // Returns the completed result to the caller.
    return null;
  }

  // Builds the visible interface below.
  return (
    <Box className="login-page">
      {locationState?.registrationSuccess && (
        <Alert
          severity="success"
          className="login-page__alert"
          onClose={() => {
            // Updates the page or stored state with this result.
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
            // Updates the page or stored state with this result.
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