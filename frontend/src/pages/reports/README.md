# Reports page

Start with `ReportsPage.tsx`. It renders the page header, tabs, and the components below.

| File | Purpose |
| --- | --- |
| `GenerateReports.tsx` | Report selection, generation, results, sorting, pagination, and exports. |
| `ScheduledReports.tsx` | List schedules, toggle them, and open editing or run history. |
| `ReportHistory.tsx` | Search and filter previous reports, view them, and download them. |
| `ScheduleDialog.tsx` | Form for creating or editing a schedule. |
| `DeleteScheduleDialog.tsx` | Confirmation before deleting a schedule. |
| `ReportFilters.tsx` | Shared filter fields for report generation and scheduling. |
| `ReportStatusChip.tsx` | Shared report and delivery status badges. |
| `useReports.ts` | State, API requests, validation, and action handlers. |
| `reportTypes.ts` | TypeScript definitions for reports, schedules, and filter options. |
| `reportConstants.ts` | Report choices, descriptions, icons, and colors. |
| `reportUtils.ts` | Filter cleanup, error messages, and display formatting. |
| `ReportsPage.css` | Styles shared by the page and its components. |

`ReportsPage` calls `useReports` once and passes state and actions to each component.
Each component declares the fields it needs using `Pick<ReportsState, ...>`.
Keeping state in the page's hook preserves selections and results when switching tabs.
