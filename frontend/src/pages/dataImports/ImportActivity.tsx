import { useQuery } from "@tanstack/react-query";
import { Alert, Button, LinearProgress } from "@mui/material";
import { Link } from "react-router-dom";
import { getAuditLogs } from "../../api/auditLogApi";
import type { BulkImportJob } from "../../api/bulkImportApi";
import { useAuth } from "../../hooks/useAuth";

export default function ImportActivity({ job }: { job?: BulkImportJob }) {
  const { user } = useAuth();
  const activity = useQuery({ queryKey: ["audit-logs", user?.companyId, user?.id, "import", job?.id],
    queryFn: () => getAuditLogs({ search: job!.id, pageSize: 10 }), enabled: !!job,
    refetchInterval: job && ["Uploaded", "Validating", "Processing"].includes(job.status) ? 3000 : false });
  return <div className="import-integrations">
    <section className="imports-card"><h2>Notifications & Alerts</h2>
      <p>Company administrators receive a notification when processing starts, completes, or fails. Each import event is delivered once per recipient.</p>
      <Button component={Link} to="/notifications">View Notifications</Button>
    </section>
    <section className="imports-card"><h2>Audit Logs</h2>
      {!job ? <p>Open an import to view its recorded actions.</p> : activity.isPending ? <LinearProgress aria-label="Loading import audit logs" /> : activity.isError ? <Alert severity="error" action={<Button onClick={() => void activity.refetch()}>Retry</Button>}>Unable to load import actions.</Alert> : <div className="preview-scroll"><table><thead><tr><th>Date & Time</th><th>User</th><th>Action</th></tr></thead><tbody>
        {activity.data?.items.map(item => <tr key={item.id}><td>{new Date(item.timestamp).toLocaleString()}</td><td>{item.user?.name || "System"}</td><td title={item.details || undefined}>{item.action.replaceAll("_", " ")}</td></tr>)}
        {!activity.data?.items.length && <tr><td colSpan={3}>No recorded actions for this import.</td></tr>}
      </tbody></table></div>}
      <Button component={Link} to="/audit-logs">View Audit Logs</Button>
    </section>
    <section className="imports-card"><h2>Data Quality & Reconciliation</h2>
      <p>Saved records enter the automatic reconciliation queue. Related stock, customer and sales inconsistencies appear in Data Quality after the background checks run.</p>
      <Button component={Link} to="/data-quality">View Data Quality Issues</Button>
    </section>
    <section className="imports-card"><h2>Security & Authorization</h2>
      <ul><li>Imports require a company administrator account.</li><li>Validation and processing use your signed-in company.</li><li>CSV uploads are limited to 10 MB.</li><li>Reports neutralize spreadsheet formulas.</li></ul>
    </section>
  </div>;
}
