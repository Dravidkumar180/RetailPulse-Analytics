/* Teaching guide: This file contains customers header page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
// Renders the customers header controls for the customers feature.
import { Box, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PeopleIcon from "@mui/icons-material/PeopleOutlined";
import { title } from "./customerShared";
// The declarations below define the public data used by this module.
export type CustomerTab = "customers" | "analytics" | "history";
export default function CustomersHeader({
  tab,
  editable,
  onTab,
  onAdd,
}: {
  tab: CustomerTab;
  editable: boolean;
  onTab: (tab: CustomerTab) => void;
  onAdd: () => void;
}) {
  return (
    <>
      <Box className="customers-heading">
        <Box>
          <span>
            <PeopleIcon />
          </span>
          <div>
            <h1>Customer Management</h1>
            <p>
              Maintain customer profiles, purchase history and behaviour
              insights.
            </p>
          </div>
        </Box>
        {editable && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd}>
            Add Customer
          </Button>
        )}
      </Box>
      <Box className="customer-tabs">
        {(["customers", "analytics", "history"] as CustomerTab[]).map(
          (value) => (
            <button
              className={tab === value ? "active" : ""}
              onClick={() => onTab(value)}
              key={value}
            >
              {value === "history" ? "History" : title(value)}
            </button>
          ),
        )}
      </Box>
    </>
  );
}
