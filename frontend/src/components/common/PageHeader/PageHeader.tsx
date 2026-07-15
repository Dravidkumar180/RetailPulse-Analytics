import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";

import "./PageHeader.css";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

const PageHeader = ({
  title,
  subtitle,
  icon,
  actions,
  className = "",
}: PageHeaderProps) => {
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