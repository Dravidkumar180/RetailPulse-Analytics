/* Teaching guide: This file contains change password schema data validation.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

import type {
  RegisterOptions,
} from "react-hook-form";

import type {
  ChangePasswordRequest,
} from "../api/authApi";
import {
  STRONG_PASSWORD_PATTERN,
} from "./companyRegistrationSchema";

// Stores change password validation schema for the steps below.
export const changePasswordValidationSchema: {
  currentPassword: RegisterOptions<
    ChangePasswordRequest,
    "currentPassword"
  >;
  newPassword: RegisterOptions<
    ChangePasswordRequest,
    "newPassword"
  >;
} = {
  currentPassword: {
    required: "Current password is required.",
    maxLength: {
      value: 128,
      message:
        "Current password must not exceed 128 characters.",
    },
  },

  newPassword: {
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
      value: STRONG_PASSWORD_PATTERN,
      message:
        "Use uppercase, lowercase, number and special character.",
    },
  },
};

// Adds new password validation.
export const createNewPasswordValidation = (
  currentPassword: string,
): RegisterOptions<
  ChangePasswordRequest,
  "newPassword"
> => ({
  ...changePasswordValidationSchema.newPassword,

  validate: (value) =>
    value !== currentPassword ||
    "New password must be different from the current password.",
});

// Adds change password confirmation validation.
export const createChangePasswordConfirmationValidation = (
  newPassword: string,
): RegisterOptions<
  ChangePasswordRequest,
  "confirmPassword"
> => ({
  required: "Confirm password is required.",

  validate: (value) =>
    value === newPassword ||
    "New password and confirm password must match.",
});