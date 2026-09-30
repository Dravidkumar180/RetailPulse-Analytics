# Data Imports — Task 17, Days 1 + 2 (60% milestone)

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

`/preview` retains five sample records. `/validate-file` returns the complete validation result for client-side filtering/pagination, bounded by the 10 MB upload restriction. This milestone is request-based validation, not a durable background job. Persistent staging, server pagination and job processing remain later-phase work.

## Business rules

| Type | Duplicate identity | Planned handling |
| --- | --- | --- |
| Products | Trimmed, case-insensitive SKU or name within category | Skip duplicates; create eligible new products |
| Customers | Case-insensitive email, digit-normalized phone, optional Customer ID | Skip duplicates, including archived records |
| Sales | Required invoice number; one transaction per invoice | Skip duplicates; require an unambiguous active customer and active product in the company |
| Inventory | Product SKU | Update existing inventory or create missing inventory for an existing product; skip repeated file SKUs; reject stock below reserved stock |

Sales templates now require Invoice Number. Product accepts SKU or an unambiguous product name. Sale Date uses YYYY-MM-DD. Price must be positive with at most two decimal places. Sales validation simulates stock allocation only for valid, nonduplicate rows. Brand remains required for product imports. Categories on new products can be new names, matching the existing product-creation behavior.

Each record has one status: duplicates take precedence over Invalid while preserving every issue. Total = Valid + Invalid + Duplicate. Error-category counts represent affected rows and may overlap. Even an invalid first occurrence claims its identifiers, so ambiguous repeated rows must be corrected before processing. Row numbers identify the starting physical CSV line, including blank lines and multiline quoted records.

## Next phase

Start Import is intentionally disabled. No records are inserted or updated from this page. Durable jobs/progress, import history/results, final error reports, cancellation, notification/audit lifecycle and reconciliation remain later-phase work. The old upload/process/history components and endpoints are retained but not called by this workflow and are not claimed as completed production functionality. The later processor must reuse these business rules and revalidate against current database state.

## Verification

- From backend: `python -m unittest tests.test_import_preview tests.test_import_validation -v` — 15 tests, including a 25,000-row file and isolated two-company integration tests.
- From frontend: `node --test tests/importValidation.test.mjs` — search/filter and export safety tests.
- Targeted ESLint and `npm.cmd --prefix frontend run build`.
- Browser visual verification was blocked by a browser-plugin initialization failure.

Demo: upload `sample-import-files/day2_products_validation.csv`, then choose Validate Data. If its demo identifiers do not already exist in the company, expect 12 rows: 8 valid, 3 invalid, 1 duplicate. Try status tabs, search, pagination, and Export Preview. Replace a required header to test column errors; changing the import type or file must clear previous validation results.
