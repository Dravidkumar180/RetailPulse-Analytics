// Summarizes each user's login and logout activity.
import { Alert, Box, Typography } from "@mui/material";
import type { AuthenticationSummary } from "../../api/auditLogApi";
import Button from "../../components/common/Button/Button";
import { formatAuditDateTime } from "./auditLogUtils";

type Props = {
  summaries?: AuthenticationSummary[];
  loading: boolean;
  failed: boolean;
  onRefresh: () => void;
};

// This component receives prepared data and renders the feature-specific interface.
export default function AuthenticationMonitor({
  summaries,
  loading,
  failed,
  onRefresh,
}: Props) {
  return (
    <Box className="audit-logs-page__auth-section">
      <Box className="audit-logs-page__auth-heading">
        <Box>
          <Typography component="h2">Authentication Monitor</Typography>
          <Typography component="p">
            Login and logout events are retained individually and summarized
            here to keep the activity table readable.
          </Typography>
        </Box>
        <Button size="small" variant="outlined" onClick={onRefresh}>
          Refresh summary
        </Button>
      </Box>

      {failed ? (
        <Alert severity="error">Unable to load authentication totals.</Alert>
      ) : (
        <Box className="audit-logs-page__auth-grid">
          {(summaries ?? []).map((summary) => (
            <Box className="audit-logs-page__auth-card" key={summary.userId}>
              <Box className="audit-logs-page__auth-user">
                <Box>{summary.name.charAt(0).toUpperCase()}</Box>
                <Box>
                  <Typography component="strong">{summary.name}</Typography>
                  <Typography component="span">{summary.email}</Typography>
                </Box>
                <span
                  className={[
                    "audit-logs-page__auth-state",
                    `audit-logs-page__auth-state--${summary.state.toLowerCase()}`,
                  ].join(" ")}
                >
                  {summary.state === "SIGNED_IN" ? "Signed in" : "Signed out"}
                </span>
              </Box>

              <Box className="audit-logs-page__auth-counts">
                <AuthenticationCount
                  label="Total logins"
                  count={summary.loginCount}
                  lastActivity={summary.lastLogin}
                />
                <AuthenticationCount
                  label="Total logouts"
                  count={summary.logoutCount}
                  lastActivity={summary.lastLogout}
                />
              </Box>
            </Box>
          ))}

          {!loading && !summaries?.length && (
            <Typography className="audit-logs-page__auth-empty">
              No login or logout activity has been recorded.
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}

function AuthenticationCount({
  label,
  count,
  lastActivity,
}: {
  label: string;
  count: number;
  lastActivity: string | null;
}) {
  return (
    <Box>
      <Typography component="strong">{count}</Typography>
      <Typography component="span">{label}</Typography>
      <Typography component="small">
        Last: {lastActivity ? formatAuditDateTime(lastActivity) : "Never"}
      </Typography>
    </Box>
  );
}
