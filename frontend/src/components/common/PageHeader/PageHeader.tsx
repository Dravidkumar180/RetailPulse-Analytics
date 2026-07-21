/* Teaching guide: This file contains the page header user interface.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Imports the needed tools from react.
import type { ReactNode } from "react";
// Imports the needed tools from @mui/material.
import { Box, Typography } from "@mui/material";

// Loads ./PageHeader.css styles or setup.
import "./PageHeader.css";

// Defines the fields allowed in page header props.
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

// Shows the page header.
const PageHeader = ({
  title,
  subtitle,
  icon,
  actions,
  className = "",
}: PageHeaderProps) => {
  // Builds the visible interface below.
  return (
    <Box className={`page-header ${className}`.trim()}>
      <Box className="page-header__content">
        {icon && <Box className="page-header__icon">{icon}</Box>}

        <Box>
          <Typography component="h1" className="page-header__title">
            {title}
          </Typography>

          {subtitle && (
            <Typography component="p" className="page-header__subtitle">
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>

      {actions && <Box className="page-header__actions">{actions}</Box>}
    </Box>
  );
};

export default PageHeader;