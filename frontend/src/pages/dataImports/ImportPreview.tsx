/* Shows the uploaded file columns and sample rows before importing. */
import type { DataImportsPageState } from "./useDataImportsPage";
import type { ImportRecord } from "../../api/dataImportApi";

type Props = Pick<DataImportsPageState, "previewRef"> & { job: ImportRecord };

export default function ImportPreview({ previewRef, job }: Props) {
  return (
    <section ref={previewRef} className="imports-card preview-card">
      <div className="imports-section-head">
        <div>
          <span>Step 2 · Preview & Validate</span>
          <h2>Preview · {job.filename}</h2>
        </div>
        <p>
          {job.totalRecords.toLocaleString()} total records ·{" "}
          {job.columns.length} detected columns
        </p>
      </div>
      <div className="preview-scroll">
        <table>
          <thead>
            <tr>
              <th>#</th>
              {job.columns.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(job.rows || []).map((row, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                {job.columns.map((c) => (
                  <td key={c}>{row[c] || "—"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <small className="preview-caption">
        Showing the first {Math.min(10, job.rows?.length || 0)} records. All{" "}
        {job.totalRecords} records were validated on the server.
      </small>
    </section>
  );
}
