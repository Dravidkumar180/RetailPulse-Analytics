/* Teaching guide: This file contains API requests and responses for axios instance.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

import axios, {
  AxiosError,
  AxiosHeaders,
  // Defines the internal axios request config type.
  type InternalAxiosRequestConfig,
} from "axios";

// Defines the fields allowed in refresh token response.
interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
}

// Defines the fields allowed in retry request config.
interface RetryRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Stores api base url for the steps below.
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

// Stores access token key for the steps below.
const ACCESS_TOKEN_KEY = "retailpulse_access_token";
// Stores refresh token key for the steps below.
const REFRESH_TOKEN_KEY = "retailpulse_refresh_token";

// Gets access token.
export const getAccessToken = (): string | null => {
  // Returns the completed result to the caller.
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

// Gets refresh token.
export const getRefreshToken = (): string | null => {
  // Returns the completed result to the caller.
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

// Saves tokens.
export const saveTokens = (
  accessToken: string,
  refreshToken?: string,
): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

  // Checks whether this condition is true.
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
};

// Removes tokens.
export const clearTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// Stores axios instance for the steps below.
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Stores is refreshing for the steps below.
let isRefreshing = false;

// Stores refresh subscribers for the steps below.
let refreshSubscribers: Array<(accessToken: string) => void> = [];

// Runs subscribe to token refresh logic.
const subscribeToTokenRefresh = (
  callback: (accessToken: string) => void,
): void => {
  refreshSubscribers.push(callback);
};

// Runs notify refresh subscribers logic.
const notifyRefreshSubscribers = (accessToken: string): void => {
  refreshSubscribers.forEach((callback) => callback(accessToken));
  refreshSubscribers = [];
};

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Stores access token for the steps below.
    const accessToken = getAccessToken();

    // Checks whether this condition is true.
    if (accessToken) {
      // Checks whether this condition is true.
      if (!config.headers) {
        config.headers = new AxiosHeaders();
      }

      config.headers.set("Authorization", `Bearer ${accessToken}`);
    }

    // Returns the completed result to the caller.
    return config;
  },
  (error: AxiosError) => {
    // Returns the completed result to the caller.
    return Promise.reject(error);
  },
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Stores original request for the steps below.
    const originalRequest = error.config as RetryRequestConfig | undefined;

    // Checks whether this condition is true.
    if (!originalRequest) {
      // Returns the completed result to the caller.
      return Promise.reject(error);
    }

    // Stores is unauthorized for the steps below.
    const isUnauthorized = error.response?.status === 401;
    // Stores is refresh request for the steps below.
    const isRefreshRequest = originalRequest.url?.includes("/auth/refresh");

    // Checks whether this condition is true.
    if (!isUnauthorized || originalRequest._retry || isRefreshRequest) {
      // Returns the completed result to the caller.
      return Promise.reject(error);
    }

    // Stores refresh token for the steps below.
    const refreshToken = getRefreshToken();

    // Checks whether this condition is true.
    if (!refreshToken) {
      clearTokens();

      // Checks whether this condition is true.
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }

      // Returns the completed result to the caller.
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // Checks whether this condition is true.
    if (isRefreshing) {
      // Returns the completed result to the caller.
      return new Promise((resolve) => {
        subscribeToTokenRefresh((newAccessToken) => {
          // Checks whether this condition is true.
          if (!originalRequest.headers) {
            originalRequest.headers = new AxiosHeaders();
          }

          originalRequest.headers.set(
            "Authorization",
            `Bearer ${newAccessToken}`,
          );

          resolve(axiosInstance(originalRequest));
        });
      });
    }

    isRefreshing = true;

    // Tries the operation and watches for errors.
    try {
      // Stores response for the steps below.
      const response = await axios.post<RefreshTokenResponse>(
        `${API_BASE_URL}/auth/refresh`,
        {
          refreshToken,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      // Stores new access token for the steps below.
      const newAccessToken = response.data.accessToken;
      // Stores new refresh token for the steps below.
      const newRefreshToken = response.data.refreshToken;

      saveTokens(newAccessToken, newRefreshToken);
      notifyRefreshSubscribers(newAccessToken);

      // Checks whether this condition is true.
      if (!originalRequest.headers) {
        originalRequest.headers = new AxiosHeaders();
      }

      originalRequest.headers.set(
        "Authorization",
        `Bearer ${newAccessToken}`,
      );

      // Returns the completed result to the caller.
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      clearTokens();
      refreshSubscribers = [];

      // Checks whether this condition is true.
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }

      // Returns the completed result to the caller.
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default axiosInstance;
