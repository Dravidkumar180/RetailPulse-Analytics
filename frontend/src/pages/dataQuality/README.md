# Data Quality page guide

Start with `DataQualityPage.tsx`. It assembles the page sections and passes each one only the state it needs. Existing API calls, permissions, polling, filters and CSS remain unchanged.

| File | Purpose |
| --- | --- |
| `DataQualityPage.tsx` | Main page layout and component composition |
| `useDataQualityPage.ts` | API queries, polling, mutations, filter/dialog state and error recovery |
| `DataQualityHeader.tsx` | Title, Refresh and Run reconciliation buttons |
| `DataQualityAlerts.tsx` | Error banners, success messages and Retry |
| `DataQualityOverview.tsx` | KPI cards, check results and current execution status |
| `DataQualityFilters.tsx` | Search, combined filters, Apply and Reset |
| `DataQualityIssues.tsx` | Issues table, exports and pagination |
| `ReconciliationHistory.tsx` | Execution history table and pagination |
| `IssueDetailsDialog.tsx` | Record details, evidence, resolution form and status history |
| `IssueEvidence.tsx` | Reusable evidence fields and related-record tables |
| `ExecutionDetailsDialog.tsx` | Individual execution results and failed checks |
| `dataQualityTypes.ts` | API response types |
| `dataQualityConstants.ts` | Initial filters and related-module paths |
| `dataQualityFormat.tsx` | Date/ID formatting and severity/status chips |
| `DataQualityPage.css` | Shared page styles |

## Data flow

1. The page calls `useDataQualityPage` once.
2. The hook loads company-scoped data and owns all interaction state.
3. Each section receives typed props and renders its part of the page.
4. User actions call the supplied setters or mutations.
5. Query invalidation and polling refresh the displayed results.

Component props use `Pick<DataQualityPageState, ...>` to select only the fields they consume. The state type is inferred from the hook; components import it as a TypeScript type, so they do not create additional hook instances.
