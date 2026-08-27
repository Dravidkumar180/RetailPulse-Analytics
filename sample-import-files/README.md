# RetailPulse CSV import samples

Upload and process these files in this exact order:

1. `products_import_sample.csv` using **Products**
2. `customers_import_sample.csv` using **Customers**
3. `sales_transactions_import_sample.csv` using **Sales Transactions**

The sales file references the SKU and customer names created by the first two
files. Importing it before those files will correctly produce “Customer does
not exist” and “Product does not exist” validation errors.

Each sample contains five valid records and uses unique SKUs, emails, phone
numbers, customer IDs, and invoice numbers. Re-uploading a file after it has
already been processed is expected to identify its rows as duplicates.
