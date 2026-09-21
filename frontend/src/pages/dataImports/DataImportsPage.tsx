/* Assembles the CSV upload, preview, validation, import result, and history sections. */
import { Box } from "@mui/material";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import ImportWorkflow from "./ImportWorkflow";
import ImportTypeSelector from "./ImportTypeSelector";
import ImportUpload from "./ImportUpload";
import ImportProgress from "./ImportProgress";
import ImportPreview from "./ImportPreview";
import ImportValidation from "./ImportValidation";
import ImportResult from "./ImportResult";
import ImportHistory from "./ImportHistory";
import { useDataImportsPage } from "./useDataImportsPage";
import "./DataImportsPage.css";

export default function DataImportsPage() {
  const imports = useDataImportsPage();
  const { job } = imports;
  return (
    <Box className="imports-page">
      <PageHeader
        title="Data Imports"
        subtitle="Validate and import company products, customers, and sales from CSV files."
      />
      <ImportWorkflow {...imports} />
      <ImportTypeSelector {...imports} />
      <ImportUpload {...imports} />
      <ImportProgress {...imports} />
      {job && (
        <>
          <ImportPreview {...imports} job={job} />
          <ImportValidation job={job} />
          <ImportResult {...imports} job={job} />
        </>
      )}
      <ImportHistory {...imports} />
    </Box>
  );
}
