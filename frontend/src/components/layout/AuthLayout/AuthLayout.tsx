/* Teaching guide: This file contains the auth layout user interface.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Imports the needed tools from react.
import { useEffect } from "react";
// Imports the needed tools from react-router-dom.
import { Outlet, useLocation } from "react-router-dom";
// Imports the needed tools from @mui/material.
import { Box, Typography } from "@mui/material";
// Imports the needed tools from @mui/icons-material/ShoppingCartOutlined.
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
// Loads ./AuthLayout.css styles or setup.
import "./AuthLayout.css";

// Shows the auth layout.
const AuthLayout = () => {
  const { pathname } = useLocation();
  // Stores is registration for the steps below.
  const isRegistration = pathname === "/register-company";
  // Stores is forgot password for the steps below.
  const isForgotPassword =
    pathname === "/forgot-password" || pathname === "/reset-password";
  // Runs layout modifier logic.
  const layoutModifier = isRegistration
    ? "auth-layout--registration"
    : isForgotPassword
      ? "auth-layout--forgot-password"
      : "auth-layout--login";

  useEffect(() => {
    document.documentElement.classList.add("auth-page");
    document.body.classList.add("auth-page");

    // Builds the visible interface below.
    return () => {
      document.documentElement.classList.remove("auth-page");
      document.body.classList.remove("auth-page");
    };
  }, []);

  // Returns the completed result to the caller.
  return <Box className={`auth-layout ${layoutModifier}`}>
    <Box className="auth-layout__content-panel">
      <Box className="auth-layout__mobile-logo"><ShoppingCartOutlinedIcon /><Typography component="span">RetailPulse Analytics</Typography></Box>
      <Box className="auth-layout__form-wrapper"><Outlet /></Box>
    </Box>
  </Box>;
};
export default AuthLayout;
