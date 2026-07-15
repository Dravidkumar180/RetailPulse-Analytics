import { DATE_TIME_LOCALE } from "./constants";

export const isValidDate = (
  value?: string | Date | null,
): boolean => {
  if (!value) {
    return false;
  }

  const date =
    value instanceof Date ? value : new Date(value);

  return !Number.isNaN(date.getTime());
};

export const formatDate = (
  value?: string | Date | null,
  fallback = "Not available",
): string => {
  if (!isValidDate(value)) {
    return fallback;
  }

  const date =
    value instanceof Date ? value : new Date(value as string);

  return new Intl.DateTimeFormat(DATE_TIME_LOCALE, {
    dateStyle: "medium",
  }).format(date);
};

export const formatDateTime = (
  value?: string | Date | null,
  fallback = "Not available",
): string => {
  if (!isValidDate(value)) {
    return fallback;
  }

  const date =
    value instanceof Date ? value : new Date(value as string);

  return new Intl.DateTimeFormat(DATE_TIME_LOCALE, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export const formatTime = (
  value?: string | Date | null,
  fallback = "Not available",
): string => {
  if (!isValidDate(value)) {
    return fallback;
  }

  const date =
    value instanceof Date ? value : new Date(value as string);

  return new Intl.DateTimeFormat(DATE_TIME_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const formatRelativeDate = (
  value?: string | Date | null,
  fallback = "Not available",
): string => {
  if (!isValidDate(value)) {
    return fallback;
  }

  const date =
    value instanceof Date ? value : new Date(value as string);

  const differenceInMilliseconds =
    date.getTime() - Date.now();

  const differenceInMinutes = Math.round(
    differenceInMilliseconds / (1000 * 60),
  );

  const relativeFormatter = new Intl.RelativeTimeFormat(
    DATE_TIME_LOCALE,
    {
      numeric: "auto",
    },
  );

  if (Math.abs(differenceInMinutes) < 60) {
    return relativeFormatter.format(
      differenceInMinutes,
      "minute",
    );
  }

  const differenceInHours = Math.round(
    differenceInMinutes / 60,
  );

  if (Math.abs(differenceInHours) < 24) {
    return relativeFormatter.format(
      differenceInHours,
      "hour",
    );
  }

  const differenceInDays = Math.round(
    differenceInHours / 24,
  );

  return relativeFormatter.format(
    differenceInDays,
    "day",
  );
};

export const toDateInputValue = (
  value?: string | Date | null,
): string => {
  if (!isValidDate(value)) {
    return "";
  }

  const date =
    value instanceof Date ? value : new Date(value as string);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(
    2,
    "0",
  );
  const day = String(date.getDate()).padStart(
    2,
    "0",
  );

  return `${year}-${month}-${day}`;
};