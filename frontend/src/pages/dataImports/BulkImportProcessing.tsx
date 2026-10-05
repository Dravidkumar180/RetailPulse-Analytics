import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, Pagination } from "@mui/material";
import { downloadBulkImportReport, getBulkImportRows, isImportActive, type BulkImportJob } from "../../api/bulkImportApi";
import type { ImportValidationResult } from "../../api/dataImportApi";
import type { BulkProcessingState } from "./useBulkImportProcessing";

export function ImportConfirmation({ state, validation, filename }: { state: BulkProcessingState; validation: ImportValidationResult | null; filename?: string }) {
  return <Dialog open={state.confirming} onClose={() => { if (!state.start.isPending) state.setConfirming(false); }} fullWidth maxWidth="sm">
    <DialogTitle>Confirm import</DialogTitle><DialogContent>
      <p><strong>{filename}</strong></p><p>{validation?.totalRows} total rows · {validation?.validRows} valid · {validation?.invalidRows} invalid · {validation?.duplicateRows} duplicate</p>
      <Alert severity="warning">Valid records will be saved to your company. Invalid and duplicate records are excluded. Completed batches are retained if processing is cancelled or interrupted.</Alert>
      <p>{validation?.duplicatePolicy}</p><p>Records are checked again before processing, so the final counts can differ from this preview.</p>
      {state.start.isError && <Alert severity="error">Unable to confirm the import. Retry to safely check the same request, or close and check Recent Imports before uploading again.</Alert>}
    </DialogContent><DialogActions><Button disabled={state.start.isPending} onClick={() => state.setConfirming(false)}>Back to preview</Button>
      <Button variant="contained" disabled={state.start.isPending || !validation?.validRows} onClick={() => state.start.mutate()}>{state.start.isPending ? "Queuing…" : "Confirm & Start Import"}</Button></DialogActions>
  </Dialog>;
}

function ProcessingRows({ job }: { job: BulkImportJob }) {
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);
  const [downloadError, setDownloadError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const active = isImportActive(job);
  const count = status === "Success" ? job.successfulRecords : status === "Failed" ? job.failedRecords
    : status === "Skipped" ? job.skippedRecords : status === "Pending" ? job.totalRecords - job.processedRecords : job.totalRecords;
  const currentPage = Math.min(page, Math.max(1, Math.ceil(count / 10)));
  const rows = useQuery({ queryKey: ["bulk-import-rows", job.id, status, currentPage, job.processedRecords],
    queryFn: () => getBulkImportRows(job.id, status, currentPage), refetchInterval: active ? 2000 : false });
  const download = async (kind: "errors" | "success") => {
    setDownloadError(""); setDownloading(true);
    try { await downloadBulkImportReport(job.id, kind); }
    catch { setDownloadError("Unable to download the report. Please try again."); }
    finally { setDownloading(false); }
  };
  return <section className="imports-card"><h2>Record Results</h2>
    <div className="validation-toolbar">{["All", "Success", "Failed", "Skipped", "Pending"].map(value => <Button key={value} variant={status === value ? "contained" : "outlined"} aria-pressed={status === value} onClick={() => { setStatus(value); setPage(1); }}>{value}</Button>)}
      <Button disabled={active || downloading || !job.successfulRecords} onClick={() => void download("success")}>Download Success CSV</Button>
      <Button disabled={active || downloading || !(job.failedRecords + job.skippedRecords)} onClick={() => void download("errors")}>Download Error CSV</Button>
    </div>{downloadError && <Alert severity="error">{downloadError}</Alert>}
    {rows.isPending ? <LinearProgress aria-label="Loading record results" /> : rows.isError ? <Alert severity="error" action={<Button onClick={() => void rows.refetch()}>Retry</Button>}>Unable to load record results.</Alert> : <>
      <div className="preview-scroll"><table><thead><tr><th>CSV Row</th>{job.columns.map(c => <th key={c}>{c}</th>)}<th>Status</th><th>Action</th><th>Error Type</th><th>Message</th></tr></thead><tbody>
        {rows.data?.items.map(row => <tr key={row.rowNumber}><td>{row.rowNumber}</td>{job.columns.map(c => <td key={c} title={row.data[c]}>{row.data[c] || "—"}</td>)}<td>{row.status}</td><td>{row.action || "—"}</td><td>{row.errorType || "—"}</td><td className="validation-messages">{row.message || "—"}</td></tr>)}
        {!rows.data?.items.length && <tr><td colSpan={job.columns.length + 5}>No records in this category.</td></tr>}
      </tbody></table></div><div className="validation-pagination"><small>{rows.data?.total ?? 0} records · 10 per page</small><Pagination count={Math.max(1, Math.ceil(count / 10))} page={currentPage} onChange={(_, value) => setPage(value)} /></div>
    </>}
  </section>;
}

export default function BulkImportProcessing({ state }: { state: BulkProcessingState }) {
  const job = state.selected.data;
  const active = isImportActive(job);
  return <div className="bulk-processing">
    {state.selectedId && <section className="imports-card"><h2>Import Progress & Summary</h2>
      {state.selected.isPending ? <LinearProgress aria-label="Loading import status" /> : state.selected.isError ? <Alert severity="error" action={<Button onClick={() => void state.selected.refetch()}>Retry</Button>}>Unable to load this import. It may be unavailable to your company.</Alert> : job && <>
        <div className="imports-section-head"><div><h3>{job.status}</h3><p>{job.filename}</p><small>Import ID: {job.id}</small></div>{active && <Button color="error" variant="outlined" disabled={state.cancel.isPending || job.cancelRequested} onClick={() => state.cancel.mutate()}>{job.cancelRequested ? "Cancellation requested" : "Cancel Import"}</Button>}</div>
        {active && <Alert severity="info">{job.status === "Uploaded" ? "Queued for processing. The worker will start shortly." : job.status === "Validating" ? "Checking every record against the current database." : "Processing in the background. You can leave this page and reopen the import below."}</Alert>}
        {job.message && <Alert severity={job.status === "Failed" ? "error" : "warning"}>{job.message}</Alert>}
        {state.cancel.isError && <Alert severity="error">Unable to cancel. Check the current status and try again.</Alert>}
        <LinearProgress variant={job.status === "Validating" ? "indeterminate" : "determinate"} value={job.progress} aria-label="Import processing progress" />
        <p>{job.processedRecords.toLocaleString()} / {job.totalRecords.toLocaleString()} records resolved ({job.progress}%)</p>
        <div className="validation-grid">{[["Total", job.totalRecords], ["Successful", job.successfulRecords], ["Failed", job.failedRecords], ["Skipped", job.skippedRecords]].map(([label, value]) => <div className="validation-stat" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
        <p>Duplicates: {job.duplicateRecords} (included in skipped) · Processing duration: {Math.floor(job.durationSeconds / 60)}m {Math.floor(job.durationSeconds % 60)}s</p>
        <p>Imported by {job.uploadedBy} · Uploaded {new Date(job.uploadDate).toLocaleString()}{job.completedAt && ` · Finished ${new Date(job.completedAt).toLocaleString()}`}</p>
      </>}
    </section>}
    {job && <ProcessingRows key={job.id} job={job} />}
  </div>;
}

export function ImportHistoryPanel({ state }: { state: BulkProcessingState }) {
  return <>
    <section className="imports-card"><h2>Import History</h2><p>Open an import to track processing or review its complete results.</p>
      <div className="validation-toolbar">
        <label>Import type <select value={state.historyType} onChange={e => { state.setHistoryType(e.target.value); state.setHistoryPage(1); }}><option value="">All types</option>{["products", "inventory", "customers", "sales"].map(value => <option key={value} value={value}>{value}</option>)}</select></label>
        <label>Status <select value={state.historyStatus} onChange={e => { state.setHistoryStatus(e.target.value); state.setHistoryPage(1); }}><option value="">All statuses</option>{["Uploaded", "Validating", "Processing", "Completed", "Completed with Errors", "Failed", "Cancelled"].map(value => <option key={value}>{value}</option>)}</select></label>
      </div>
      {state.recent.isPending ? <LinearProgress aria-label="Loading recent imports" /> : state.recent.isError ? <Alert severity="error" action={<Button onClick={() => void state.recent.refetch()}>Retry</Button>}>Unable to load recent imports.</Alert> : <div className="preview-scroll"><table><thead><tr><th>Import ID</th><th>Type / File</th><th>Uploaded by</th><th>Uploaded</th><th>Total</th><th>Success</th><th>Failed</th><th>Status</th><th>Duration</th><th>Details</th></tr></thead><tbody>
        {state.recent.data?.items.map(item => <tr key={item.id}><td title={item.id}>{item.id.slice(0, 8)}</td><td>{item.importType}<br />{item.filename}</td><td>{item.uploadedBy}</td><td>{new Date(item.uploadDate).toLocaleString()}</td><td>{item.totalRecords}</td><td>{item.successfulRecords}</td><td>{item.failedRecords}</td><td>{item.status}</td><td>{Math.floor(item.durationSeconds)}s</td><td><Button onClick={() => state.selectJob(item.id)}>Open</Button></td></tr>)}
        {!state.recent.data?.items.length && <tr><td colSpan={10}>No imports started yet. Validate a file and confirm its import to begin.</td></tr>}
      </tbody></table></div>}
      {state.recent.data && <div className="validation-pagination"><small>{state.recent.data.total} imports · 10 per page</small><Pagination page={state.historyPage} count={Math.max(1, Math.ceil(state.recent.data.total / 10))} onChange={(_, page) => state.setHistoryPage(page)} /></div>}
    </section>
  </>;
}
