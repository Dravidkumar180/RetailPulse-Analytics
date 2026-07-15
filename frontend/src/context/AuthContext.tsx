import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
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
  type UserProfile,
} from "../api/profileApi";
import {
  logoutUser,
} from "../services/authService";
import {
  clearAuthTokens,
  hasAccessToken,
} from "../services/tokenService";

export interface AuthCompany {
  id: string;
  name: string;
  industry?: string;
  email?: string;
}

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

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
  setUser: (user: AuthUser | null) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

interface AuthProviderProps {
  children: ReactNode;
}

const mapProfileToAuthUser = (
  profile: UserProfile,
): AuthUser => {
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

const mapLoginResponseToAuthUser = (
  response: LoginResponse,
): AuthUser => {
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

export const AuthProvider = ({
  children,
}: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser =
    useCallback(async (): Promise<AuthUser | null> => {
      if (!hasAccessToken()) {
        setUser(null);
        return null;
      }

      try {
        const profile = await getCurrentUserProfile();
        const authenticatedUser = mapProfileToAuthUser(profile);

        setUser(authenticatedUser);

        return authenticatedUser;
      } catch {
        clearAuthTokens();
        setUser(null);

        return null;
      }
    }, []);

  const login = useCallback(
    async (credentials: LoginRequest): Promise<AuthUser> => {
      const response = await loginUser(credentials);

      /*
       * The login response already includes basic user information.
       * We set it immediately so the UI can update without delay.
       */
      let authenticatedUser = mapLoginResponseToAuthUser(response);
      setUser(authenticatedUser);

      /*
       * Fetch the complete profile to obtain company name,
       * industry and company email.
       */
      try {
        const profile = await getCurrentUserProfile();

        authenticatedUser = mapProfileToAuthUser(profile);
        setUser(authenticatedUser);
      } catch {
        /*
         * Login remains valid even when the profile request fails.
         * The user can retry profile loading later.
         */
      }

      return authenticatedUser;
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await logoutUser();
    } finally {
      clearAuthTokens();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let componentMounted = true;

    const initializeAuthentication = async () => {
      try {
        if (!hasAccessToken()) {
          return;
        }

        const restoredUser = await restoreUserSession();

        if (componentMounted) {
          setUser(
            restoredUser
              ? mapProfileToAuthUser(restoredUser)
              : null,
          );
        }
      } catch {
        clearAuthTokens();

        if (componentMounted) {
          setUser(null);
        }
      } finally {
        if (componentMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuthentication();

    return () => {
      componentMounted = false;
    };
  }, []);

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

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

async function restoreUserSession(): Promise<UserProfile | null> {
  try {
    const profile = await getCurrentUserProfile();

    return profile;
  } catch {
    return null;
  }
}
