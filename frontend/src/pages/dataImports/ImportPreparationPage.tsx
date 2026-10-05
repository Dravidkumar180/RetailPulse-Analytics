import { Alert, Button, Tab, Tabs } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import { useImportPreparation } from "./useImportPreparation";
import BulkImportProcessing, { ImportConfirmation, ImportHistoryPanel } from "./BulkImportProcessing";
import { useBulkImportProcessing } from "./useBulkImportProcessing";
import UploadValidation from "./UploadValidation";
import ImportActivity from "./ImportActivity";
import ImportDashboard from "./ImportDashboard";
import "./DataImportsPage.css";

export default function ImportPreparationPage() {
  const preparation = useImportPreparation();
  const processing = useBulkImportProcessing(preparation.type, preparation.file);
  const [params, setParams] = useSearchParams();
  const requestedView = params.get("view");
  const view = requestedView && ["upload", "results", "history"].includes(requestedView)
    ? requestedView : processing.selectedId ? "results" : "upload";
  const changeView = (value: string) => setParams(previous => {
    const next = new URLSearchParams(previous);
    next.set("view", value);
    return next;
  });
  return <div className="imports-page day-one-imports import-preparation">
    <PageHeader title="Data Import & Bulk Processing" subtitle="Upload and validate data, track processing, or review import history." />
    <ImportDashboard />
    <Tabs className="import-page-tabs" value={view} onChange={(_, value: string) => changeView(value)}
      variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile aria-label="Data import sections">
      <Tab id="import-tab-upload" aria-controls="import-panel-upload" value="upload" label="Upload & Validate" />
      <Tab id="import-tab-results" aria-controls="import-panel-results" value="results" label="Processing & Results" />
      <Tab id="import-tab-history" aria-controls="import-panel-history" value="history" label="History & Activity" />
    </Tabs>
    <div role="tabpanel" id="import-panel-upload" aria-labelledby="import-tab-upload" hidden={view !== "upload"}>
      <UploadValidation preparation={preparation} processing={processing} />
    </div>
    <div role="tabpanel" id="import-panel-results" aria-labelledby="import-tab-results" hidden={view !== "results"}>
      {processing.selectedId ? <BulkImportProcessing state={processing} /> : <section className="imports-card">
        <h2>Processing & Results</h2>
        <Alert severity="info">Start a new import or open an existing import from History to view progress and record results.</Alert>
        <div className="validation-toolbar"><Button variant="contained" onClick={() => changeView("upload")}>Upload a File</Button>
          <Button variant="outlined" onClick={() => changeView("history")}>View Import History</Button></div>
      </section>}
    </div>
    <div role="tabpanel" id="import-panel-history" aria-labelledby="import-tab-history" hidden={view !== "history"}>
      <ImportHistoryPanel state={processing} />
      <ImportActivity job={processing.selected.data} />
    </div>
    <ImportConfirmation state={processing} validation={preparation.validation} filename={preparation.file?.name} />
  </div>;
}
