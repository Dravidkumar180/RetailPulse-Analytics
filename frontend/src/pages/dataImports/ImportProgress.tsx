/* Shows progress feedback while a file is being uploaded or imported. */
import { LinearProgress } from "@mui/material";
import type { DataImportsPageState } from "./useDataImportsPage";

type Props = Pick<DataImportsPageState, "upload" | "process" | "current">;

export default function ImportProgress({ upload, process, current }: Props) {
  return (
    <>
      {(upload.isPending || process.isPending) && (
        <section className="imports-card progress-card">
          <div>
            <strong>
              {upload.isPending
                ? "Uploading and validating records"
                : `Importing ${current.title.toLowerCase()}`}
            </strong>
            <span>Please keep this page open.</span>
          </div>
          <LinearProgress />
          <small>
            {upload.isPending
              ? "Checking file, columns, row values and duplicates…"
              : "Writing validated records in a protected database transaction…"}
          </small>
        </section>
      )}
    </>
  );
}
