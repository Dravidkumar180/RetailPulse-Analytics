import { useState } from "react";
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
  changePassword,
  type ChangePasswordRequest,
} from "../../../api/authApi";
import Button from "../../common/Button/Button";
import FormInput from "../../common/FormInput/FormInput";

import "./ChangePasswordForm.css";

interface ChangePasswordFormProps {
  onPasswordChanged?: () => void;
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
      "Unable to change password."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to change password. Please try again.";
};

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

  const newPasswordValue = watch("newPassword");

  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      reset();
      onPasswordChanged?.();
    },
  });

  const onSubmit = (formData: ChangePasswordRequest) => {
    passwordMutation.mutate(formData);
  };

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