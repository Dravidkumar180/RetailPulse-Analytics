/* Teaching guide: This file contains the reset password page page.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Imports the needed tools from react.
import { useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
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

// Imports the needed tools from @mui/icons-material/LockResetOutlined.
import LockResetOutlinedIcon from "@mui/icons-material/LockResetOutlined";
// Imports the needed tools from @mui/icons-material/VisibilityOutlined.
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
// Imports the needed tools from @mui/icons-material/VisibilityOffOutlined.
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

import {
  resetPassword,
  // Defines the message response type.
  type MessageResponse,
  // Defines the reset password request type.
  type ResetPasswordRequest,
} from "../../../api/authApi";

// Imports the needed tools from ../../../components/common/Button/Button.
import Button from "../../../components/common/Button/Button";
// Imports the needed tools from ../../../components/common/FormInput/FormInput.
import FormInput from "../../../components/common/FormInput/FormInput";

// Loads ./ResetPasswordPage.css styles or setup.
import "./ResetPasswordPage.css";

// Defines the fields allowed in reset password form data.
interface ResetPasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

// Gets error message.
const getErrorMessage = (error: unknown): string => {
  // Checks whether this condition is true.
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    // Stores axios error for the steps below.
    const axiosError = error as {
      response?: {
        data?: {
          detail?: string;
          message?: string;
        };
      };
    };

    // Builds the visible interface below.
    return (
      axiosError.response?.data?.detail ??
      axiosError.response?.data?.message ??
      "The reset link is invalid or has expired."
    );
  }

  // Checks whether this condition is true.
  if (error instanceof Error) {
    // Returns the completed result to the caller.
    return error.message;
  }

  // Returns the completed result to the caller.
  return "Unable to reset the password. Please try again.";
};

// Shows the reset password page.
const ResetPasswordPage = () => {
  // Stores navigate for the steps below.
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Stores reset token for the steps below.
  const resetToken = searchParams.get("token") ?? "";

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onBlur",
  });

  // Stores password value for the steps below.
  const passwordValue = watch("newPassword");

  // Stores reset password mutation for the steps below.
  const resetPasswordMutation = useMutation<
    MessageResponse,
    Error,
    ResetPasswordRequest
  >({
    mutationFn: resetPassword,

    onSuccess: () => {
      // Updates the page or stored state with this result.
      navigate("/login", {
        replace: true,
        state: {
          passwordResetSuccess:
            "Your password has been reset successfully. You can now sign in.",
        },
      });
    },
  });

  // Runs on submit logic.
  const onSubmit = (formData: ResetPasswordFormData) => {
    // Checks whether this condition is true.
    if (!resetToken) {
      // Returns the completed result to the caller.
      return;
    }

    resetPasswordMutation.mutate({
      token: resetToken,
      newPassword: formData.newPassword,
      confirmPassword: formData.confirmPassword,
    });
  };

  // Checks whether this condition is true.
  if (!resetToken) {
    // Builds the visible interface below.
    return (
      <Box className="reset-password-page">
        <Box className="reset-password-page__card">
          <Box className="reset-password-page__icon reset-password-page__icon--error">
            <LockResetOutlinedIcon />
          </Box>

          <Box className="reset-password-page__header">
            <Typography component="h1">
              Invalid reset link
            </Typography>

            <Typography component="p">
              This password reset link does not contain a valid token.
              Request a new password reset link.
            </Typography>
          </Box>

          <Alert
            severity="error"
            className="reset-password-page__alert"
          >
            Password reset token is missing.
          </Alert>

          <Link
            to="/forgot-password"
            className="reset-password-page__request-link"
          >
            Request a new reset link
          </Link>
        </Box>
      </Box>
    );
  }

  // Builds the visible interface below.
  return (
    <Box className="reset-password-page">
      <Box className="reset-password-page__card">
        <Box className="reset-password-page__icon">
          <LockResetOutlinedIcon />
        </Box>

        <Box className="reset-password-page__header">
          <Typography component="h1">
            Forgot Password
          </Typography>

          <Typography component="p">
            Reset your account password securely
          </Typography>
        </Box>

        {resetPasswordMutation.isError && (
          <Alert
            severity="error"
            className="reset-password-page__alert"
          >
            {getErrorMessage(resetPasswordMutation.error)}
          </Alert>
        )}

        <Box
          component="form"
          className="reset-password-page__form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="reset-password-page__password-field">
            <FormInput
              name="password"
              label="New Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your new password"
              autoComplete="new-password"
              required
              registration={register("newPassword", {
                required: "New password is required.",

                minLength: {
                  value: 8,
                  message:
                    "Password must contain at least 8 characters.",
                },

                maxLength: {
                  value: 128,
                  message:
                    "Password must not exceed 128 characters.",
                },

                pattern: {
                  value:
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
                  message:
                    "Use uppercase, lowercase, number and special character.",
                },
              })}
              error={errors.newPassword?.message}
            />

            <IconButton
              type="button"
              className="reset-password-page__password-toggle"
              aria-label={
                showPassword
                  ? "Hide new password"
                  : "Show new password"
              }
              onClick={() =>
                // Updates the page or stored state with this result.
                setShowPassword((current) => !current)
              }
            >
              {showPassword ? (
                <VisibilityOffOutlinedIcon />
              ) : (
                <VisibilityOutlinedIcon />
              )}
            </IconButton>
          </div>

          <div className="reset-password-page__password-field">
            <FormInput
              name="confirmPassword"
              label="Confirm New Password"
              type={
                showConfirmPassword ? "text" : "password"
              }
              placeholder="Enter your new password again"
              autoComplete="new-password"
              required
              registration={register("confirmPassword", {
                required: "Confirm password is required.",

                validate: (value) =>
                  value === passwordValue ||
                  "Password and confirm password must match.",
              })}
              error={errors.confirmPassword?.message}
            />

            <IconButton
              type="button"
              className="reset-password-page__password-toggle"
              aria-label={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
              onClick={() =>
                // Updates the page or stored state with this result.
                setShowConfirmPassword(
                  (current) => !current,
                )
              }
            >
              {showConfirmPassword ? (
                <VisibilityOffOutlinedIcon />
              ) : (
                <VisibilityOutlinedIcon />
              )}
            </IconButton>
          </div>

          <Button
            type="submit"
            fullWidth
            loading={resetPasswordMutation.isPending}
            disabled={resetPasswordMutation.isPending}
          >
            Reset Password
          </Button>
        </Box>

        <Box className="reset-password-page__back">
          <Typography component="span">Remembered your password?</Typography>
          <Link to="/login">Back to login</Link>
        </Box>
      </Box>
    </Box>
  );
};

export default ResetPasswordPage;
