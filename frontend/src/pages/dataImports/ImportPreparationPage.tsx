import { Alert, Button, LinearProgress } from "@mui/material";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import { TYPES } from "./importConstants";
import { useImportPreparation } from "./useImportPreparation";
import ValidationPreview from "./ValidationPreview";
import "./DataImportsPage.css";

const dataType = (column: string) => ["Quantity", "Stock Quantity", "Current Stock", "Reorder Level"].includes(column) ? "Whole number"
  : column === "Unit Price" ? "Number (2 decimals)" : column === "Sale Date" ? "Date (YYYY-MM-DD)" : "Text";

export default function ImportPreparationPage() {
  const { type, file, preview, validation, phase, current, downloading, download, templateError,
    selectType, rejectMultiple, choose, input, clear, error, validate } = useImportPreparation();
  const busy = phase !== "idle";
  const total = validation?.totalRows ?? preview?.totalRows;
  return <div className="imports-page day-one-imports import-preparation">
    <PageHeader title="Data Import & Bulk Processing" subtitle="Upload datasets, validate records, and review duplicates before importing." />
    <div className="preparation-top">
      <section className="imports-card"><h2>1. Select Import Type</h2>
        <div className="type-grid">{TYPES.map(item => <button key={item.value} aria-pressed={type === item.value}
          className={`type-card ${type === item.value ? "selected" : ""}`} onClick={() => selectType(item.value)}>
          <i>{item.icon}</i><strong>{item.title}</strong><small>{item.detail}</small>
        </button>)}</div>
      </section>
      <section className="imports-card"><h2>2. Download Template</h2>
        <Button fullWidth variant="outlined" startIcon={<DownloadOutlinedIcon />} disabled={downloading} onClick={download}>Download {current.title} Template (CSV)</Button>
        <div className="format-note"><strong>Template Information</strong><ul><li>Required columns and sample data included</li><li>Replace sample data with your own records</li><li>Keep column names; save as UTF-8 CSV</li>
          {type === "sales" && <li>One transaction per invoice number; Product accepts a SKU or a unique product name</li>}
          {type === "inventory" && <li>Use existing product SKUs; stock values are absolute quantities</li>}</ul></div>
        {templateError && <Alert severity="error">{templateError}</Alert>}
      </section>
      <section className="imports-card"><h2>3. Upload CSV File</h2>
        <div className="drop-zone" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault();
          if (e.dataTransfer.files.length !== 1) { rejectMultiple(); return; } void choose(e.dataTransfer.files[0]); }}>
          <CloudUploadOutlinedIcon /><strong>Drag and drop your CSV file here</strong><span>or</span>
          <Button variant="contained" onClick={() => input.current?.click()}>Choose File</Button>
          <small>Only CSV · Maximum 10 MB</small>
          <input ref={input} type="file" accept=".csv" hidden aria-label="Choose CSV file" onChange={e => void choose(e.target.files?.[0])} />
        </div>
        <div aria-live="polite">{file && <div className="selected-file"><div><strong>{file.name}</strong><small>{(file.size / 1024).toFixed(1)} KB</small></div><Button aria-label="Remove selected file" onClick={clear}>Remove</Button></div>}
          {busy && <><p>{phase === "validating" ? "Validating records and checking duplicates…" : "Uploading and checking CSV structure…"}</p><LinearProgress aria-label={phase === "validating" ? "Validating records" : "Checking CSV structure"} /></>}
          {error && <Alert severity="error">{error}</Alert>}
        </div>
      </section>
    </div>
    <div className="preparation-checks">
      <section className="imports-card"><h2>4. File Validation</h2><div className="preview-scroll column-checks"><table><tbody>
        {[["File type", file ? "CSV (Valid extension)" : "Awaiting upload"], ["File size", file ? `${(file.size / 1024).toFixed(1)} KB (Valid)` : "Awaiting upload"], ["Allowed size", "Maximum 10 MB"], ["File encoding", preview ? "UTF-8 (Valid)" : "Awaiting file check"]].map(([label, value]) => <tr key={label}><th>{label}</th><td>{value}</td></tr>)}
      </tbody></table></div><p className="format-note">File checks run on the server. Validation reads only your company’s records and does not save business data.</p></section>
      <section className="imports-card"><h2>5. Column Validation</h2>
        {preview?.errors.map(message => <Alert key={message} severity="error">{message}</Alert>)}
        {preview?.structureValid && <Alert severity="success">All required columns are present.</Alert>}
        <div className="preview-scroll column-checks"><table><thead><tr><th>Required Column</th><th>Status</th><th>Data Type</th><th>Sample Value</th></tr></thead><tbody>
          {current.columns.map(column => <tr key={column}><td>{column}</td><td className={preview ? preview.missingColumns.includes(column) ? "error-text" : "success-text" : ""}>{preview ? preview.missingColumns.includes(column) ? "Missing" : "Found" : "Awaiting upload"}</td>
            <td>{validation?.columnTypes[column] ?? dataType(column)}</td><td title={preview?.rows[0]?.[column]}>{preview?.rows[0]?.[column] || "—"}</td></tr>)}
        </tbody></table></div>
      </section>
      <div className="preparation-summary" aria-live="polite"><section className="imports-card"><h2>6. Validation Summary</h2>
        <div className="validation-grid">{[["Total Rows", total, ""], ["Valid Rows", validation?.validRows, "valid"], ["Invalid Rows", validation?.invalidRows, "invalid"], ["Duplicate Rows", validation?.duplicateRows, "duplicate"]].map(([label, value, style]) => <div className={`validation-stat ${style}`} key={String(label)}><span>{label}</span><strong>{typeof value === "number" ? value.toLocaleString() : "Not checked"}</strong>{validation && typeof value === "number" && label !== "Total Rows" && <small>{(value / validation.totalRows * 100).toFixed(1)}%</small>}</div>)}</div>
        <small>{validation ? "Rows with duplicates are counted as Duplicate, even if they also contain invalid values." : "Choose Validate Data to check every row and detect duplicates."}</small>
      </section><section className="imports-card"><h2>7. Validation Errors by Type</h2>
        {validation ? <><div className="preview-scroll column-checks"><table><thead><tr><th>Error Type</th><th>Rows</th><th>Example</th></tr></thead><tbody>{validation.errorSummary.map(item => <tr key={item.type}><td>{item.type}</td><td>{item.count}</td><td className="validation-messages">{item.example || "—"}</td></tr>)}</tbody></table></div><small>A row can have multiple error types; these counts can overlap.</small></> : <p className="format-note">Validation errors will appear here after you validate the data.</p>}
      </section></div>
    </div>
    <div className="preparation-bottom">
      {validation ? <ValidationPreview result={validation} /> : <section className="imports-card"><h2>8. Import Preview <small>(First 5 Rows)</small></h2>
        {preview ? <><p>Total Rows Detected: <strong>{preview.totalRows.toLocaleString()}</strong></p><div className="preview-scroll"><table><thead><tr><th>CSV Row</th>{preview.columns.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>{preview.rows.map((row, i) => <tr key={i}><td>{preview.rowNumbers[i]}</td>{preview.columns.map(c => <td key={c} title={row[c]}>{row[c] || "—"}</td>)}</tr>)}</tbody></table></div><p className="format-note">Validate the data to browse all rows, filter by status, search, and export the preview.</p></> : <p className="format-note">Upload a CSV to preview its records.</p>}
      </section>}
      <section className="imports-card preparation-next"><h2>9. Next Step</h2>
        <Button fullWidth variant="contained" disabled={!preview?.structureValid || busy} onClick={validate}>{phase === "validating" ? "Validating…" : validation ? "Revalidate Data" : "Validate Data"}</Button>
        <Button fullWidth variant="contained" disabled>Start Import</Button>
        <Alert severity={validation ? validation.invalidRows || validation.duplicateRows ? "warning" : "success" : "info"}>{validation ? `${validation.validRows} rows passed validation. Review the results before continuing.` : "Validate mandatory fields, data types, values, and duplicates before importing."}</Alert>
        {validation && <div className="format-note"><strong>Duplicate handling</strong><p>{validation.duplicatePolicy}</p></div>}
        <p className="format-note">Import processing will be available in the next phase. Validation does not insert or update any records. Results reflect the current database and must be checked again when processing is added.</p>
      </section>
    </div>
  </div>;
}
