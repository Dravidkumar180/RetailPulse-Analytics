/* Teaching guide: This file contains token service business logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Stores access token key for the steps below.
const ACCESS_TOKEN_KEY =
  "retailpulse_access_token";

// Stores refresh token key for the steps below.
const REFRESH_TOKEN_KEY =
  "retailpulse_refresh_token";

// Defines the fields allowed in stored tokens.
export interface StoredTokens {
  accessToken: string;
  refreshToken: string | null;
}

// Gets stored access token.
export const getStoredAccessToken = (): string | null => {
  // Returns the completed result to the caller.
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

// Gets stored refresh token.
export const getStoredRefreshToken = (): string | null => {
  // Returns the completed result to the caller.
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

// Saves auth tokens.
export const storeAuthTokens = (
  accessToken: string,
  refreshToken?: string | null,
): void => {
  localStorage.setItem(
    ACCESS_TOKEN_KEY,
    accessToken,
  );

  // Checks whether this condition is true.
  if (refreshToken) {
    localStorage.setItem(
      REFRESH_TOKEN_KEY,
      refreshToken,
    );
  }
};

// Gets stored tokens.
export const getStoredTokens = (): StoredTokens | null => {
  // Stores access token for the steps below.
  const accessToken = getStoredAccessToken();

  // Checks whether this condition is true.
  if (!accessToken) {
    // Returns the completed result to the caller.
    return null;
  }

  // Returns the completed result to the caller.
  return {
    accessToken,
    refreshToken: getStoredRefreshToken(),
  };
};

// Checks access token.
export const hasAccessToken = (): boolean => {
  // Returns the completed result to the caller.
  return Boolean(getStoredAccessToken());
};

// Checks refresh token.
export const hasRefreshToken = (): boolean => {
  // Returns the completed result to the caller.
  return Boolean(getStoredRefreshToken());
};

// Removes auth tokens.
export const clearAuthTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// Runs decode base64 url logic.
const decodeBase64Url = (value: string): string => {
  // Stores base64 for the steps below.
  const base64 = value
    .replaceAll("-", "+")
    .replaceAll("_", "/");

  // Stores padded base64 for the steps below.
  const paddedBase64 = base64.padEnd(
    Math.ceil(base64.length / 4) * 4,
    "=",
  );

  // Returns the completed result to the caller.
  return decodeURIComponent(
    window
      .atob(paddedBase64)
      .split("")
      .map(
        (character) =>
          `%${character
            .charCodeAt(0)
            .toString(16)
            .padStart(2, "0")}`,
      )
      .join(""),
  );
};

// Defines the fields allowed in jwt payload.
export interface JwtPayload {
  sub?: string;
  companyId?: string;
  role?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

// Runs decode jwt token logic.
export const decodeJwtToken = (
  token: string,
): JwtPayload | null => {
  // Tries the operation and watches for errors.
  try {
    // Stores token parts for the steps below.
    const tokenParts = token.split(".");

    // Checks whether this condition is true.
    if (tokenParts.length !== 3) {
      // Returns the completed result to the caller.
      return null;
    }

    // Returns the completed result to the caller.
    return JSON.parse(
      decodeBase64Url(tokenParts[1]),
    ) as JwtPayload;
  } catch {
    // Returns the completed result to the caller.
    return null;
  }
};

// Checks token expired.
export const isTokenExpired = (
  token: string,
  expiryBufferSeconds = 30,
): boolean => {
  // Stores payload for the steps below.
  const payload = decodeJwtToken(token);

  // Checks whether this condition is true.
  if (!payload?.exp) {
    // Returns the completed result to the caller.
    return true;
  }

  // Stores current time for the steps below.
  const currentTime = Math.floor(Date.now() / 1000);

  // Builds the visible interface below.
  return (
    payload.exp <=
    currentTime + expiryBufferSeconds
  );
};

// Checks valid access token.
export const hasValidAccessToken = (): boolean => {
  // Stores access token for the steps below.
  const accessToken = getStoredAccessToken();

  // Checks whether this condition is true.
  if (!accessToken) {
    // Returns the completed result to the caller.
    return false;
  }

  // Returns the completed result to the caller.
  return !isTokenExpired(accessToken);
};