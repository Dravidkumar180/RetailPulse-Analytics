import type { ImportValidationResult, ValidatedImportRow } from "../../api/dataImportApi";

export function filterValidationRows(rows: ValidatedImportRow[], status: string, search: string) {
  const query = search.trim().toLowerCase();
  return rows.filter(row => (status === "All" || row.status === status)
    && (!query || [String(row.rowNumber), ...Object.values(row.data), ...row.issues.map(i => i.message)]
      .some(value => value.toLowerCase().includes(query))));
}

// Quote every field and neutralize spreadsheet formulas in user-controlled CSV cells.
function csvCell(value: string | number) {
  let text = String(value);
  if (/^\s*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function validationPreviewCsv(result: ImportValidationResult, rows: ValidatedImportRow[]) {
  const lines = [["CSV Row", ...result.columns, "Validation Status", "Planned Action", "Error Type", "Error Message"],
    ...rows.map(row => [row.rowNumber, ...result.columns.map(c => row.data[c]), row.status, row.action,
      [...new Set(row.issues.map(i => i.type))].join("; "), row.issues.map(i => i.message).join("; ")])];
  return "\uFEFF" + lines.map(row => row.map(csvCell).join(",")).join("\r\n");
}
