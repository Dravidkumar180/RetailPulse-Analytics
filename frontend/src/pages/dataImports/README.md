# Data Imports — Task 17, Day 1 (30%)

The `/data-import` route renders `DayOneImports.tsx` through `DataImportsPage.tsx`.

Delivered: Products, Inventory, Customers and Sales selection; authenticated CSV template downloads; drag/drop and file picker; 10 MB limit; UTF-8 CSV parsing; required and recognized column checks; five-row preview; total row count; loading, empty and error states; responsive layout.

The page calls `GET /import/templates/{type}` and `POST /import/preview` (multipart `importType` and `file`). Both require Company Admin or Super Admin. Preview runs in the server threadpool, retains only five sample rows and makes no database writes. CSV headers are case-sensitive after trimming whitespace. Brand is required in the Day 1 Products template. Blank records are ignored; malformed records are rejected with a line number. Template sample records must be replaced before real imports.

Valid, invalid and duplicate row counts deliberately say **Not checked**: Day 1 validates structure, not record values. The disabled Validate Data action marks the Day 2 boundary. No fake totals, successful imports or error examples are displayed.

Existing advanced components and legacy upload/process/history APIs are retained for future work but are not called by the Day 1 page. They are not claimed as production-ready Task 17 delivery. Inventory processing, full validation, background jobs, history, error exports, notifications, audit lifecycle and data-quality integration remain for later days.

Verification:
- `npm.cmd --prefix frontend run build`
- From backend: `python -m unittest tests.test_import_preview -v`

Tests cover every template, preview limits, missing/unknown/duplicate headers, malformed CSV, file limits, UTF-8, quoted/multiline fields and API role restrictions without a database dependency.
