# Audit logs page

Start with `AuditLogsPage.tsx`, which assembles the page and connects its components to state and actions.

| File | Purpose |
| --- | --- |
| `AuditLogsHeader.tsx` | Page title, live update indicator, export buttons, and clear button. |
| `AuditLogFilters.tsx` | Search, user, action, resource, status, date, and sort controls. |
| `AuditLogStats.tsx` | Total, successful, failed, and today's log counts. |
| `AuditLogTable.tsx` | Log rows, loading/error states, selection, and pagination. |
| `AuditLogTimeline.tsx` | Recent activity from the current results. |
| `AuditLogDetails.tsx` | Selected log's overview, description, and additional information. |
| `AuditLogChanges.tsx` | Before-and-after values for the selected event. |
| `ClearAuditLogsDialog.tsx` | Confirmation and error display for clearing old logs. |
| `useAuditLogsPage.ts` | Queries, automatic refresh, filters, pagination, selection, and clear mutation. |
| `useAuditLogExport.ts` | Load all matching results, download CSV, and open a printable PDF view. |
| `auditLogConstants.ts` | Initial filter values. |
| `auditLogUtils.ts` | Shared action, resource, status, and date formatting. |
| `AuditLogsPage.css` | Page and component styles. |

API calls and server response types remain in `../../api/auditLogApi.ts`.
The existing `../../hooks/useAuditLogs.ts` is a separate query hook; this page's state is managed by `useAuditLogsPage.ts`.
`AuthenticationMonitor.tsx` is an existing separate component and is not rendered by this page.

Data flows from `useAuditLogsPage` through `AuditLogsPage` to the display components. User actions call the hook's handlers to update filters, fetch results, export data, or clear old logs.
