# RetailPulse CSV import samples

For the current Day 1 + Day 2 workflow, upload a file and select **Validate Data**. This validates and previews records; actual import processing is reserved for the next phase.

## Day 2 demonstration

Use `day2_products_validation.csv` with **Products**. It contains 12 records: 8 valid, 3 invalid, and 1 duplicate, provided the demo SKUs/product names are not already in your company database. Invalid rows demonstrate missing Brand, nonnumeric Unit Price, and negative Stock Quantity. Use the results to try filters, search, pagination, and preview export.

## Existing samples

- `products_import_sample.csv` — Products
- `customers_import_sample.csv` — Customers
- `sales_transactions_import_sample.csv` — Sales

Sales references products/customers that must already exist in the selected company. It will report missing-reference errors until they exist. Existing records are reported as duplicates; validation does not create them. Download current templates from the app for Inventory and the other types. Sales now requires Invoice Number for reliable duplicate detection.
