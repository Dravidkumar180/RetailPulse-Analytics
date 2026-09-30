/* Defines import choices, required CSV columns, file size limit, and workflow labels. */
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutlined";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";

export const TYPES = [
  {
    value: "products" as const,
    title: "Products",
    detail: "Product catalog and stock",
    icon: <Inventory2OutlinedIcon />,
    columns: [
      "Product Name",
      "SKU",
      "Category",
      "Brand",
      "Unit Price",
      "Stock Quantity",
    ],
  },
  {
    value: "inventory" as const,
    title: "Inventory",
    detail: "Current stock and reorder level",
    icon: <Inventory2OutlinedIcon />,
    columns: ["SKU", "Current Stock", "Reorder Level"],
  },
  {
    value: "customers" as const,
    title: "Customers",
    detail: "Customer profiles",
    icon: <PeopleOutlineIcon />,
    columns: ["Name", "Email", "Phone"],
  },
  {
    value: "sales" as const,
    title: "Sales Transactions",
    detail: "Sales and inventory updates",
    icon: <PointOfSaleOutlinedIcon />,
    columns: ["Invoice Number", "Customer", "Product", "Quantity", "Unit Price", "Sale Date"],
  },
];
export const MAX_SIZE = 10 * 1024 * 1024;
export const WORKFLOW_STEPS = [
  "Select & Upload",
  "Preview & Validate",
  "Import",
  "Result",
  "History",
];
