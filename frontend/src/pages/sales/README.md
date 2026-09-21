# Sales page

Start with `SalesPage.tsx`. It connects the page hook to the header, tabs, and existing sales panels.

| File | Purpose |
| --- | --- |
| `SalesHeader.tsx` | Page title, create-sale button, and analytics shortcut. |
| `SalesTabs.tsx` | List, create/edit, details, and analytics tab navigation. |
| `SalesListPanel.tsx` | Sales filters, invoice list, row actions, and pagination. |
| `SalesSummaryCards.tsx` | Summary statistics displayed above the list. |
| `SaleFormPanel.tsx` | Form layout, create/edit heading, and save-error message. |
| `SaleInformationFields.tsx` | Customer, sale date, payment method/status, sales channel, and notes. |
| `SaleItemsSection.tsx` | Add-product button, empty-item message, and list of product rows. |
| `SaleItemRow.tsx` | One product's selection, stock information, numeric fields, validation, removal, and line total. |
| `SaleBillingSummary.tsx` | Subtotal, discount, tax, grand total, and cancel/save controls. |
| `saleFormTypes.ts` | Shared form props and callback types used by the form sections. |
| `SaleDetailsPanel.tsx` | Selected invoice details and export buttons. |
| `useSalesPage.ts` | State, queries, permissions, validation, totals, mutations, and action handlers. |
| `salesExports.ts` | Invoice PDF/CSV and filtered sales-list CSV downloads, including export logging. |
| `salesConstants.ts` | Page size and initial filter values. |
| `salesUtils.ts` | Shared formatting, empty forms, sale-to-form conversion, downloads, and invoice text. |
| `SalesPage.css` | Page and panel styles. |

`SalesPage` calls `useSalesPage` once and passes the resulting data and handlers to its components. The existing list, form, details, and summary components retain their responsibilities.

API requests and sales types remain in `../../api/salesApi.ts`. Reference data comes from the catalog and customer APIs. The analytics tab renders `../analytics/AnalyticsPage.tsx`.

Filter changes reset pagination. Saving a sale refreshes affected queries and opens its details. Deleting a sale still requires the existing confirmation prompt.

The form sections receive their values and callbacks from `SaleFormPanel`. State, validation rules, total calculations, and save requests remain in `useSalesPage.ts`, so each form section focuses on displaying and editing its own fields.
