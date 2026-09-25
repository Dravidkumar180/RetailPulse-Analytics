// Request errors and action feedback.
import { Alert, Button } from "@mui/material";
import type { DataQualityPageState } from "./useDataQualityPage";

type Props = Pick<
  DataQualityPageState,
  "error" | "queryError" | "retry" | "message" | "setMessage"
>;

export default function DataQualityAlerts({
  error,
  queryError,
  retry,
  message,
  setMessage,
}: Props) {
  return (
    <>
      {error && (
        <Alert severity="error" action={<Button onClick={retry}>Retry</Button>}>
          {queryError &&
          (queryError as { response?: { status?: number } }).response
            ?.status === 404
            ? "The Data Quality API is unavailable. The backend needs to load the latest application version."
            : (error as { response?: { data?: { detail?: string } } }).response
                ?.data?.detail ||
              "Unable to load or update data quality. Please retry."}
        </Alert>
      )}

      {message && (
        <Alert severity="info" onClose={() => setMessage("")}>
          {message}
        </Alert>
      )}
    </>
  );
}
