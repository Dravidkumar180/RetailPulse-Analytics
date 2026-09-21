/* Accepts a CSV file and shows validation errors and the columns it needs. */
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import { Button } from "@mui/material";
import type { DataImportsPageState } from "./useDataImportsPage";

type Props = Pick<
  DataImportsPageState,
  | "input"
  | "chooseFile"
  | "file"
  | "clear"
  | "fileError"
  | "apiError"
  | "upload"
  | "setViewedStep"
  | "current"
>;

export default function ImportUpload({
  input,
  chooseFile,
  file,
  clear,
  fileError,
  apiError,
  upload,
  setViewedStep,
  current,
}: Props) {
  return (
    <div className="imports-workspace">
      <section className="imports-card upload-card">
        <div className="imports-section-head">
          <div>
            <span>Upload file</span>
            <h2>Upload CSV file</h2>
          </div>
        </div>
        {/* Both drag-and-drop and the hidden file picker use the same file checks. */}
        <div
          className="drop-zone"
          onClick={() => input.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            chooseFile(e.dataTransfer.files[0]);
          }}
        >
          <CloudUploadOutlinedIcon />
          <strong>Drop your CSV here</strong>
          <small>or click to browse · maximum 10 MB</small>
          <input
            ref={input}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(e) => chooseFile(e.target.files?.[0])}
          />
        </div>
        {file && (
          <div className="selected-file">
            <div>
              <strong>{file.name}</strong>
              <small>{(file.size / 1024).toFixed(1)} KB · CSV</small>
            </div>
            <button aria-label="Remove file" onClick={clear}>
              <DeleteOutlineIcon />
            </button>
          </div>
        )}
        {(fileError || apiError) && (
          <p className="import-alert error">
            <ErrorOutlineIcon />
            {fileError || apiError}
          </p>
        )}
        <Button
          variant="contained"
          disabled={!file || upload.isPending || !!fileError}
          onClick={() => {
            setViewedStep(null);
            upload.mutate();
          }}
        >
          {upload.isPending ? "Uploading & validating…" : "Upload & validate"}
        </Button>
      </section>
      <section className="imports-card requirements">
        <div className="imports-section-head">
          <div>
            <span>CSV format</span>
            <h2>Required columns</h2>
          </div>
        </div>
        <p>Your {current.title.toLowerCase()} file must contain:</p>
        <div className="column-tags">
          {current.columns.map((column) => (
            <b key={column}>
              <CheckCircleOutlineIcon />
              {column}
            </b>
          ))}
        </div>
        <div className="format-note">
          Column names are case-insensitive. Common names such as “Price” and
          “Stock” are recognized automatically.
        </div>
      </section>
    </div>
  );
}
