/* Shows the sales tabs and disables views that are unavailable. */
import { Tab, Tabs } from "@mui/material";
import type { SalesPageState } from "./useSalesPage";

type Props = Pick<
  SalesPageState,
  "tab" | "setTab" | "editing" | "canEdit" | "view"
>;

export default function SalesTabs({
  tab,
  setTab,
  editing,
  canEdit,
  view,
}: Props) {
  return (
    <Tabs
      className="sales-tabs"
      value={tab}
      onChange={(_, value) => setTab(value)}
    >
      <Tab label="Sales List" />
      <Tab label={editing ? "Edit Sale" : "Create Sale"} disabled={!canEdit} />
      <Tab label="Sales Details" disabled={!view} />
      <Tab label="Sales Analytics" disabled={!canEdit} />
    </Tabs>
  );
}
