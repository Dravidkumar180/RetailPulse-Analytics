/* Lists previous imports and lets users download records that could not be imported. */
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import { Button } from "@mui/material";
import { downloadImportErrors } from "../../api/dataImportApi";
import type { DataImportsPageState } from "./useDataImportsPage";

type Props = Pick<
  DataImportsPageState,
  "historyRef" | "searchParams" | "setSearchParams" | "history"
>;

export default function ImportHistory({
  historyRef,
  searchParams,
  setSearchParams,
  history,
}: Props) {
  return (
    <section ref={historyRef} className="imports-card history-card">
      <div className="imports-section-head">
        <div>
          <span>Step 5 · History</span>
          <h2>Import history</h2>
          {searchParams.get("import") && (
            <Button onClick={() => setSearchParams({})}>
              Show all imports
            </Button>
          )}
        </div>
        <p>Only imports for your company are shown.</p>
      </div>
      <div className="preview-scroll">
        <table>
          <thead>
            <tr>
              <th>Import ID</th>
              <th>Type</th>
              <th>Filename</th>
              <th>Uploaded by</th>
              <th>Date</th>
              <th>Total</th>
              <th>Success</th>
              <th>Failed</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {history.isLoading ? (
              <tr>
                <td colSpan={10}>Loading history…</td>
              </tr>
            ) : !history.data?.items.length ? (
              <tr>
                <td colSpan={10}>No imports yet.</td>
              </tr>
            ) : (
              history.data.items
                .filter(
                  (item) =>
                    !searchParams.get("import") ||
                    item.id === searchParams.get("import"),
                )
                .map((item) => (
                  <tr key={item.id}>
                    <td className="import-id">
                      {item.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="capitalize">{item.importType}</td>
                    <td>{item.filename}</td>
                    <td>{item.uploadedBy}</td>
                    <td>{new Date(item.uploadDate).toLocaleString()}</td>
                    <td>{item.totalRecords}</td>
                    <td className="success-text">{item.successfulRecords}</td>
                    <td className="error-text">
                      {item.failedRecords + item.duplicateRecords}
                    </td>
                    <td>
                      <span
                        className={`history-status ${item.status.toLowerCase().replaceAll(" ", "-")}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>
                      {item.failedRecords + item.duplicateRecords > 0 && (
                        <button
                          className="download-icon"
                          title="Download failed records"
                          onClick={() => downloadImportErrors(item)}
                        >
                          <DownloadOutlinedIcon />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
