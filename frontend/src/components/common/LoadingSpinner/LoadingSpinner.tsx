import CircularProgress from "@mui/material/CircularProgress";

import "./LoadingSpinner.css";

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
  size?: number;
}

const LoadingSpinner = ({
  message = "Loading...",
  fullScreen = false,
  size = 42,
}: LoadingSpinnerProps) => {
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