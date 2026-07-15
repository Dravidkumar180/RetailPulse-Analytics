import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  Alert,
  Box,
  IconButton,
  Typography,
} from "@mui/material";

import LockResetOutlinedIcon from "@mui/icons-material/LockResetOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

import {
  forgotPassword,
  resetPassword,
  type MessageResponse,
} from "../../../api/authApi";

import Button from "../../../components/common/Button/Button";
import FormInput from "../../../components/common/FormInput/FormInput";

import "./ForgotPasswordPage.css";

interface DevelopmentResetFormData {
  email: string;
  newPassword: string;
  confirmPassword: string;
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
      "Unable to process the password reset request."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to process the request. Please try again.";
};

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<DevelopmentResetFormData>({
    defaultValues: {
      email: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onBlur",
  });

  const passwordValue = watch("newPassword");

  const forgotPasswordMutation = useMutation<
    MessageResponse,
    Error,
    DevelopmentResetFormData
  >({
    mutationFn: async (formData) => {
      const resetRequest = await forgotPassword({
        email: formData.email.trim().toLowerCase(),
      });

      if (!resetRequest.resetToken) {
        throw new Error(
          "Local password reset is disabled. Enable the development reset-token flag or use the emailed reset link.",
        );
      }

      return resetPassword({
        token: resetRequest.resetToken,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });
    },
    onSuccess: () => {
      navigate("/login", {
        replace: true,
        state: {
          passwordResetSuccess:
            "Your password has been reset successfully. You can now sign in.",
        },
      });
    },
  });

  const onSubmit = (formData: DevelopmentResetFormData) => {
    forgotPasswordMutation.mutate(formData);
  };

  return (
    <Box className="forgot-password-page">
      <Box className="forgot-password-page__card">
        <Box className="forgot-password-page__icon">
          <LockResetOutlinedIcon />
        </Box>

        <Box className="forgot-password-page__header">
          <Typography component="h1">
            Forgot Password
          </Typography>

          <Typography component="p">
            Reset your account password securely
          </Typography>
        </Box>

        {forgotPasswordMutation.isError && (
          <Alert
            severity="error"
            className="forgot-password-page__alert"
          >
            {getErrorMessage(forgotPasswordMutation.error)}
          </Alert>
        )}

        <Box
          component="form"
          className="forgot-password-page__form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <FormInput
            name="email"
            label="Email / Name"
            type="email"
            placeholder="Enter your registered email"
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

          <div className="forgot-password-page__password-field">
            <FormInput
              name="newPassword"
              label="New Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              autoComplete="new-password"
              required
              registration={register("newPassword", {
                required: "New password is required.",
                minLength: {
                  value: 8,
                  message: "Password must contain at least 8 characters.",
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
                  message: "Use uppercase, lowercase, number and special character.",
                },
              })}
              error={errors.newPassword?.message}
            />
            <IconButton
              type="button"
              className="forgot-password-page__password-toggle"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
            </IconButton>
          </div>

          <div className="forgot-password-page__password-field">
            <FormInput
              name="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              autoComplete="new-password"
              required
              registration={register("confirmPassword", {
                required: "Confirm password is required.",
                validate: (value) =>
                  value === passwordValue || "Password and confirm password must match.",
              })}
              error={errors.confirmPassword?.message}
            />
            <IconButton
              type="button"
              className="forgot-password-page__password-toggle"
              onClick={() => setShowConfirmPassword((current) => !current)}
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirmPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
            </IconButton>
          </div>

          <Button
            type="submit"
            fullWidth
            loading={forgotPasswordMutation.isPending}
            disabled={forgotPasswordMutation.isPending}
          >
            Reset Password
          </Button>
        </Box>

        <Box className="forgot-password-page__back">
          <Typography component="span">Remembered your password?</Typography>
          <Link to="/login">Back to login</Link>
        </Box>
      </Box>
    </Box>
  );
};

export default ForgotPasswordPage;
