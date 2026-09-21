/* Shows the sales page title and shortcuts to create a sale or view analytics. */
import AddIcon from "@mui/icons-material/Add";
import AnalyticsOutlinedIcon from "@mui/icons-material/AnalyticsOutlined";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
import Button from "../../components/common/Button/Button";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import type { SalesPageState } from "./useSalesPage";

type Props = Pick<SalesPageState, "canEdit" | "setTab" | "begin">;

export default function SalesHeader({ canEdit, setTab, begin }: Props) {
  return (
    <PageHeader
      title="Sales Management"
      subtitle="Record and manage multi-item invoices."
      icon={<PointOfSaleOutlinedIcon />}
      actions={
        <>
          {canEdit && (
            <Button
              variant="outlined"
              startIcon={<AnalyticsOutlinedIcon />}
              onClick={() => setTab(3)}
            >
              View Sales Analytics
            </Button>
          )}
          {canEdit && (
            <Button startIcon={<AddIcon />} onClick={() => begin()}>
              Create Sale
            </Button>
          )}
        </>
      }
    />
  );
}
