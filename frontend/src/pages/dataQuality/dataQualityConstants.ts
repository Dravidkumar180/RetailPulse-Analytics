// Default filter values and links to related business modules.
export const initialFilters = {
  search: "",
  issue_type: "",
  severity: "",
  module: "",
  status: "",
  date_from: "",
  date_to: "",
};

export const paths: Record<string, string> = {
  Products: "/products",
  Inventory: "/inventory",
  Sales: "/sales",
  Customers: "/customers",
  Reports: "/reports",
};
