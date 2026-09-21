/* Defines the data shapes used for report filters, saved runs, schedules, and options. */
// Filter values are strings because they come from form inputs.
export type Filters = Record<string, string>;
// One saved report, including its table columns, optional rows, and generation status.
export type Run = {
  id: string;
  name: string;
  report_type: string;
  generated_by: string;
  created_at: string;
  filters: Filters;
  context: Record<string, string>;
  columns: string[];
  rows?: Record<string, string | number | null>[];
  total: number;
  format: string;
  status: string;
  error?: string;
  delivery_status?: string;
};
// A recurring report setup with optional details about its previous and next runs.
export type ScheduleRecord = {
  id?: string;
  name: string;
  report_type: string;
  filters: Filters;
  format: string;
  frequency: string;
  execution_time: string;
  timezone: string;
  weekday: number;
  month_day: number;
  recipients: string[];
  active: boolean;
  period: string;
  next_run?: string;
  last_run?: string;
  last_report?: Run;
};
// Choices loaded from the server for report filter dropdowns.
export type Options = {
  products: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  customers: { id: string; name: string }[];
  users: { id: string; name: string }[];
  brands: string[];
  company: string;
};
