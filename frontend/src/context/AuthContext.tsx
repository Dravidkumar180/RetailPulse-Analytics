/* Teaching guide: This file contains auth context application logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  // Defines the react node type.
  type ReactNode,
} from "react";

import {
  login as loginUser,
} from "../api/authApi";
import type {
  AccountStatus,
  LoginRequest,
  LoginResponse,
  UserRole,
} from "../api/authApi";
import {
  getCurrentUserProfile,
  // Defines the user profile type.
  type UserProfile,
} from "../api/profileApi";
import {
  logoutUser,
} from "../services/authService";
import {
  clearAuthTokens,
  hasAccessToken,
} from "../services/tokenService";

// Defines the fields allowed in auth company.
export interface AuthCompany {
  id: string;
  name: string;
  industry?: string;
  email?: string;
}

// Defines the fields allowed in auth user.
export interface AuthUser {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  lastLogin: string | null;
  createdAt?: string;
  company: AuthCompany;
}

// Defines the fields allowed in auth context value.
export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
  setUser: (user: AuthUser | null) => void;
}

// Stores auth context for the steps below.
export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

// Defines the fields allowed in auth provider props.
interface AuthProviderProps {
  children: ReactNode;
}

// Runs map profile to auth user logic.
const mapProfileToAuthUser = (
  profile: UserProfile,
): AuthUser => {
  // Returns the completed result to the caller.
  return {
    id: profile.id,
    companyId: profile.company.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    status: profile.status,
    lastLogin: profile.lastLogin,
    createdAt: profile.createdAt,
    company: {
      id: profile.company.id,
      name: profile.company.name,
      industry: profile.company.industry,
      email: profile.company.email,
    },
  };
};

// Runs map login response to auth user logic.
const mapLoginResponseToAuthUser = (
  response: LoginResponse,
): AuthUser => {
  // Returns the completed result to the caller.
  return {
    id: response.user.id,
    companyId: response.user.companyId,
    name: response.user.name,
    email: response.user.email,
    role: response.user.role,
    status: response.user.status,
    lastLogin: response.user.lastLogin,
    createdAt: response.user.createdAt,
    company: {
      id: response.user.companyId,
      name: "Company",
    },
  };
};

// Shows the auth provider.
export const AuthProvider = ({
  children,
}: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Runs refresh user logic.
  const refreshUser =
    useCallback(async (): Promise<AuthUser | null> => {
      // Checks whether this condition is true.
      if (!hasAccessToken()) {
        // Updates the page or stored state with this result.
        setUser(null);
        // Returns the completed result to the caller.
        return null;
      }

      // Tries the operation and watches for errors.
      try {
        // Stores profile for the steps below.
        const profile = await getCurrentUserProfile();
        // Stores authenticated user for the steps below.
        const authenticatedUser = mapProfileToAuthUser(profile);

        // Updates the page or stored state with this result.
        setUser(authenticatedUser);

        // Returns the completed result to the caller.
        return authenticatedUser;
      } catch {
        clearAuthTokens();
        // Updates the page or stored state with this result.
        setUser(null);

        // Returns the completed result to the caller.
        return null;
      }
    }, []);

  // Logs the user in.
  const login = useCallback(
    async (credentials: LoginRequest): Promise<AuthUser> => {
      // Stores response for the steps below.
      const response = await loginUser(credentials);

      /*
       * The login response already includes basic user information.
       * We set it immediately so the UI can update without delay.
       */
      // Stores authenticated user for the steps below.
      let authenticatedUser = mapLoginResponseToAuthUser(response);
      // Updates the page or stored state with this result.
      setUser(authenticatedUser);

      /*
       * Fetch the complete profile to obtain company name,
       * industry and company email.
       */
      // Tries the operation and watches for errors.
      try {
        // Stores profile for the steps below.
        const profile = await getCurrentUserProfile();

        authenticatedUser = mapProfileToAuthUser(profile);
        // Updates the page or stored state with this result.
        setUser(authenticatedUser);
      } catch {
        /*
         * Login remains valid even when the profile request fails.
         * The user can retry profile loading later.
         */
      }

      // Returns the completed result to the caller.
      return authenticatedUser;
    },
    [],
  );

  // Logs the user out.
  const logout = useCallback(async (): Promise<void> => {
    // Tries the operation and watches for errors.
    try {
      // Waits for this asynchronous work to finish.
      await logoutUser();
    } finally {
      clearAuthTokens();
      // Updates the page or stored state with this result.
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // Stores component mounted for the steps below.
    let componentMounted = true;

    // Runs initialize authentication logic.
    const initializeAuthentication = async () => {
      // Tries the operation and watches for errors.
      try {
        // Checks whether this condition is true.
        if (!hasAccessToken()) {
          // Returns the completed result to the caller.
          return;
        }

        // Stores restored user for the steps below.
        const restoredUser = await restoreUserSession();

        // Checks whether this condition is true.
        if (componentMounted) {
          // Updates the page or stored state with this result.
          setUser(
            restoredUser
              ? mapProfileToAuthUser(restoredUser)
              : null,
          );
        }
      } catch {
        clearAuthTokens();

        // Checks whether this condition is true.
        if (componentMounted) {
          // Updates the page or stored state with this result.
          setUser(null);
        }
      } finally {
        // Checks whether this condition is true.
        if (componentMounted) {
          // Updates the page or stored state with this result.
          setIsLoading(false);
        }
      }
    };

    initializeAuthentication();

    // Builds the visible interface below.
    return () => {
      componentMounted = false;
    };
  }, []);

  // Runs context value logic.
  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user && hasAccessToken()),
      isLoading,
      login,
      logout,
      refreshUser,
      setUser,
    }),
    [
      user,
      isLoading,
      login,
      logout,
      refreshUser,
    ],
  );

  // Builds the visible interface below.
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

async function restoreUserSession(): Promise<UserProfile | null> {
  // Tries the operation and watches for errors.
  try {
    // Stores profile for the steps below.
    const profile = await getCurrentUserProfile();

    // Returns the completed result to the caller.
    return profile;
  } catch {
    // Returns the completed result to the caller.
    return null;
  }
}
