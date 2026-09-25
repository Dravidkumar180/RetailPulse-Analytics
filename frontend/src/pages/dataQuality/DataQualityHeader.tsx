// Page title, refresh and manual reconciliation controls.
import { Button, Stack } from "@mui/material";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import type { DataQualityPageState } from "./useDataQualityPage";

type Props = Pick<
  DataQualityPageState,
  "manage" | "retry" | "running" | "overview" | "run"
>;

export default function DataQualityHeader({
  manage,
  retry,
  running,
  overview,
  run,
}: Props) {
  return (
    <>
      <header className="dq-header">
        <div>
          <div className="dq-eyebrow">
            <FactCheckOutlinedIcon fontSize="small" /> DATA GOVERNANCE
          </div>
          <h1>Data Quality &amp; Reconciliation</h1>
          <p>
            Identify, investigate and resolve inconsistencies across your
            business.
          </p>
        </div>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            onClick={retry}
          >
            Refresh
          </Button>
          {manage && (
            <Button
              variant="contained"
              startIcon={<PlayArrowRoundedIcon />}
              disabled={running || overview.isLoading || overview.isError}
              onClick={() => run.mutate()}
            >
              Run reconciliation
            </Button>
          )}
        </Stack>
      </header>
    </>
  );
}
