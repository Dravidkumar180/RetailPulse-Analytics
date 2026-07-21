/* Teaching guide: This file contains the button user interface.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Imports the needed tools from react.
import type { ButtonHTMLAttributes, ReactNode } from "react";
// Imports the needed tools from @mui/material/CircularProgress.
import CircularProgress from "@mui/material/CircularProgress";
// Imports the needed tools from @mui/material/Button.
import MuiButton from "@mui/material/Button";
// Imports the needed tools from @mui/material/Button.
import type { ButtonProps as MuiButtonProps } from "@mui/material/Button";

// Loads ./Button.css styles or setup.
import "./Button.css";

// Defines the fields allowed in app button props.
interface AppButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  children: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  variant?: MuiButtonProps["variant"];
  color?: MuiButtonProps["color"];
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  size?: MuiButtonProps["size"];
}

// Stores button for the steps below.
const Button = ({
  children,
  loading = false,
  disabled = false,
  fullWidth = false,
  variant = "contained",
  color = "primary",
  type = "button",
  className = "",
  startIcon,
  endIcon,
  size,
  onClick,
  ...rest
}: AppButtonProps) => {
  // Builds the visible interface below.
  return (
    <MuiButton
      type={type}
      variant={variant}
      color={color}
      fullWidth={fullWidth}
      disabled={disabled || loading}
      startIcon={!loading ? startIcon : undefined}
      endIcon={!loading ? endIcon : undefined}
      size={size}
      onClick={onClick}
      className={`app-button ${className}`.trim()}
      {...rest}
    >
      {loading ? (
        <span className="app-button__loading-content">
          <CircularProgress
            size={18}
            color="inherit"
            aria-label="Loading"
          />
          <span>Please wait...</span>
        </span>
      ) : (
        children
      )}
    </MuiButton>
  );
};

export default Button;
