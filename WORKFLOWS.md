# Workflow & Approval Management

Open **Workflows** in the sidebar or use **Request change** in Inventory, Products, or Customers. The dashboard provides company-scoped request counts, an approval queue, My Requests, filters, sorting, pagination, details, and approval history.

## Supported requests

- Stock adjustment: set the counted stock quantity, optionally including a reorder level through the API. Approval updates Product and Inventory together and adds an InventoryMovement.
- Product deactivation: change an active product to INACTIVE. Direct deletion is blocked when deactivation approval is required.
- Product price change: price must be positive, at least cost price, with at most two decimal places.
- Customer information change: validated against the existing CustomerWrite schema and company uniqueness checks. Approved name changes update sales associated with the customer ID.
- Inventory import approval: upload and validate a CSV in Data Imports, provide a reason in the confirmation dialog, and submit. The staged job remains Awaiting Approval until a separate eligible user approves it. Approval atomically releases the durable import queue; **approval is authorization to process the file, not confirmation that importing succeeded**. Check Data Imports for processing progress and final results. Workers revalidate records and preserve the existing per-row/batch error and cancellation policy.

## Lifecycle and access

Draft -> Submitted -> Pending Approval -> Approved or Rejected. Draft and pending requests may be cancelled by the requester or a company administrator. Submission and queue assignment are recorded within one transaction. Terminal states cannot be continued or approved again; a rejected or stale change requires a new request.

Viewers can view their own requests but cannot create them. Analysts and administrators may create requests. Approvers review requests assigned to their role; company administrators can review company requests. Every API uses the authenticated user's company, including super administrators: there is no cross-company override. Requests cannot be approved or rejected by their requester unless the configuration explicitly allows self approval.

Configuration defaults to active, approval required, Company Admin approver, and self approval disabled for all five request types. Configuration changes apply when a draft is submitted; pending requests retain their rules. A submission requiring approval fails without an eligible active approver. A company with only one administrator must add another eligible approver or explicitly configure self approval.

## Transaction guarantees and integrations

Approval uses a conditional status update, related-record locks, and a compare-and-set business update. Related values are revalidated; requests for stale values fail with HTTP 409 and remain pending. The business change, workflow status, history, audit events, personal notifications, inventory movement, and durable data quality changes commit together. Exceptions roll back the transaction. No service calls an intermediate commit during approval.

Existing inventory adjustments, product price/stock/status edits, product deletion, customer edits/deletion, and inventory imports independently enforce approval requirements at the backend. Normal sales remain operational and may change stock while approval is pending; stale stock approvals must be recreated. Approved product and customer changes feed the existing Sales, Notifications, Audit Logs, and Data Quality modules.

History has no update/delete API. Workflow notifications link directly to the request details and are delivered only to the requester and eligible company approvers. Audit Logs supports Workflow as a resource filter and all workflow actions.

## API (under /api/v1/workflows)

| Method | Path | Purpose |
| --- | --- | --- |
| POST | / | Create draft or submit request |
| GET | / | Search/filter/sort/paginate visible requests; scope=all, mine, queue |
| GET | /counts | Dashboard and pending approval counts |
| GET | /options?kind=TYPE | Company-scoped related record selector |
| GET | /config | Company configuration |
| PUT | /config/{type} | Administrator configuration update |
| GET | /{id} | Request details; record view in history |
| GET | /{id}/history | Approval timeline |
| POST | /{id}/submit | Submit draft |
| POST | /{id}/approve | Approve and apply |
| POST | /{id}/reject | Reject with required comment |
| POST | /{id}/cancel | Cancel draft or pending request |

Creation payload uses request_type, related_id, requested_values, reason, priority (LOW/MEDIUM/HIGH/CRITICAL), and draft (default false). Company and requester come exclusively from authentication. Action bodies contain comment. Configuration uses approver_role, approval_required, active, allow_self_approval.

## Setup and verification

Migration 021 adds workflow tables and PostgreSQL audit enum values. Run **venv\Scripts\python.exe -m alembic upgrade head** from the repository root for PostgreSQL. Local SQLite initialization creates the new tables when the API restarts.

Backend checks: from backend, run **..\venv\Scripts\python.exe -m unittest tests.test_workflows.WorkflowsTest tests.test_bulk_imports tests.test_notifications tests.test_data_quality -v**. Frontend checks: run **npm --prefix frontend run build**.

The service centralizes type validation/application, authorization, transitions, notifications, and serialization. Add future workflow types to the shared type catalog and type validation/application dispatch while retaining the same request, configuration, and history APIs.
