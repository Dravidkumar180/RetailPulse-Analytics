/* Teaching guide: This file contains the loading spinner user interface.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Imports the needed tools from @mui/material/CircularProgress.
import CircularProgress from "@mui/material/CircularProgress";

// Loads ./LoadingSpinner.css styles or setup.
import "./LoadingSpinner.css";

// Defines the fields allowed in loading spinner props.
interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
  size?: number;
}

// Shows the loading spinner.
const LoadingSpinner = ({
  message = "Loading...",
  fullScreen = false,
  size = 42,
}: LoadingSpinnerProps) => {
  // Builds the visible interface below.
  return (
    <div
      className={
        fullScreen
          ? "loading-spinner loading-spinner--full-screen"
          : "loading-spinner"
      }
      role="status"
      aria-live="polite"
    >
      <CircularProgress size={size} />

      {message && (
        <p className="loading-spinner__message">{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;