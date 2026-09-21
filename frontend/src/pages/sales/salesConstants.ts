/* Stores sales page size and the starting filter values. */
import type { SalesFiltersState } from "./SalesListPanel";

export const PAGE_SIZE = 10;
export const EMPTY_FILTERS: SalesFiltersState = {
  search: "",
  categoryId: "",
  channel: "",
  payment: "",
  paymentStatus: "",
  startDate: "",
  endDate: "",
  sort: "date",
};
