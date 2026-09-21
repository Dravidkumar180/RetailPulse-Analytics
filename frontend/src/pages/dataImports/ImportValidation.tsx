/* Shows valid, invalid, and duplicate record counts and explains row errors. */
import type { ImportRecord } from "../../api/dataImportApi";

type Props = { job: ImportRecord };

export default function ImportValidation({ job }: Props) {
  return (
    <>
      <section className="validation-grid">
        <article className="validation-stat total">
          <span>Total records</span>
          <strong>{job.totalRecords}</strong>
        </article>
        <article className="validation-stat valid">
          <span>Valid records</span>
          <strong>{job.validRecords}</strong>
        </article>
        <article className="validation-stat invalid">
          <span>Invalid records</span>
          <strong>{job.failedRecords}</strong>
        </article>
        <article className="validation-stat duplicate">
          <span>Duplicates</span>
          <strong>{job.duplicateRecords}</strong>
        </article>
      </section>
      {!!job.errors?.length && (
        <section className="imports-card issues-card">
          <div className="imports-section-head">
            <div>
              <span>Review required</span>
              <h2>Invalid and duplicate records</h2>
            </div>
            <p>
              Showing {job.errors.length} issue
              {job.errors.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="preview-scroll">
            <table>
              <thead>
                <tr>
                  <th>CSV row</th>
                  <th>Type</th>
                  <th>Error reason</th>
                  <th>Record</th>
                </tr>
              </thead>
              <tbody>
                {job.errors.map((issue, index) => (
                  <tr key={`${issue.rowNumber}-${index}`}>
                    <td>{issue.rowNumber}</td>
                    <td>
                      <span
                        className={`issue-type ${issue.errorType.toLowerCase()}`}
                      >
                        {issue.errorType}
                      </span>
                    </td>
                    <td className="issue-message">{issue.message}</td>
                    <td>
                      {Object.values(issue.rowData)
                        .filter(Boolean)
                        .slice(0, 3)
                        .join(" · ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
