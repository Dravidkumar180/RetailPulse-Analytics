import { useQuery } from "@tanstack/react-query";

import {
  getCurrentUserProfile,
  type UserProfile,
} from "../api/profileApi";
import { useAuth } from "./useAuth";

export const currentUserQueryKey = [
  "current-user-profile",
] as const;

export const useCurrentUser = () => {
  const {
    isAuthenticated,
    isLoading: authLoading,
  } = useAuth();

  return useQuery<UserProfile, Error>({
    queryKey: currentUserQueryKey,
    queryFn: getCurrentUserProfile,
    enabled: isAuthenticated && !authLoading,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};