/* Teaching guide: This file contains login schema data validation.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

import type {
  RegisterOptions,
} from "react-hook-form";

// Imports the needed tools from ../api/authApi.
import type { LoginRequest } from "../api/authApi";

// Stores email pattern for the steps below.
export const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Stores login validation schema for the steps below.
export const loginValidationSchema: {
  email: RegisterOptions<LoginRequest, "email">;
  password: RegisterOptions<LoginRequest, "password">;
} = {
  email: {
    required: "Email address is required.",
    pattern: {
      value: EMAIL_PATTERN,
      message: "Enter a valid email address.",
    },
    maxLength: {
      value: 255,
      message:
        "Email address must not exceed 255 characters.",
    },
  },

  password: {
    required: "Password is required.",
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
  },
};