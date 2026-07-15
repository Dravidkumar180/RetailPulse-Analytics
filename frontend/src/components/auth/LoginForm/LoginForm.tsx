import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  Alert,
  Box,
  IconButton,
  Typography,
} from "@mui/material";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

import type {
  LoginRequest,
} from "../../../api/authApi";
import { useAuth } from "../../../hooks/useAuth";
import Button from "../../common/Button/Button";
import FormInput from "../../common/FormInput/FormInput";

import "./LoginForm.css";

interface LocationState {
  from?: {
    pathname?: string;
  };
}

const getErrorMessage = (error: unknown): string => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const axiosError = error as {
      response?: {
        data?: {
          detail?: string;
          message?: string;
        };
      };
    };

    return (
      axiosError.response?.data?.detail ??
      axiosError.response?.data?.message ??
      "Unable to login. Please check your email and password."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to login. Please try again.";
};

const LoginForm = () => {
  const navigate = useNavigate();
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

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      const state = location.state as LocationState | null;
      const previousPath = state?.from?.pathname;

      navigate(previousPath || "/dashboard", {
        replace: true,
      });
    },
  });

  const onSubmit = (formData: LoginRequest) => {
    loginMutation.mutate({
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
    });
  };

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
