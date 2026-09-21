/* Starts the validated import and shows its result and failed-record download. */
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import { Button } from "@mui/material";
import { downloadImportErrors } from "../../api/dataImportApi";
import type { DataImportsPageState } from "./useDataImportsPage";
import type { ImportRecord } from "../../api/dataImportApi";

type Props = Pick<
  DataImportsPageState,
  "importRef" | "finished" | "process" | "setViewedStep"
> & { job: ImportRecord };

export default function ImportResult({
  importRef,
  finished,
  job,
  process,
  setViewedStep,
}: Props) {
  return (
    <section
      ref={importRef}
      className={`imports-card result-card ${finished ? "complete" : ""}`}
    >
      <div className="result-icon">
        <CheckCircleOutlineIcon />
      </div>
      <div>
        <span>{finished ? "Step 4 · Result" : "Step 3 · Import"}</span>
        <h2>{finished ? job.status : "Ready to import"}</h2>
        <p>
          {finished
            ? `${job.successfulRecords} records added successfully. ${job.failedRecords} invalid and ${job.duplicateRecords} duplicate records were skipped.`
            : `${job.validRecords} valid records are ready. Invalid and duplicate rows will be skipped safely.`}
        </p>
      </div>
      <div className="result-actions">
        {!finished && (
          <Button
            variant="contained"
            disabled={!job.validRecords || process.isPending}
            onClick={() => {
              setViewedStep(null);
              process.mutate();
            }}
          >
            Import {job.validRecords} valid records
          </Button>
        )}
        {job.failedRecords + job.duplicateRecords > 0 && (
          <Button
            variant="outlined"
            startIcon={<DownloadOutlinedIcon />}
            onClick={() => downloadImportErrors(job)}
          >
            Download failed records
          </Button>
        )}
      </div>
    </section>
  );
}
