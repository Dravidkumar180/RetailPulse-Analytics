/* Teaching guide: This file contains validation messages helper logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Stores validation messages for the steps below.
export const VALIDATION_MESSAGES = {
  required: (fieldName: string): string =>
    `${fieldName} is required.`,

  minimumLength: (
    fieldName: string,
    minimumLength: number,
  ): string =>
    `${fieldName} must contain at least ${minimumLength} characters.`,

  maximumLength: (
    fieldName: string,
    maximumLength: number,
  ): string =>
    `${fieldName} must not exceed ${maximumLength} characters.`,

  invalidEmail: "Enter a valid email address.",

  invalidPhoneNumber: "Enter a valid phone number.",

  weakPassword:
    "Use uppercase, lowercase, number and special character.",

  passwordMismatch:
    "Password and confirm password must match.",

  newPasswordMismatch:
    "New password and confirm password must match.",

  samePassword:
    "New password must be different from the current password.",

  companyAlreadyExists:
    "A company with this name or email already exists.",

  emailAlreadyExists:
    "An account with this email address already exists.",

  invalidCredentials:
    "Incorrect email address or password.",

  unauthorized:
    "You do not have permission to perform this action.",

  sessionExpired:
    "Your session has expired. Please sign in again.",

  genericError:
    "Something went wrong. Please try again.",
} as const;

// Gets required message.
export const getRequiredMessage = (
  fieldName: string,
): string => {
  // Returns the completed result to the caller.
  return VALIDATION_MESSAGES.required(fieldName);
};