/* Teaching guide: This file contains the change password form user interface.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Imports the needed tools from react.
import { useState } from "react";
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
  changePassword,
  // Defines the change password request type.
  type ChangePasswordRequest,
} from "../../../api/authApi";
// Imports the needed tools from ../../common/Button/Button.
import Button from "../../common/Button/Button";
// Imports the needed tools from ../../common/FormInput/FormInput.
import FormInput from "../../common/FormInput/FormInput";

// Loads ./ChangePasswordForm.css styles or setup.
import "./ChangePasswordForm.css";

// Defines the fields allowed in change password form props.
interface ChangePasswordFormProps {
  onPasswordChanged?: () => void;
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
      "Unable to change password."
    );
  }

  // Checks whether this condition is true.
  if (error instanceof Error) {
    // Returns the completed result to the caller.
    return error.message;
  }

  // Returns the completed result to the caller.
  return "Unable to change password. Please try again.";
};

// Shows the change password form.
const ChangePasswordForm = ({
  onPasswordChanged,
}: ChangePasswordFormProps) => {
  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordRequest>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onBlur",
  });

  // Runs new password value logic.
  const newPasswordValue = watch("newPassword");

  // Runs password mutation logic.
  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      reset();
      onPasswordChanged?.();
    },
  });

  // Runs on submit logic.
  const onSubmit = (formData: ChangePasswordRequest) => {
    passwordMutation.mutate(formData);
  };

  // Builds the visible interface below.
  return (
    <Box
      component="form"
      className="change-password-form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <Box className="change-password-form__header">
        <Box className="change-password-form__header-icon">
          <LockResetOutlinedIcon />
        </Box>

        <Box>
          <Typography component="h2">
            Change Password
          </Typography>

          <Typography component="p">
            Update your password to keep your account secure.
          </Typography>
        </Box>
      </Box>

      {passwordMutation.isSuccess && (
        <Alert severity="success">
          Password changed successfully.
        </Alert>
      )}

      {passwordMutation.isError && (
        <Alert severity="error">
          {getErrorMessage(passwordMutation.error)}
        </Alert>
      )}

      <Box className="change-password-form__fields">
        <div className="change-password-form__password-field">
          <FormInput
            name="currentPassword"
            label="Current Password"
            type={showCurrentPassword ? "text" : "password"}
            placeholder="Enter your current password"
            autoComplete="current-password"
            required
            registration={register("currentPassword", {
              required: "Current password is required.",
            })}
            error={errors.currentPassword?.message}
          />

          <IconButton
            type="button"
            className="change-password-form__password-toggle"
            aria-label={
              showCurrentPassword
                ? "Hide current password"
                : "Show current password"
            }
            onClick={() =>
              // Updates the page or stored state with this result.
              setShowCurrentPassword((current) => !current)
            }
          >
            {showCurrentPassword ? (
              <VisibilityOffOutlinedIcon />
            ) : (
              <VisibilityOutlinedIcon />
            )}
          </IconButton>
        </div>

        <div className="change-password-form__password-field">
          <FormInput
            name="newPassword"
            label="New Password"
            type={showNewPassword ? "text" : "password"}
            placeholder="Enter a new password"
            autoComplete="new-password"
            required
            helperText="Use at least 8 characters with uppercase, lowercase, number and special character."
            registration={register("newPassword", {
              required: "New password is required.",
              minLength: {
                value: 8,
                message:
                  "New password must contain at least 8 characters.",
              },
              maxLength: {
                value: 128,
                message:
                  "New password must not exceed 128 characters.",
              },
              pattern: {
                value:
                  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
                message:
                  "Use uppercase, lowercase, number and special character.",
              },
              validate: (value) =>
                value !== watch("currentPassword") ||
                "New password must be different from the current password.",
            })}
            error={errors.newPassword?.message}
          />

          <IconButton
            type="button"
            className="change-password-form__password-toggle"
            aria-label={
              showNewPassword
                ? "Hide new password"
                : "Show new password"
            }
            onClick={() =>
              // Updates the page or stored state with this result.
              setShowNewPassword((current) => !current)
            }
          >
            {showNewPassword ? (
              <VisibilityOffOutlinedIcon />
            ) : (
              <VisibilityOutlinedIcon />
            )}
          </IconButton>
        </div>

        <div className="change-password-form__password-field">
          <FormInput
            name="confirmPassword"
            label="Confirm New Password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Enter the new password again"
            autoComplete="new-password"
            required
            registration={register("confirmPassword", {
              required: "Confirm password is required.",
              validate: (value) =>
                value === newPasswordValue ||
                "New password and confirm password must match.",
            })}
            error={errors.confirmPassword?.message}
          />

          <IconButton
            type="button"
            className="change-password-form__password-toggle"
            aria-label={
              showConfirmPassword
                ? "Hide confirm password"
                : "Show confirm password"
            }
            onClick={() =>
              // Updates the page or stored state with this result.
              setShowConfirmPassword((current) => !current)
            }
          >
            {showConfirmPassword ? (
              <VisibilityOffOutlinedIcon />
            ) : (
              <VisibilityOutlinedIcon />
            )}
          </IconButton>
        </div>
      </Box>

      <Box className="change-password-form__actions">
        <Button
          type="button"
          variant="outlined"
          disabled={passwordMutation.isPending}
          onClick={() => reset()}
        >
          Clear
        </Button>

        <Button
          type="submit"
          loading={passwordMutation.isPending}
          disabled={passwordMutation.isPending}
        >
          Change Password
        </Button>
      </Box>
    </Box>
  );
};

export default ChangePasswordForm;