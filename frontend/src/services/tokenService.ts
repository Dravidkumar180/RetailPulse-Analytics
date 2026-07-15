const ACCESS_TOKEN_KEY =
  "retailpulse_access_token";

const REFRESH_TOKEN_KEY =
  "retailpulse_refresh_token";

export interface StoredTokens {
  accessToken: string;
  refreshToken: string | null;
}

export const getStoredAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getStoredRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const storeAuthTokens = (
  accessToken: string,
  refreshToken?: string | null,
): void => {
  localStorage.setItem(
    ACCESS_TOKEN_KEY,
    accessToken,
  );

  if (refreshToken) {
    localStorage.setItem(
      REFRESH_TOKEN_KEY,
      refreshToken,
    );
  }
};

export const getStoredTokens = (): StoredTokens | null => {
  const accessToken = getStoredAccessToken();

  if (!accessToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken: getStoredRefreshToken(),
  };
};

export const hasAccessToken = (): boolean => {
  return Boolean(getStoredAccessToken());
};

export const hasRefreshToken = (): boolean => {
  return Boolean(getStoredRefreshToken());
};

export const clearAuthTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

const decodeBase64Url = (value: string): string => {
  const base64 = value
    .replaceAll("-", "+")
    .replaceAll("_", "/");

  const paddedBase64 = base64.padEnd(
    Math.ceil(base64.length / 4) * 4,
    "=",
  );

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

export interface JwtPayload {
  sub?: string;
  companyId?: string;
  role?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

export const decodeJwtToken = (
  token: string,
): JwtPayload | null => {
  try {
    const tokenParts = token.split(".");

    if (tokenParts.length !== 3) {
      return null;
    }

    return JSON.parse(
      decodeBase64Url(tokenParts[1]),
    ) as JwtPayload;
  } catch {
    return null;
  }
};

export const isTokenExpired = (
  token: string,
  expiryBufferSeconds = 30,
): boolean => {
  const payload = decodeJwtToken(token);

  if (!payload?.exp) {
    return true;
  }

  const currentTime = Math.floor(Date.now() / 1000);

  return (
    payload.exp <=
    currentTime + expiryBufferSeconds
  );
};

export const hasValidAccessToken = (): boolean => {
  const accessToken = getStoredAccessToken();

  if (!accessToken) {
    return false;
  }

  return !isTokenExpired(accessToken);
};