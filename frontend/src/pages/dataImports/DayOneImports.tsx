import { useEffect, useRef, useState } from "react";
import { Alert, Button, LinearProgress } from "@mui/material";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import { downloadImportTemplate, previewImport, type ImportPreviewResult, type ImportType } from "../../api/dataImportApi";
import { TYPES, MAX_SIZE } from "./importConstants";
import "./DataImportsPage.css";

function safeError(error: unknown): string {
  const e = error as { response?: { status?: number; data?: { detail?: unknown } } };
  const detail = e.response?.data?.detail;
  return e.response?.status && e.response.status < 500 && typeof detail === "string"
    ? detail : "Unable to check this file. Please try again.";
}

export default function DayOneImports() {
  const [type, setType] = useState<ImportType>("products");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [templateError, setTemplateError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const current = TYPES.find(item => item.value === type)!;
  const clear = () => {
    request.current?.abort(); request.current = null;
    setFile(null); setPreview(null); setError(""); setBusy(false);
    if (input.current) input.current.value = "";
  };
  const choose = async (selected?: File) => {
    if (!selected) return;
    clear();
    if (!selected.name.toLowerCase().endsWith(".csv")) {
      setError("Invalid file type. Only .csv files are allowed."); return;
    }
    if (selected.size > MAX_SIZE) { setError("File size exceeds the 10 MB limit."); return; }
    if (!selected.size) { setError("The selected file is empty."); return; }
    setFile(selected); setBusy(true);
    const controller = new AbortController(); request.current = controller;
    try {
      const result = await previewImport(type, selected, controller.signal);
      if (request.current === controller) setPreview(result);
    } catch (err) {
      if (request.current === controller && !controller.signal.aborted) setError(safeError(err));
    } finally { if (request.current === controller) setBusy(false); }
  };
  const download = async () => {
    setDownloading(true); setTemplateError("");
    try { await downloadImportTemplate(type); }
    catch (err) { setTemplateError(safeError(err)); }
    finally { setDownloading(false); }
  };

  return <div className="imports-page day-one-imports">
    <PageHeader title="Data Import & Bulk Processing" subtitle="Prepare your datasets with CSV templates, file checks, and column validation." />
    <div className="day-one-top">
      <section className="imports-card"><h2>1. Select Import Type</h2>
        <div className="type-grid">{TYPES.map(item => <button key={item.value} aria-pressed={type === item.value}
          className={`type-card ${type === item.value ? "selected" : ""}`} onClick={() => { clear(); setType(item.value); setTemplateError(""); }}>
          <i>{item.icon}</i><strong>{item.title}</strong><small>{item.detail}</small>
        </button>)}</div>
      </section>
      <section className="imports-card"><h2>2. Download Template</h2>
        <Button fullWidth variant="outlined" startIcon={<DownloadOutlinedIcon />} disabled={downloading} onClick={download}>Download {current.title} Template (CSV)</Button>
        <div className="format-note"><strong>Template Information</strong><ul><li>Contains required column names</li><li>Includes one sample record</li><li>Replace sample data with your own records</li><li>Save as UTF-8 CSV; keep the column names</li></ul></div>
        {templateError && <Alert severity="error">{templateError}</Alert>}
      </section>
    </div>
    <section className="imports-card"><h2>3. Upload CSV File</h2>
      <div className="imports-workspace">
        <div className="drop-zone" onDragOver={e => e.preventDefault()} onDrop={e => {
          e.preventDefault();
          if (e.dataTransfer.files.length !== 1) { clear(); setError("Choose one CSV file at a time."); return; }
          void choose(e.dataTransfer.files[0]);
        }}>
          <CloudUploadOutlinedIcon /><strong>Drag and drop your CSV file here</strong><span>or</span>
          <Button variant="contained" onClick={() => input.current?.click()}>Choose File</Button>
          <small>Only .csv files are allowed (Max size: 10 MB)</small>
          <input ref={input} type="file" accept=".csv" hidden aria-label="Choose CSV file" onChange={e => void choose(e.target.files?.[0])} />
        </div>
        <div aria-live="polite">
          {file ? <><div className="selected-file"><div><strong>{file.name}</strong><small>{(file.size / 1024).toFixed(1)} KB</small></div><Button aria-label="Remove selected file" onClick={clear}>Remove</Button></div>
            <p className="success-text">✓ File extension: CSV · Size within 10 MB limit</p>
            {busy && <><p>Uploading and checking CSV structure…</p><LinearProgress aria-label="Checking CSV structure" /></>}
            {preview && <Alert severity={preview.structureValid ? "success" : "warning"}>{preview.structureValid ? "CSV structure checks passed. Review the preview below." : "Column checks need attention. Correct the file and upload it again."}</Alert>}
          </> : <p className="format-note">Select a {current.title.toLowerCase()} CSV to check its columns and preview the first five records.</p>}
          {error && <Alert severity="error">{error}</Alert>}
        </div>
      </div>
    </section>
    <div className="day-one-details">
      <section className="imports-card"><h2>4. Column Validation</h2>
        {preview?.errors.map(message => <Alert key={message} severity="error">{message}</Alert>)}
        {preview?.structureValid && <Alert severity="success">All required columns are present.</Alert>}
        <div className="preview-scroll column-checks"><table><thead><tr><th>Required Column</th><th>Status</th></tr></thead><tbody>
          {current.columns.map(column => <tr key={column}><td>{column}</td><td className={preview ? preview.missingColumns.includes(column) ? "error-text" : "success-text" : ""}>{preview ? preview.missingColumns.includes(column) ? "Missing" : "✓ Found" : "Awaiting upload"}</td></tr>)}
        </tbody></table></div>
      </section>
      <section className="imports-card"><h2>5. CSV Preview <small>(First 5 Rows)</small></h2>
        {preview ? <><p>Total Rows Detected: <strong>{preview.totalRows.toLocaleString()}</strong></p>
          <div className="preview-scroll"><table><thead><tr><th>#</th>{preview.columns.map(c => <th key={c}>{c}</th>)}</tr></thead>
            <tbody>{preview.rows.map((row, i) => <tr key={i}><td>{i + 1}</td>{preview.columns.map(c => <td key={c}>{row[c]}</td>)}</tr>)}</tbody></table></div></>
          : <p className="format-note">Your CSV preview will appear here after the file is checked.</p>}
      </section>
    </div>
    <div className="day-one-top">
      <section className="imports-card"><h2>6. Validation Summary (Basic)</h2>
        <div className="validation-grid">{[["Total Rows", preview?.totalRows.toLocaleString() ?? "—"], ["Valid Rows", "Not checked"], ["Invalid Rows", "Not checked"], ["Duplicate Rows", "Not checked"]].map(([label, value]) => <div className="validation-stat" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
        <small>Day 1 checks file structure only. Row values and duplicates have not been validated.</small>
      </section>
      <section className="imports-card"><h2>7. Next Step</h2><Button fullWidth variant="contained" disabled>Validate Data — Coming Day 2</Button>
        <Alert severity="info">Detailed validation, duplicate detection, processing, and import history are planned for the upcoming days.</Alert>
      </section>
    </div>
  </div>;
}
