import { Link, useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";

import Button from "../../components/common/Button/Button";

import "./UnauthorizedPage.css";

const UnauthorizedPage = () => {
  const navigate = useNavigate();

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