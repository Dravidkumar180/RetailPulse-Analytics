import { useDeferredValue, useMemo, useState } from "react";
import { Button, Pagination, TextField } from "@mui/material";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import type { ImportValidationResult } from "../../api/dataImportApi";
import { filterValidationRows, validationPreviewCsv } from "./validationPreviewUtils";

export default function ValidationPreview({ result }: { result: ImportValidationResult }) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const query = useDeferredValue(search.trim().toLowerCase());
  const filtered = useMemo(() => filterValidationRows(result.rows, filter, query), [result, filter, query]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);
  const start = (currentPage - 1) * pageSize;
  const exportPreview = () => {
    const blob = new Blob([validationPreviewCsv(result, filtered)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a");
    link.href = url; link.download = "import_validation_preview.csv"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <section className="imports-card validated-preview"><h2>8. Import Preview</h2>
    <div className="validation-toolbar">
      <div className="validation-filters" aria-label="Filter validation rows">{[
        ["All", result.totalRows], ["Valid", result.validRows], ["Invalid", result.invalidRows], ["Duplicate", result.duplicateRows],
      ].map(([label, count]) => <Button key={label} variant={filter === label ? "contained" : "outlined"} aria-pressed={filter === label}
        onClick={() => { setFilter(String(label)); setPage(1); }}>{label} Rows ({count})</Button>)}</div>
      <TextField size="small" label="Search preview" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      <Button startIcon={<DownloadOutlinedIcon />} onClick={exportPreview} disabled={!filtered.length}>Export Preview ({filtered.length})</Button>
    </div>
    <div className="preview-scroll"><table><thead><tr><th>CSV Row</th>{result.columns.map(c => <th key={c}>{c}</th>)}<th>Status</th><th>Planned Action</th><th>Error Message</th></tr></thead>
      <tbody>{filtered.slice(start, start + pageSize).map(row => <tr key={row.rowNumber} className={`validation-row-${row.status.toLowerCase()}`}>
        <td>{row.rowNumber}</td>{result.columns.map(c => <td key={c} title={row.data[c]}>{row.data[c] || "—"}</td>)}
        <td><span className={`row-status ${row.status.toLowerCase()}`}>{row.status}</span></td><td>{row.action}</td>
        <td className="validation-messages">{row.issues.length ? row.issues.map((issue, i) => <div key={i}><strong>{issue.type}:</strong> {issue.message}</div>) : "—"}</td>
      </tr>)}{!filtered.length && <tr><td colSpan={result.columns.length + 4}>No rows match this filter or search.</td></tr>}</tbody></table></div>
    <div className="validation-pagination"><small>Showing {filtered.length ? start + 1 : 0}–{Math.min(start + pageSize, filtered.length)} of {filtered.length} matching rows</small>
      <Pagination count={pages} page={currentPage} onChange={(_, value) => setPage(value)} color="primary" size="small" />
      <label>Rows per page <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>{[10, 25, 50].map(n => <option key={n}>{n}</option>)}</select></label>
    </div><small>CSV row numbers include the header and blank lines. Export includes all matching rows, across pages. Actions are planned only; no records have been imported.</small>
  </section>;
}
