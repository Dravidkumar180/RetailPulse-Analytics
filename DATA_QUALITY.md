# Data Quality & Reconciliation

Open **Data Quality** (`/data-quality`) from the sidebar. Company administrators and super administrators can run checks and update issues; analysts can inspect and export. Every module endpoint scopes records to the signed-in company, including super administrators.

## Setup

For PostgreSQL, apply Alembic migration `018` before starting the updated API (`alembic upgrade head` from the project root with the backend on PYTHONPATH). SQLite development startup creates the new tables and adds the nullable historical-availability field. Restart the API to register the routes and automatic-check worker.

## Checks and evidence

- Product SKU syntax, normalized duplicates, mandatory fields and missing inventory.
- Customer mandatory fields and cached purchase-summary totals against the existing reporting aggregation.
- Inventory versus product balance, available/reserved arithmetic and the latest movement; movement arithmetic and chain continuity.
- Sale stock withdrawals exceeding their pre-transaction availability. New sale movements capture availability before reservations are deducted. Legacy rows without that snapshot use the recorded physical balance; historical reservations cannot be reconstructed.
- Sales with missing or currently inactive products, invalid/deleted customers, and invoice/line totals that disagree. `OUT_OF_STOCK` products remain valid references. Legacy name-only customers are permitted by the existing sales schema.
- Saved report numeric totals versus the same report query and filters over current transactions. These are warnings because subsequent legitimate changes can make a snapshot stale. Reconciliation does not rewrite reports or business records.

Evidence is a diagnostic snapshot, with current tenant-scoped records, recent movements and related sales available in issue details. KPI counts refer to the last completed full/manual reconciliation, while unresolved issue counts are live. A record with multiple findings counts once, with errors taking precedence over warnings.

## Execution and lifecycle

Manual requests return HTTP 202 and run in the background. The UI polls execution status. Pending manual runs persist and the scheduler can claim them after a restart. Claimed runs interrupted for more than one hour are marked failed and release their company lock. One running execution per company is enforced by a unique active-company key.

A transactional outbox records ORM changes in products, customers, sales/items, inventory/movements and reports, including changes made by imports. The worker checks batches of at most 500 outbox entries every 10 seconds and expands only affected product/customer relationships. It does not run the full report history for every business mutation. External direct SQL writes are covered by manual reconciliation.

A unique company/type/record key prevents duplicate issues. Open and investigating findings resolve automatically when their records pass; resolved findings reopen if detected again. Ignored findings stay ignored. Failures do not resolve unchecked issues. Every status change records previous/new status, actor identity, timestamp and note, and produces an Audit Log entry. New findings create existing-system notifications for administrators.

CSV and PDF exports honor the applied filters and record an export audit event. CSV cells are protected against spreadsheet formula interpretation.

## API

All routes are under `/api/v1/data-quality`:

- `GET /overview`
- `POST /runs`, `GET /runs`, `GET /runs/{id}`
- `GET /issues`, `GET /issues/{id}`, `PATCH /issues/{id}`
- `GET /export?format=CSV|PDF`

List/export filters: `search`, `issue_type`, `severity`, `module`, `status`, `date_from`, `date_to`. Dates are inclusive UTC calendar dates; list pagination uses `page` and `page_size` (maximum 100). Status updates require `status`, `previous_status`, and a nonblank `note`; stale edits return 409.

## Verification

Run `venv/Scripts/python.exe -m unittest tests.test_data_quality.QualityTest tests.test_reports tests.test_notifications -v` with `PYTHONPATH=backend`, and `npm --prefix frontend run build`.
