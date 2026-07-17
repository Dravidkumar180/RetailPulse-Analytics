import type { ButtonHTMLAttributes, ReactNode } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import MuiButton from "@mui/material/Button";
import type { ButtonProps as MuiButtonProps } from "@mui/material/Button";

import "./Button.css";

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
