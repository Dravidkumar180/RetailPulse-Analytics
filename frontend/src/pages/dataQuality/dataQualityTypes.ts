// API response shapes shared by the page and its data hook.
export type Run = {
  id: string;
  status: string;
  trigger: string;
  triggered_by: string;
  started_at: string;
  completed_at: string | null;
  records_checked: number;
  valid_records: number;
  warning_records: number;
  error_records: number;
  issues_detected: number;
  issues_resolved: number;
  failed_checks: { message: string }[];
  checks: { name: string; issues: number }[];
};

export type Issue = {
  id: string;
  issue_type: string;
  severity: string;
  module: string;
  record_id: string;
  record_label: string;
  description: string;
  detected_at: string;
  last_seen_at: string;
  status: string;
  resolution_note: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  evidence: Record<string, unknown>;
  history: {
    previous_status: string;
    new_status: string;
    actor: string;
    at: string;
    note: string;
  }[];
  current_record?: Record<string, unknown> | null;
  related_sales?: Record<string, unknown>[];
  movements?: Record<string, unknown>[];
};

export type Overview = {
  latest: Run | null;
  baseline: Run | null;
  unresolved: number;
  checks: string[];
};
