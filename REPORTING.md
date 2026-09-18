# Reporting and scheduled reports

The Reports navigation entry now opens generation, schedules and history. Reports read existing Sales/SaleItem, Product/Category, Customer, Inventory and InventoryMovement tables. Product performance and customer purchase metrics aggregate those same records used by analytics. Only generated report snapshots and schedule definitions are stored; source business records are never copied into reporting tables.

## Installation

Install the existing backend dependencies, then `venv\Scripts\python -m pip install -r backend/requirements-reports.txt`.
Set the production DATABASE_URL, then run `$env:PYTHONPATH="backend"; .\venv\Scripts\python.exe -m alembic upgrade head` from the repository root for PostgreSQL. Local SQLite development creates the new tables on API startup. Restart the API to load the reporting routes and worker.

## Email delivery

Set these environment variables on the API process:

- `REPORT_SMTP_HOST`: SMTP server
- `REPORT_SMTP_PORT`: port (default 587)
- `REPORT_SMTP_FROM`: sender email address
- `REPORT_SMTP_STARTTLS`: true by default
- `REPORT_SMTP_USER` and `REPORT_SMTP_PASSWORD`: credentials if required

The worker checks due schedules every 30 seconds while the API runs. Daily, weekly (selected weekday), and monthly (day 1-28) execution uses the selected IANA timezone. Rolling periods mean the previous day, previous seven days, or previous calendar month. Fixed periods retain saved dates. Missed occurrences coalesce into one execution after restart. Atomic due-time advancement prevents two workers claiming the same occurrence. SMTP delivery is not automatically retried because a connection failure can occur after a message has been accepted. Check recipients before manually resending. Interrupted in-progress runs are marked failed/unknown after one hour. The execution history record and claim are committed atomically. Interrupted runs are visible as failures; strict guaranteed email delivery would require a transactional delivery queue/outbox.

Missing SMTP settings or rejected delivery leaves the generated report downloadable, with a separate failed delivery status and reason. No real email is sent during automated tests.

## Permissions and semantics

All authenticated roles may generate, view and download reports for their own company. Super Admin, Company Admin and Analyst may manage company schedules. A schedule runs as its last editor; execution checks that owner is active, still belongs to the company and retains schedule permissions. Losing permission disables the schedule and records a failure. Even super admins cannot cross the report tenant boundary. Company scope is derived from authentication and cannot be supplied in request filters.

Inventory is a current stock snapshot; dates filter last inventory update, not historical stock balances. Sales/customer/product revenue uses item line totals, matching filtered items, with payment status explicitly selectable. Product costs use the current catalog cost, not historical profit. Customers with no orders appear when no transaction filters are supplied. Date boundaries are inclusive UTC dates for source timestamps. History timestamps display in the browser timezone.

Reports save the generated result so history and exports remain reproducible after business records change. CSV includes report context and protects against spreadsheet formula injection. PDF repeats table headings, wraps cell contents and includes context and page numbers. Table sorting/pagination affects the view; exports include the whole generated report in its original order.

Results are generated synchronously and stored as JSON snapshots; very large datasets should move to a background generation queue and object storage with a retention policy before high-volume production use.

## API

All paths are under `/api/v1/reports`, using existing bearer authentication:

- GET `/options`: company-scoped filter options
- POST `/generate`: report_type, filters, format
- GET `/history`: page, page_size, report_type, status, search, schedule_id
- GET `/{id}`: page, page_size, sort_by, direction
- GET `/{id}/download?format=CSV|PDF`
- GET/POST `/schedules`
- PUT/DELETE `/schedules/{id}`

Schedule payloads additionally accept name, frequency, execution_time, timezone, weekday, month_day, recipients, active and period. Unknown payload fields and irrelevant filters are rejected.

## Verification

Run `$env:PYTHONPATH='backend'; .\venv\Scripts\python.exe -m unittest discover -s backend/tests` in PowerShell. PDF tests additionally require pypdf (`pip install pypdf`). Build the UI with `npm --prefix frontend run build`.
