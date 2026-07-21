/* Teaching guide: This file contains use auth application logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Imports the needed tools from react.
import { useContext } from "react";

import {
  AuthContext,
  // Defines the auth context value type.
  type AuthContextValue,
} from "../context/AuthContext";

// Runs use auth logic.
export const useAuth = (): AuthContextValue => {
  // Stores context for the steps below.
  const context = useContext(AuthContext);

  // Checks whether this condition is true.
  if (!context) {
    // Stops here and reports the problem.
    throw new Error(
      "useAuth must be used inside an AuthProvider.",
    );
  }

  // Returns the completed result to the caller.
  return context;
};