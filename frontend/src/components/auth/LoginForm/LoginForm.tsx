/* Teaching guide: This file contains the login form user interface.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Imports the needed tools from react.
import { useState } from "react";
// Imports the needed tools from react-router-dom.
import { Link, useLocation, useNavigate } from "react-router-dom";
// Imports the needed tools from @tanstack/react-query.
import { useMutation } from "@tanstack/react-query";
// Imports the needed tools from react-hook-form.
import { useForm } from "react-hook-form";
import {
  Alert,
  Box,
  IconButton,
  Typography,
} from "@mui/material";
// Imports the needed tools from @mui/icons-material/SecurityOutlined.
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
// Imports the needed tools from @mui/icons-material/StorefrontOutlined.
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
// Imports the needed tools from @mui/icons-material/VisibilityOutlined.
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
// Imports the needed tools from @mui/icons-material/VisibilityOffOutlined.
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

import type {
  LoginRequest,
} from "../../../api/authApi";
// Imports the needed tools from ../../../hooks/useAuth.
import { useAuth } from "../../../hooks/useAuth";
// Imports the needed tools from ../../common/Button/Button.
import Button from "../../common/Button/Button";
// Imports the needed tools from ../../common/FormInput/FormInput.
import FormInput from "../../common/FormInput/FormInput";

// Loads ./LoginForm.css styles or setup.
import "./LoginForm.css";

// Defines the fields allowed in location state.
interface LocationState {
  from?: {
    pathname?: string;
  };
}

// Gets error message.
const getErrorMessage = (error: unknown): string => {
  // Checks whether this condition is true.
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error.code === "ERR_NETWORK" ||
      error.code === "ECONNABORTED")
  ) {
    // Returns the completed result to the caller.
    return "Cannot reach the server. Please make sure the API is running and try again.";
  }

  // Checks whether this condition is true.
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    // Stores axios error for the steps below.
    const axiosError = error as {
      response?: {
        status?: number;
        data?: {
          detail?: string;
          message?: string;
        };
      };
    };

    // Checks whether this condition is true.
    if (
      axiosError.response?.status &&
      axiosError.response.status >= 500 &&
      !axiosError.response.data?.detail
    ) {
      // Returns the completed result to the caller.
      return "Cannot reach the server. Please make sure the API is running and try again.";
    }

    // Builds the visible interface below.
    return (
      axiosError.response?.data?.detail ??
      axiosError.response?.data?.message ??
      "Unable to login. Please check your email and password."
    );
  }

  // Checks whether this condition is true.
  if (error instanceof Error) {
    // Returns the completed result to the caller.
    return error.message;
  }

  // Returns the completed result to the caller.
  return "Unable to login. Please try again.";
};

// Shows the login form.
const LoginForm = () => {
  // Stores navigate for the steps below.
  const navigate = useNavigate();
  // Stores location for the steps below.
  const location = useLocation();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
  });

  // Logs the user in.
  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      // Stores state for the steps below.
      const state = location.state as LocationState | null;
      // Stores previous path for the steps below.
      const previousPath = state?.from?.pathname;

      // Updates the page or stored state with this result.
      navigate(previousPath || "/dashboard", {
        replace: true,
      });
    },
  });

  // Sends the login details.
  const onSubmit = (formData: LoginRequest) => {
    loginMutation.mutate({
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
    });
  };

  // Builds the visible interface below.
  return (
    <Box
      component="form"
      className="login-form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <Box className="login-form__main-icon">
        <StorefrontOutlinedIcon />
      </Box>

      <Box className="login-form__header">
        <Typography component="h1">Welcome back</Typography>

        <Typography component="p">
          Sign in to continue to RetailPulse Analytics.
        </Typography>
      </Box>

      {loginMutation.isError && (
        <Alert severity="error">
          {getErrorMessage(loginMutation.error)}
        </Alert>
      )}

      <Box className="login-form__fields">
        <FormInput
          name="email"
          label="Email Address"
          type="email"
          placeholder="Enter your email address"
          autoComplete="email"
          required
          registration={register("email", {
            required: "Email address is required.",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Enter a valid email address.",
            },
          })}
          error={errors.email?.message}
          inputProps={{
            maxLength: 255,
          }}
        />

        <div className="login-form__password-field">
          <FormInput
            name="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
            registration={register("password", {
              required: "Password is required.",
              minLength: {
                value: 8,
                message: "Password must contain at least 8 characters.",
              },
            })}
            error={errors.password?.message}
            inputProps={{
              maxLength: 128,
            }}
          />

          <IconButton
            className="login-form__password-toggle"
            type="button"
            aria-label={
              showPassword ? "Hide password" : "Show password"
            }
            onClick={() => setShowPassword((current) => !current)}
            edge="end"
          >
            {showPassword ? (
              <VisibilityOffOutlinedIcon />
            ) : (
              <VisibilityOutlinedIcon />
            )}
          </IconButton>
        </div>
      </Box>

      <Box className="login-form__options">
        <label className="login-form__remember">
          <input type="checkbox" /> Remember me
        </label>
        <Link to="/forgot-password" className="login-form__link">
          Forgot password?
        </Link>
      </Box>

      {/* Login button starts here. */}
      <Button
        type="submit"
        fullWidth
        loading={loginMutation.isPending}
        disabled={loginMutation.isPending}
        className="login-form__submit"
      >
        Sign In
      </Button>

      <Box className="login-form__register">
        <Typography component="span">
          Do not have a company account?
        </Typography>

        <Link
          to="/register-company"
          className="login-form__link login-form__link--bold"
        >
          Register your company
        </Link>
      </Box>

      <Box className="login-form__security-note">
        <SecurityOutlinedIcon />

        <Typography component="p">
          Your account is protected with secure JWT authentication.
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginForm;
