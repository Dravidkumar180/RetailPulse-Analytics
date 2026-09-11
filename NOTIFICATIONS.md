# Notification and Alert Management

The main layout bell links to `/notifications`. The inbox provides pagination, combined read/type/priority/lifecycle filters, event details, resource links, read actions, loading/empty/error states, and a retry action. It follows the reference's blue workspace styling with priority badges and distinct unread rows.

## Flow and delivery

Business write -> SQLAlchemy transaction event collection -> inventory/import evaluation -> role-based per-user delivery -> notifications table and audit logs -> commit -> authenticated `/api/v1/notifications` API -> React Query -> bell and center -> read mutation -> database update and query invalidation.

Product, inventory and sales writes evaluate affected companies before commit. Import terminal outcomes are collected across flushes and emitted in the same transaction; failed import processing rolls back business writes and records a failure notification in the failure transaction. Existing audited sales create/update/delete events create sales alerts; audited catalog, user, settings and forecasting activities create admin system alerts. Customer creation/VIP events also feed the centralized inbox. No client-generated notification records are trusted.

A startup/background reconciliation runs every 30 seconds, including for existing inventory and aging demand windows. Errors are logged and retried on the next cycle. Notification GET requests do not generate alerts. The frontend polls every 15 seconds and refetches on focus; read mutations invalidate all inbox queries for that company/user/role. Polling suits the existing REST application without persistent socket infrastructure. Normal writes become visible within about 15 seconds; scheduled inventory changes within about 45 seconds. This is near-real-time, not instantaneous push.

## Inventory rules (highest matching condition wins)

Available units = product stock quantity minus inventory reserved units, floored at zero. Product stock is the shared stock source already updated by catalog, inventory adjustments and imported/normal sales. Reorder point uses the inventory setting, or 5 when inventory has not been initialized. Daily demand = units from non-failed sales in the last 30 days / 30. Future-dated sales are excluded.

| Condition | Type | Priority |
| --- | --- | --- |
| Available stock = 0 | OUT_OF_STOCK | Critical |
| Positive demand and available stock / daily demand <= 3 days | STOCKOUT_RISK | High |
| Available stock < reorder point | LOW_STOCK | Medium |
| Available stock > threshold = max(3 x reorder point, ceil(60 x daily demand), 1) | OVERSTOCK | Low below 2 x threshold; Medium from 2 x; High from 3 x; Critical from 5 x |
| None of the above | No active inventory alert | - |

Equality with reorder point does not trigger low stock. Overstock with no recent demand uses 3 x reorder point, with a minimum threshold of 1. Recommended replenishment = max(0, max(2 x reorder point, ceil(14 x daily demand)) - available stock). Active inventory priorities, messages and details refresh during evaluation, preserving notification identity, creation time and read state. Resolved alerts retain their last snapshot; product links show the current SKU-filtered catalog. Import links filter history to the related import.

Import completed = Low; completed with invalid/duplicate rows = Medium; failed = High. Sales create/update/delete = Medium. General system activity = Low.

## Role matrix and isolation

| Category | Super Admin / Company Admin | Analyst | Viewer |
| --- | --- | --- | --- |
| Inventory alerts | Yes | Yes | No |
| Sales alerts | Yes | Yes | No |
| Import outcomes | Yes | No | No |
| System/customer activity | Yes | No | No |

Import access is admin-only in the existing application, so analysts do not receive import details. Viewers have an accessible empty inbox and no business alert subscriptions. Only active users receive delivery. Current role eligibility is rechecked on every API call, so downgrading a user hides previously delivered unauthorized categories. Even super admins are confined to their own company and personal inbox. Requests never accept a recipient or company override. Invalid/foreign notification IDs cannot disclose or change other users' records.

## Deduplication and lifecycle

A unique `(user_id, active_key)` identifies each ongoing product/type condition. Repeated evaluation and concurrent insertion use database conflict handling, so reading an alert does not regenerate it. Resolution clears the active key and sets resolved_at; recurrence creates a new alert. A priority/type transition resolves the previous condition. Inactive/deleted products resolve their alerts. Resolved alerts remain in history and are excluded from the unread badge. Event notifications expire after 30 days; expired records remain in history and are excluded immediately from active queries. Reading does not resolve a business condition.

A unique `(user_id, event_key)` deduplicates import terminal outcomes by import ID/status and customer events by source event ID. Audited sales/system changes are separate legitimate events. Creation, inventory resolution, single read and bulk read are recorded in existing Audit Logs. Single/bulk reads update only unread rows; bulk read affects active notifications in the caller's personal inbox, regardless of selected UI filters.

## API

All endpoints use existing bearer-token authentication:

- GET `/api/v1/notifications`: page (>=1), page_size (1-100), status (all/read/unread), type, priority, lifecycle (active/resolved/all). Returns items and total.
- GET `/api/v1/notifications/unread-count`: returns count across all active unread categories authorized for the caller.
- GET `/api/v1/notifications/{uuid}`: authorized event details.
- PATCH `/api/v1/notifications/{uuid}/read`: idempotent, preserves original read timestamp.
- PATCH `/api/v1/notifications/read-all`: returns updated count.

The old inventory/customer company-wide notification endpoints return 410 with the replacement path. Legacy tables remain untouched for historical preservation; their shared read state cannot be safely converted into personal read state. Current inventory is evaluated on startup; historical sales/import/system events are not replayed.

## Setup and validation

Local SQLite startup creates the new table automatically. For an existing PostgreSQL installation, apply Alembic revision 016 before starting the updated application, using the project's migration configuration. Revision 016 creates the notification table/indexes and adds notification audit enum values. This change does not repair unrelated historical schema gaps.

From the repository root: `npm --prefix frontend run build`.
From backend: `../venv/Scripts/python.exe -B -m unittest discover -s tests -v`.
The test client dependency is recorded in backend/requirements-test.txt.

Tests use a separate in-memory database and exercise ownership, role changes, validation, combined filters, pagination, read idempotency, rollback, import outcomes, expiry, stock recovery/recurrence and inventory rule boundaries. Production PostgreSQL and browser visual validation require their corresponding runtimes; the provided browser runtime failed to initialize during this implementation.
