// Composes the sections; API and interaction state live in useDataQualityPage.
import { useDataQualityPage } from "./useDataQualityPage";
import "./DataQualityPage.css";
import DataQualityHeader from "./DataQualityHeader";
import DataQualityAlerts from "./DataQualityAlerts";
import DataQualityOverview from "./DataQualityOverview";
import DataQualityIssues from "./DataQualityIssues";
import ReconciliationHistory from "./ReconciliationHistory";
import IssueDetailsDialog from "./IssueDetailsDialog";
import ExecutionDetailsDialog from "./ExecutionDetailsDialog";

export default function DataQualityPage() {
  const page = useDataQualityPage();
  return (
    <div className="dq-page">
      <DataQualityHeader
        manage={page.manage}
        retry={page.retry}
        running={page.running}
        overview={page.overview}
        run={page.run}
      />
      <DataQualityAlerts
        error={page.error}
        queryError={page.queryError}
        retry={page.retry}
        message={page.message}
        setMessage={page.setMessage}
      />
      <DataQualityOverview
        overview={page.overview}
        baseline={page.baseline}
        latest={page.latest}
        running={page.running}
        user={page.user}
      />
      <DataQualityIssues
        issues={page.issues}
        download={page.download}
        overview={page.overview}
        filters={page.filters}
        setFilters={page.setFilters}
        setApplied={page.setApplied}
        setPage={page.setPage}
        applied={page.applied}
        page={page.page}
        setSelected={page.setSelected}
        setNewStatus={page.setNewStatus}
        setNote={page.setNote}
        update={page.update}
      />
      <ReconciliationHistory
        history={page.history}
        historyPage={page.historyPage}
        setHistoryPage={page.setHistoryPage}
        setSelectedRun={page.setSelectedRun}
      />
      <IssueDetailsDialog
        selected={page.selected}
        setSelected={page.setSelected}
        issue={page.issue}
        detail={page.detail}
        manage={page.manage}
        newStatus={page.newStatus}
        setNewStatus={page.setNewStatus}
        note={page.note}
        setNote={page.setNote}
        update={page.update}
      />
      <ExecutionDetailsDialog
        selectedRun={page.selectedRun}
        setSelectedRun={page.setSelectedRun}
      />
    </div>
  );
}
