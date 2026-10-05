import { useQuery } from "@tanstack/react-query";
import { Alert, Button, LinearProgress } from "@mui/material";
import { getImportOverview } from "../../api/bulkImportApi";
import { useAuth } from "../../hooks/useAuth";

export default function ImportDashboard() {
  const { user } = useAuth();
  const overview = useQuery({ queryKey: ["bulk-imports", user?.companyId, user?.id, "overview"], queryFn: getImportOverview, refetchInterval: 5000 });
  return <section className="imports-card import-dashboard" aria-label="Import dashboard">
    {overview.isPending ? <LinearProgress aria-label="Loading import overview" /> : overview.isError ? <Alert severity="error" action={<Button onClick={() => void overview.refetch()}>Retry</Button>}>Unable to load import totals.</Alert> : overview.data && <div className="import-dashboard-stats">
      {[["Total Imports", overview.data.total, ""], ["Completed", overview.data.completed, "valid"], ["With Errors", overview.data.withErrors, "invalid"], ["Failed", overview.data.failed, "duplicate"], ["Active", overview.data.active, ""], ["Cancelled", overview.data.cancelled, ""]].map(([label, value, style]) => <div className={`validation-stat ${style}`} key={label}><span>{label}</span><strong>{typeof value === "number" ? value.toLocaleString() : value}</strong></div>)}
    </div>}
  </section>;
}
