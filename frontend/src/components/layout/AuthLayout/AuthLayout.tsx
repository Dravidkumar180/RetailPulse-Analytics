import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import "./AuthLayout.css";

const AuthLayout = () => {
  const { pathname } = useLocation();
  const isRegistration = pathname === "/register-company";
  const isForgotPassword =
    pathname === "/forgot-password" || pathname === "/reset-password";
  const layoutModifier = isRegistration
    ? "auth-layout--registration"
    : isForgotPassword
      ? "auth-layout--forgot-password"
      : "auth-layout--login";

  useEffect(() => {
    document.documentElement.classList.add("auth-page");
    document.body.classList.add("auth-page");

    return () => {
      document.documentElement.classList.remove("auth-page");
      document.body.classList.remove("auth-page");
    };
  }, []);

  return <Box className={`auth-layout ${layoutModifier}`}>
    <Box className="auth-layout__content-panel">
      <Box className="auth-layout__mobile-logo"><ShoppingCartOutlinedIcon /><Typography component="span">RetailPulse Analytics</Typography></Box>
      <Box className="auth-layout__form-wrapper"><Outlet /></Box>
    </Box>
  </Box>;
};
export default AuthLayout;
