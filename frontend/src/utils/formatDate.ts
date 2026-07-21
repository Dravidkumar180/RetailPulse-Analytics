/* Teaching guide: This file contains format date helper logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Imports the needed tools from ./constants.
import { DATE_TIME_LOCALE } from "./constants";

// Checks valid date.
export const isValidDate = (
  value?: string | Date | null,
): boolean => {
  // Checks whether this condition is true.
  if (!value) {
    // Returns the completed result to the caller.
    return false;
  }

  // Stores date for the steps below.
  const date =
    value instanceof Date ? value : new Date(value);

  // Returns the completed result to the caller.
  return !Number.isNaN(date.getTime());
};

// Runs format date logic.
export const formatDate = (
  value?: string | Date | null,
  fallback = "Not available",
): string => {
  // Checks whether this condition is true.
  if (!isValidDate(value)) {
    // Returns the completed result to the caller.
    return fallback;
  }

  // Stores date for the steps below.
  const date =
    value instanceof Date ? value : new Date(value as string);

  // Returns the completed result to the caller.
  return new Intl.DateTimeFormat(DATE_TIME_LOCALE, {
    dateStyle: "medium",
  }).format(date);
};

// Runs format date time logic.
export const formatDateTime = (
  value?: string | Date | null,
  fallback = "Not available",
): string => {
  // Checks whether this condition is true.
  if (!isValidDate(value)) {
    // Returns the completed result to the caller.
    return fallback;
  }

  // Stores date for the steps below.
  const date =
    value instanceof Date ? value : new Date(value as string);

  // Returns the completed result to the caller.
  return new Intl.DateTimeFormat(DATE_TIME_LOCALE, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

// Runs format time logic.
export const formatTime = (
  value?: string | Date | null,
  fallback = "Not available",
): string => {
  // Checks whether this condition is true.
  if (!isValidDate(value)) {
    // Returns the completed result to the caller.
    return fallback;
  }

  // Stores date for the steps below.
  const date =
    value instanceof Date ? value : new Date(value as string);

  // Returns the completed result to the caller.
  return new Intl.DateTimeFormat(DATE_TIME_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

// Runs format relative date logic.
export const formatRelativeDate = (
  value?: string | Date | null,
  fallback = "Not available",
): string => {
  // Checks whether this condition is true.
  if (!isValidDate(value)) {
    // Returns the completed result to the caller.
    return fallback;
  }

  // Stores date for the steps below.
  const date =
    value instanceof Date ? value : new Date(value as string);

  // Stores difference in milliseconds for the steps below.
  const differenceInMilliseconds =
    date.getTime() - Date.now();

  // Stores difference in minutes for the steps below.
  const differenceInMinutes = Math.round(
    differenceInMilliseconds / (1000 * 60),
  );

  // Stores relative formatter for the steps below.
  const relativeFormatter = new Intl.RelativeTimeFormat(
    DATE_TIME_LOCALE,
    {
      numeric: "auto",
    },
  );

  // Checks whether this condition is true.
  if (Math.abs(differenceInMinutes) < 60) {
    // Returns the completed result to the caller.
    return relativeFormatter.format(
      differenceInMinutes,
      "minute",
    );
  }

  // Stores difference in hours for the steps below.
  const differenceInHours = Math.round(
    differenceInMinutes / 60,
  );

  // Checks whether this condition is true.
  if (Math.abs(differenceInHours) < 24) {
    // Returns the completed result to the caller.
    return relativeFormatter.format(
      differenceInHours,
      "hour",
    );
  }

  // Stores difference in days for the steps below.
  const differenceInDays = Math.round(
    differenceInHours / 24,
  );

  // Returns the completed result to the caller.
  return relativeFormatter.format(
    differenceInDays,
    "day",
  );
};

// Runs to date input value logic.
export const toDateInputValue = (
  value?: string | Date | null,
): string => {
  // Checks whether this condition is true.
  if (!isValidDate(value)) {
    // Returns the completed result to the caller.
    return "";
  }

  // Stores date for the steps below.
  const date =
    value instanceof Date ? value : new Date(value as string);

  // Stores year for the steps below.
  const year = date.getFullYear();
  // Stores month for the steps below.
  const month = String(date.getMonth() + 1).padStart(
    2,
    "0",
  );
  // Stores day for the steps below.
  const day = String(date.getDate()).padStart(
    2,
    "0",
  );

  // Returns the completed result to the caller.
  return `${year}-${month}-${day}`;
};