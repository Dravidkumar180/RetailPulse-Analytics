/* Defines the report choices with their names, descriptions, icons, and colors. */
import {
  AssessmentOutlined,
  Inventory2Outlined,
  PeopleOutlined,
  TrendingUp,
  SwapVert,
} from "@mui/icons-material";

export const types = [
  {
    id: "sales",
    name: "Sales Report",
    description: "Transactions, revenue and order details",
    icon: AssessmentOutlined,
    color: "green",
  },
  {
    id: "inventory",
    name: "Inventory Report",
    description: "Stock availability, value and reorder levels",
    icon: Inventory2Outlined,
    color: "orange",
  },
  {
    id: "customer",
    name: "Customer Report",
    description: "Customer details and purchase analysis",
    icon: PeopleOutlined,
    color: "purple",
  },
  {
    id: "product_performance",
    name: "Product Performance Report",
    description: "Sales performance and product revenue",
    icon: TrendingUp,
    color: "purple",
  },
  {
    id: "stock_movement",
    name: "Stock Movement Report",
    description: "Stock in, stock out and adjustment history",
    icon: SwapVert,
    color: "green",
  },
];
