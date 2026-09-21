# Data imports page

Start with `DataImportsPage.tsx`. It assembles the import workflow using the components below.

| File | Purpose |
| --- | --- |
| `ImportWorkflow.tsx` | Step navigation, available steps, and completion indicators. |
| `ImportTypeSelector.tsx` | Product, customer, and sales import choices. |
| `ImportUpload.tsx` | CSV selection, drag and drop, upload errors, and required columns. |
| `ImportProgress.tsx` | Progress display while uploading or processing. |
| `ImportPreview.tsx` | Preview of the uploaded file's columns and rows. |
| `ImportValidation.tsx` | Record counts and invalid/duplicate row details. |
| `ImportResult.tsx` | Start the import, show its result, and download failed records. |
| `ImportHistory.tsx` | Previous imports, URL-based selection, and error downloads. |
| `useDataImportsPage.ts` | State, file validation, API queries/mutations, cache refresh, and scrolling between steps. |
| `importConstants.tsx` | Import choices with icons and required columns, file size limit, and workflow labels. |
| `importUtils.ts` | API error message extraction. |
| `DataImportsPage.css` | Shared page and component styles. |

`DataImportsPage` calls `useDataImportsPage` once. Components declare the state and handlers they need using `Pick<DataImportsPageState, ...>`. Preview, validation, and result components receive a completed upload's `ImportRecord`.

API requests and server types remain in `../../api/dataImportApi.ts`. Uploading validates the CSV; processing imports its valid rows. The hook refreshes the relevant cached data after each action.
