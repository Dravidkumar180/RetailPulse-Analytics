/* Teaching guide: This file contains inventory forecast page page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
// Coordinates data, state, and child components for the Inventory Forecast Page screen.
import { Box, Typography } from "@mui/material";
import { NavLink } from "react-router-dom";
import AutoGraphOutlinedIcon from "@mui/icons-material/AutoGraphOutlined";
import SmartReplenishment from "../forecasting/SmartReplenishment";
import "./InventoryForecastPage.css";

// This component receives prepared data and renders the feature-specific interface.
export default function InventoryForecastPage() {
  return (
    <Box className="inventory-forecast-shell">
      <Box className="inventory-heading">
        <Box>
          <Typography component="h1">
            Inventory Forecasting & Smart Replenishment
          </Typography>
          <Typography component="p">
            Forecast demand, identify stock risks, and make inventory
            replenishment decisions.
          </Typography>
        </Box>
        <AutoGraphOutlinedIcon className="inventory-forecast-shell__icon" />
      </Box>
      <nav className="inventory-module-tabs">
        <NavLink to="/inventory">Inventory Overview</NavLink>
        <NavLink to="/inventory/forecast" className="active">
          Forecast & Replenishment
        </NavLink>
      </nav>
      <SmartReplenishment />
    </Box>
  );
}
