import test from "node:test";
import assert from "node:assert/strict";
import { filterValidationRows, validationPreviewCsv } from "../src/pages/dataImports/validationPreviewUtils.ts";

const rows = [
  { rowNumber: 2, data: { Name: "Laptop" }, status: "Valid", action: "Create", issues: [] },
  { rowNumber: 3, data: { Name: "Mouse" }, status: "Invalid", action: "Reject", issues: [{ type: "Invalid value", message: "Price must be positive" }] },
  { rowNumber: 4, data: { Name: "LAPTOP" }, status: "Duplicate", action: "Skip", issues: [{ type: "Duplicate in file", message: "Duplicate name" }] },
];

test("status and case-insensitive search combine across values, CSV rows and errors", () => {
  assert.equal(filterValidationRows(rows, "All", " laptop ").length, 2);
  assert.deepEqual(filterValidationRows(rows, "Duplicate", "laptop").map(r => r.rowNumber), [4]);
  assert.deepEqual(filterValidationRows(rows, "All", "positive").map(r => r.rowNumber), [3]);
  assert.deepEqual(filterValidationRows(rows, "All", "2").map(r => r.rowNumber), [2]);
  assert.equal(filterValidationRows(rows, "Valid", "no match").length, 0);
});

test("export preserves validation reasons and includes all filtered rows across pages", () => {
  const many = Array.from({ length: 25 }, (_, i) => ({ ...rows[0], rowNumber: i + 2 }));
  const csv = validationPreviewCsv({ columns: ["Name"] }, many);
  assert.equal(csv.split("\r\n").length, 26);
  assert.ok(csv.includes('"26","Laptop","Valid","Create"'));
  const invalid = validationPreviewCsv({ columns: ["Name"] }, filterValidationRows(rows, "Invalid", ""));
  assert.ok(invalid.includes("Price must be positive"));
  assert.ok(!invalid.includes("Laptop"));
});

test("CSV export neutralizes formulas and escapes quotes, commas and line breaks", () => {
  for (const text of ["=1+1", " +SUM(1,2)", "@SUM(1)", "-1+2", "\t=1+1", "\n=1+1"]) {
    const csv = validationPreviewCsv({ columns: ["Name"] }, [{ ...rows[0], data: { Name: text } }]);
    assert.ok(csv.includes(`"'${text}"`));
  }
  const csv = validationPreviewCsv({ columns: ["Name"] }, [{ ...rows[0], data: { Name: 'Doe, "Jane"\nSecond line' } }]);
  assert.ok(csv.includes('"Doe, ""Jane""\nSecond line"'));
  assert.ok(csv.startsWith("\uFEFF"));
});
