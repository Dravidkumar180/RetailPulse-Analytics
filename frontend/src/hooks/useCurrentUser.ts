/* Teaching guide: This file contains use current user application logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Imports the needed tools from @tanstack/react-query.
import { useQuery } from "@tanstack/react-query";

import {
  getCurrentUserProfile,
  // Defines the user profile type.
  type UserProfile,
} from "../api/profileApi";
// Imports the needed tools from ./useAuth.
import { useAuth } from "./useAuth";

// Runs current user query key logic.
export const currentUserQueryKey = [
  "current-user-profile",
] as const;

// Runs use current user logic.
export const useCurrentUser = () => {
  const {
    isAuthenticated,
    isLoading: authLoading,
  } = useAuth();

  // Returns the completed result to the caller.
  return useQuery<UserProfile, Error>({
    queryKey: currentUserQueryKey,
    queryFn: getCurrentUserProfile,
    enabled: isAuthenticated && !authLoading,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};