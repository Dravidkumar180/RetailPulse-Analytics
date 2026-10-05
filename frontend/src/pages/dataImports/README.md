# Data Imports — Task 17, Days 1?3 (80% milestone)

The `/data-import` route renders `ImportPreparationPage.tsx` through `DataImportsPage.tsx`. The percentage badge and progress banner remain removed at the user's request.

## Delivered

- Four import types: Products, Inventory, Customers, Sales.
- Authenticated CSV templates, drag/drop and file picker, maximum 10 MB.
- UTF-8, required/recognized/duplicate column checks and malformed CSV feedback.
- Initial five-record preview; explicit Validate Data action checks every record.
- Required values, numeric types/ranges/precision, integer quantities, dates, email/phone, string limits and related-record checks.
- File and company-database duplicate detection; valid/invalid/duplicate counts and percentages.
- Error categories with affected-row counts and examples.
- Full validated preview with original CSV line numbers, statuses, planned actions and all row errors. Ten rows per page by default, with 25/50 options, search, status filters and CSV export of all matching rows across pages.
- Preview export quotes fields and neutralizes spreadsheet formulas.
- Loading, empty and retry states; obsolete responses are ignored when changing/removing files or switching types.

## APIs and security

`GET /import/templates/{type}`, `POST /import/preview`, and `POST /import/validate-file` require Company Admin or Super Admin. POST requests use multipart `importType` and `file`. Detailed validation derives company scope exclusively from the signed-in account and ignores supplied company identifiers. It reads company records but performs no database writes. Parsing/validation run in the server threadpool. Files are closed after use; no persistent upload is created.

`/preview` retains five sample records. `/validate-file` returns the complete validation result for client-side filtering/pagination, bounded by the 10 MB upload restriction. Preview remains read-only. Confirming Start Import creates a separate durable job with staged rows; its processing results use server-side pagination.

## Business rules

| Type | Duplicate identity | Planned handling |
| --- | --- | --- |
| Products | Trimmed, case-insensitive SKU or name within category | Skip duplicates; create eligible new products |
| Customers | Case-insensitive email, digit-normalized phone, optional Customer ID | Skip duplicates, including archived records |
| Sales | Required invoice number; one transaction per invoice | Skip duplicates; require an unambiguous active customer and active product in the company |
| Inventory | Product SKU | Update existing inventory or create missing inventory for an existing product; skip repeated file SKUs; reject stock below reserved stock |

Sales templates now require Invoice Number. Product accepts SKU or an unambiguous product name. Sale Date uses YYYY-MM-DD. Price must be positive with at most two decimal places. Sales validation simulates stock allocation only for valid, nonduplicate rows. Brand remains required for product imports. Categories on new products can be new names, matching the existing product-creation behavior.

Each record has one status: duplicates take precedence over Invalid while preserving every issue. Total = Valid + Invalid + Duplicate. Error-category counts represent affected rows and may overlap. Even an invalid first occurrence claims its identifiers, so ambiguous repeated rows must be corrected before processing. Row numbers identify the starting physical CSV line, including blank lines and multiline quoted records.

## Day 3: background processing and results

Start Import opens a confirmation showing preview counts and duplicate policy. The backend revalidates independently of the frontend. Confirmation stages rows in `bulk_import_jobs` and `bulk_import_rows`; the response is HTTP 202. No business records are written in the HTTP start request.

The application lifespan runs a database-backed worker every two seconds. A compare-and-set claim with a 120-second lease prevents two workers from processing the same job. Validation checks the full staged file (including duplicates across batches); processing revalidates pending records in batches of 100 against current company data. The worker locks its job and relevant stock records. Each business write and row outcome are committed in the same batch transaction. Failed row writes use savepoints. A crashed worker's expired lease can be reclaimed without repeating committed records.

- Products create matching inventory and an opening stock movement.
- Inventory updates product/current/available stock and reorder level, preserving reserved units, with a stock movement.
- Customers create profiles, summaries and timeline entries.
- Sales create sale/items, decrement stock, record movements, and refresh customer purchase totals. Inconsistent product/inventory stock is rejected before a sale is written.
- Invalid rows fail; duplicates are skipped. Unexpected job failures retain completed batches and mark pending rows unprocessed.
- Cancellation takes effect at the next batch boundary; completed records remain saved. Queued imports can be cancelled immediately.
- Progress comes from committed outcomes. Total = successful + failed + skipped at completion; duplicates are a subset of skipped. Cancellation may reach 100% resolved even though some records were not imported.
- The current import is retained in the `job` URL parameter. Recent Imports shows the latest ten jobs and opens durable results after navigation/reload. Older jobs remain accessible through the paginated API.
- Success and error CSVs are available after completion/cancellation/failure. Error CSV includes failed and skipped records, original row data, source line, error type, message, action and processing status. Spreadsheet formula prefixes are neutralized.

### Processing APIs

All routes below are under `/api/v1/import/jobs`, require Company Admin or Super Admin, and derive company scope from the signed-in user.

| Method/path | Purpose |
| --- | --- |
| POST / | Multipart `importType`, `file`, `requestId` UUID; stage and queue |
| GET / | Recent/history records; `page`, `page_size` |
| GET /{id} | Status, progress, counts, duration, uploader and timestamps |
| GET /{id}/rows | Paginated `All`, `Success`, `Failed`, `Skipped`, `Pending` outcomes |
| POST /{id}/cancel | Request cooperative cancellation |
| GET /{id}/report?kind=errors or success | Download final CSV |

Repeated start requests with the same UUID, company, user and file return the same job. Reusing the UUID for different content is rejected. The frontend reuses its request UUID after an uncertain response. If the page is reloaded after a network failure, check Recent Imports before uploading again.

### Database/runtime setup

Restart the backend after updating this milestone; the worker starts with the API lifespan. Existing SQLite development databases create the two new tables through the existing startup initialization. PostgreSQL deployments must apply Alembic migration `019` before starting the updated application. No destructive schema changes are required. An API process started without lifespan will not run the worker.

### Import lifecycle integration

The page is organized into three tabs: Upload & Validate, Processing & Results, and History & Activity. The selected tab is stored in the `view` query parameter. Upload and preview components stay mounted while hidden so switching tabs preserves the file, validation results and preview filters. Starting an import or opening a history entry selects Processing & Results automatically. Direct `job` links default to that tab.

The page now includes company-scoped dashboard totals, paginated history with type/status filters, import-specific audit details, and links to Notifications and Data Quality. Upload, start, completion, failure and cancellation actions are audited in the same transaction as their job transition. Start and terminal notifications use unique per-import event keys, so replayed requests and worker recovery do not duplicate delivery. Imported business writes enter the existing durable QualityChange queue and are reconciled by the data quality monitor. Cancellation preserves committed records and their quality checks.

Apply Alembic migration `020` for PostgreSQL before running these changes; it adds start and cancellation audit enum values. Restart an API process running without automatic reload. The legacy endpoints remain for compatibility and their records are not merged into the bulk-job history. Production load testing remains a deployment responsibility; automated integration checks are not a load certification.

## Verification

- From backend: `python -m unittest tests.test_import_preview tests.test_import_validation tests.test_bulk_imports -v` — 15 tests, including a 25,000-row file and isolated two-company integration tests.
- From frontend: `node --test tests/importValidation.test.mjs` — search/filter and export safety tests.
- Targeted ESLint and `npm.cmd --prefix frontend run build`.
- Browser visual verification was blocked by a browser-plugin initialization failure.

Demo: upload `sample-import-files/day2_products_validation.csv`, then choose Validate Data. If its demo identifiers do not already exist in the company, expect 12 rows: 8 valid, 3 invalid, 1 duplicate. Try status tabs, search, pagination, and Export Preview. Replace a required header to test column errors; changing the import type or file must clear previous validation results.

Day 3 demo: after validating the demo file, choose Start Import and confirm. Expect 8 successful, 3 failed, and 1 skipped duplicate if demo records are new. Actual confirmation writes records; rerunning an imported file correctly produces additional database duplicates. Open Recent Imports to review results and download reports.
