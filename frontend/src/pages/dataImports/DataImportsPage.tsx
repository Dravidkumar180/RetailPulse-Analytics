/* Teaching guide: This file contains data imports page page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutlined";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import { Box, Button, LinearProgress } from "@mui/material";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import { downloadImportErrors, getImportHistory, processImport, uploadImport, type ImportRecord, type ImportType } from "../../api/dataImportApi";
import "./DataImportsPage.css";

const TYPES = [
  { value: "products" as const, title: "Products", detail: "Product catalog and stock", icon: <Inventory2OutlinedIcon />, columns: ["Product Name", "SKU", "Category", "Unit Price", "Stock Quantity"] },
  { value: "customers" as const, title: "Customers", detail: "Customer profiles", icon: <PeopleOutlineIcon />, columns: ["Name", "Email", "Phone"] },
  { value: "sales" as const, title: "Sales Transactions", detail: "Sales and inventory updates", icon: <PointOfSaleOutlinedIcon />, columns: ["Customer", "Product", "Quantity", "Unit Price", "Sale Date"] },
];
const MAX_SIZE = 10 * 1024 * 1024;
const WORKFLOW_STEPS = ["Select & Upload", "Preview & Validate", "Import", "Result", "History"];
const errorMessage = (error: any) => error?.response?.data?.detail || "The request could not be completed. Check your connection and try again.";

export default function DataImportsPage() {
  const client = useQueryClient(); const input = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLElement>(null); const previewRef = useRef<HTMLElement>(null);
  const importRef = useRef<HTMLElement>(null); const historyRef = useRef<HTMLElement>(null);
  const [type, setType] = useState<ImportType>("products"); const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState(""); const [job, setJob] = useState<ImportRecord | null>(null); const [apiError, setApiError] = useState("");
  const [viewedStep, setViewedStep] = useState<number | null>(null);
  const history = useQuery({ queryKey: ["import-history"], queryFn: getImportHistory });
  const refreshActivity = () => {
    client.invalidateQueries({ queryKey: ["audit-logs"] });
    client.invalidateQueries({ queryKey: ["activity-notifications"] });
  };
  const upload = useMutation({ mutationFn: () => uploadImport(type, file!), onSuccess: value => { setJob(value); setViewedStep(null); setApiError(""); client.invalidateQueries({queryKey:["import-history"]}); refreshActivity(); }, onError: error => setApiError(errorMessage(error)) });
  const process = useMutation({ mutationFn: () => processImport(job!.id), onSuccess: value => { setJob(value); setViewedStep(null); setApiError(""); client.invalidateQueries({queryKey:["import-history"]}); client.invalidateQueries({queryKey:["products"]}); client.invalidateQueries({queryKey:["customers"]}); client.invalidateQueries({queryKey:["sales"]}); refreshActivity(); }, onError: error => { setApiError(errorMessage(error)); client.invalidateQueries({queryKey:["import-history"]}); refreshActivity(); } });
  const chooseFile = (selected?: File) => {
    setJob(null); setApiError("");
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".csv") || (selected.type && !["text/csv", "application/vnd.ms-excel"].includes(selected.type))) { setFile(null); setFileError("Only .csv files are supported."); return; }
    if (selected.size > MAX_SIZE) { setFile(null); setFileError("The file exceeds the 10 MB limit."); return; }
    if (!selected.size) { setFile(null); setFileError("The selected file is empty."); return; }
    setFile(selected); setFileError("");
  };
  const clear = () => { setFile(null); setJob(null); setViewedStep(null); setFileError(""); setApiError(""); if (input.current) input.current.value = ""; };
  const current = TYPES.find(item => item.value === type)!; const finished = job?.status.startsWith("Completed");
  const reachedStep = finished ? 3 : job ? 2 : 0;
  const currentStep = finished ? 3 : process.isPending ? 2 : job ? 1 : 0;
  const completedThrough = finished ? 3 : process.isPending ? 1 : job ? 0 : -1;
  const activeStep = viewedStep ?? currentStep;
  const goToStep = (step: number) => {
    if (step > reachedStep && step !== 4) return;
    setViewedStep(step);
    const target = step === 0 ? selectRef : step === 1 ? previewRef : step === 4 ? historyRef : importRef;
    target.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return <Box className="imports-page">
    <PageHeader title="Data Imports" subtitle="Validate and import company products, customers, and sales from CSV files." />
    <nav className="import-workflow" aria-label="Data import progress">{WORKFLOW_STEPS.map((label, index) => {
      const available = index <= reachedStep || index === 4;
      const complete = index <= completedThrough;
      return <button key={label} type="button" className={`${index === activeStep ? "active " : ""}${complete ? "complete" : ""}`} disabled={!available} onClick={() => goToStep(index)} aria-current={index === activeStep ? "step" : undefined}><span>{complete ? "✓" : index + 1}</span><strong>{label}</strong></button>;
    })}</nav>
    <section ref={selectRef} className="imports-card import-types"><div className="imports-section-head"><div><span>Step 1 · Select & Upload</span><h2>Select import type</h2></div><p>Choose the data your CSV contains.</p></div>
      <div className="type-grid">{TYPES.map(item => <button key={item.value} className={type === item.value ? "type-card selected" : "type-card"} onClick={() => {setType(item.value); clear();}}><i>{item.icon}</i><strong>{item.title}</strong><small>{item.detail}</small><em>{type === item.value ? "Selected" : "Select"}</em></button>)}</div>
    </section>
    <div className="imports-workspace">
      <section className="imports-card upload-card"><div className="imports-section-head"><div><span>Upload file</span><h2>Upload CSV file</h2></div></div>
        <div className="drop-zone" onClick={() => input.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault(); chooseFile(e.dataTransfer.files[0]);}}><CloudUploadOutlinedIcon/><strong>Drop your CSV here</strong><small>or click to browse · maximum 10 MB</small><input ref={input} type="file" accept=".csv,text/csv" hidden onChange={e=>chooseFile(e.target.files?.[0])}/></div>
        {file && <div className="selected-file"><div><strong>{file.name}</strong><small>{(file.size/1024).toFixed(1)} KB · CSV</small></div><button aria-label="Remove file" onClick={clear}><DeleteOutlineIcon/></button></div>}
        {(fileError || apiError) && <p className="import-alert error"><ErrorOutlineIcon/>{fileError || apiError}</p>}
        <Button variant="contained" disabled={!file || upload.isPending || !!fileError} onClick={()=>{setViewedStep(null); upload.mutate();}}>{upload.isPending ? "Uploading & validating…" : "Upload & validate"}</Button>
      </section>
      <section className="imports-card requirements"><div className="imports-section-head"><div><span>CSV format</span><h2>Required columns</h2></div></div><p>Your {current.title.toLowerCase()} file must contain:</p><div className="column-tags">{current.columns.map(column=><b key={column}><CheckCircleOutlineIcon/>{column}</b>)}</div><div className="format-note">Column names are case-insensitive. Common names such as “Price” and “Stock” are recognized automatically.</div></section>
    </div>
    {(upload.isPending || process.isPending) && <section className="imports-card progress-card"><div><strong>{upload.isPending ? "Uploading and validating records" : `Importing ${current.title.toLowerCase()}`}</strong><span>Please keep this page open.</span></div><LinearProgress/><small>{upload.isPending ? "Checking file, columns, row values and duplicates…" : "Writing validated records in a protected database transaction…"}</small></section>}
    {job && <>
      <section ref={previewRef} className="imports-card preview-card"><div className="imports-section-head"><div><span>Step 2 · Preview & Validate</span><h2>Preview · {job.filename}</h2></div><p>{job.totalRecords.toLocaleString()} total records · {job.columns.length} detected columns</p></div>
        <div className="preview-scroll"><table><thead><tr><th>#</th>{job.columns.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{(job.rows||[]).map((row,i)=><tr key={i}><td>{i+1}</td>{job.columns.map(c=><td key={c}>{row[c] || "—"}</td>)}</tr>)}</tbody></table></div><small className="preview-caption">Showing the first {Math.min(10, job.rows?.length||0)} records. All {job.totalRecords} records were validated on the server.</small>
      </section>
      <section className="validation-grid"><article className="validation-stat total"><span>Total records</span><strong>{job.totalRecords}</strong></article><article className="validation-stat valid"><span>Valid records</span><strong>{job.validRecords}</strong></article><article className="validation-stat invalid"><span>Invalid records</span><strong>{job.failedRecords}</strong></article><article className="validation-stat duplicate"><span>Duplicates</span><strong>{job.duplicateRecords}</strong></article></section>
      {!!job.errors?.length && <section className="imports-card issues-card"><div className="imports-section-head"><div><span>Review required</span><h2>Invalid and duplicate records</h2></div><p>Showing {job.errors.length} issue{job.errors.length === 1 ? "" : "s"}</p></div><div className="preview-scroll"><table><thead><tr><th>CSV row</th><th>Type</th><th>Error reason</th><th>Record</th></tr></thead><tbody>{job.errors.map((issue, index)=><tr key={`${issue.rowNumber}-${index}`}><td>{issue.rowNumber}</td><td><span className={`issue-type ${issue.errorType.toLowerCase()}`}>{issue.errorType}</span></td><td className="issue-message">{issue.message}</td><td>{Object.values(issue.rowData).filter(Boolean).slice(0,3).join(" · ")}</td></tr>)}</tbody></table></div></section>}
      <section ref={importRef} className={`imports-card result-card ${finished ? "complete" : ""}`}><div className="result-icon"><CheckCircleOutlineIcon/></div><div><span>{finished ? "Step 4 · Result" : "Step 3 · Import"}</span><h2>{finished ? job.status : "Ready to import"}</h2><p>{finished ? `${job.successfulRecords} records added successfully. ${job.failedRecords} invalid and ${job.duplicateRecords} duplicate records were skipped.` : `${job.validRecords} valid records are ready. Invalid and duplicate rows will be skipped safely.`}</p></div><div className="result-actions">{!finished && <Button variant="contained" disabled={!job.validRecords || process.isPending} onClick={()=>{setViewedStep(null); process.mutate();}}>Import {job.validRecords} valid records</Button>}{(job.failedRecords+job.duplicateRecords)>0 && <Button variant="outlined" startIcon={<DownloadOutlinedIcon/>} onClick={()=>downloadImportErrors(job)}>Download failed records</Button>}</div></section>
    </>}
    <section ref={historyRef} className="imports-card history-card"><div className="imports-section-head"><div><span>Step 5 · History</span><h2>Import history</h2></div><p>Only imports for your company are shown.</p></div>
      <div className="preview-scroll"><table><thead><tr><th>Import ID</th><th>Type</th><th>Filename</th><th>Uploaded by</th><th>Date</th><th>Total</th><th>Success</th><th>Failed</th><th>Status</th><th></th></tr></thead><tbody>{history.isLoading ? <tr><td colSpan={10}>Loading history…</td></tr> : !history.data?.items.length ? <tr><td colSpan={10}>No imports yet.</td></tr> : history.data.items.map(item=><tr key={item.id}><td className="import-id">{item.id.slice(0,8).toUpperCase()}</td><td className="capitalize">{item.importType}</td><td>{item.filename}</td><td>{item.uploadedBy}</td><td>{new Date(item.uploadDate).toLocaleString()}</td><td>{item.totalRecords}</td><td className="success-text">{item.successfulRecords}</td><td className="error-text">{item.failedRecords + item.duplicateRecords}</td><td><span className={`history-status ${item.status.toLowerCase().replaceAll(" ", "-")}`}>{item.status}</span></td><td>{(item.failedRecords+item.duplicateRecords)>0 && <button className="download-icon" title="Download failed records" onClick={()=>downloadImportErrors(item)}><DownloadOutlinedIcon/></button>}</td></tr>)}</tbody></table></div>
    </section>
  </Box>;
}
