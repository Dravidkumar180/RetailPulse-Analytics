/* Teaching guide: This file contains the unauthorized page page.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Imports the needed tools from react-router-dom.
import { Link, useNavigate } from "react-router-dom";
// Imports the needed tools from @mui/material.
import { Box, Typography } from "@mui/material";
// Imports the needed tools from @mui/icons-material/LockOutlined.
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
// Imports the needed tools from @mui/icons-material/ArrowBackOutlined.
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
// Imports the needed tools from @mui/icons-material/DashboardOutlined.
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";

// Imports the needed tools from ../../components/common/Button/Button.
import Button from "../../components/common/Button/Button";

// Loads ./UnauthorizedPage.css styles or setup.
import "./UnauthorizedPage.css";

// Shows the unauthorized page.
const UnauthorizedPage = () => {
  // Stores navigate for the steps below.
  const navigate = useNavigate();

  // Builds the visible interface below.
  return (
    <Box className="unauthorized-page">
      <Box className="unauthorized-page__card">
        <Box className="unauthorized-page__icon">
          <LockOutlinedIcon />
        </Box>

        <Typography
          component="p"
          className="unauthorized-page__code"
        >
          403
        </Typography>

        <Typography component="h1">
          Access Denied
        </Typography>

        <Typography component="p" className="unauthorized-page__message">
          You are authenticated, but your account role does not have
          permission to access this page.
        </Typography>

        <Box className="unauthorized-page__actions">
          <Button
            variant="outlined"
            startIcon={<ArrowBackOutlinedIcon />}
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>

          <Button
            startIcon={<DashboardOutlinedIcon />}
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </Button>
        </Box>

        <Link to="/profile" className="unauthorized-page__profile-link">
          View your account role
        </Link>
      </Box>
    </Box>
  );
};

export default UnauthorizedPage;