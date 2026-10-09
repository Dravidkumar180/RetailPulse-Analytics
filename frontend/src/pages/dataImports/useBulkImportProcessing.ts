import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { cancelBulkImport, getBulkImport, getRecentBulkImports, isImportActive, startBulkImport } from "../../api/bulkImportApi";
import type { ImportType } from "../../api/dataImportApi";
import { useAuth } from "../../hooks/useAuth";

export function useBulkImportProcessing(type: ImportType, file: File | null) {
  const [params, setParams] = useSearchParams();
  const selectedId = params.get("job");
  const [approvalReason, setApprovalReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyType, setHistoryType] = useState("");
  const [historyStatus, setHistoryStatus] = useState("");
  const [submittedFile, setSubmittedFile] = useState<File | null>(null);
  const request = useRef<{ file: File; type: ImportType; id: string } | null>(null);
  const client = useQueryClient();
  const { user } = useAuth();
  const scope = [user?.companyId, user?.id];
  const selectedKey = ["bulk-import", ...scope, selectedId];
  const selectJob = (id: string) => setParams(previous => {
    const next = new URLSearchParams(previous);
    next.set("job", id);
    next.set("view", "results");
    return next;
  });
  const recent = useQuery({ queryKey: ["bulk-imports", ...scope, historyPage, historyType, historyStatus],
    queryFn: () => getRecentBulkImports(historyPage, historyType, historyStatus), refetchInterval: 5000 });
  const selected = useQuery({ queryKey: selectedKey, queryFn: () => getBulkImport(selectedId!), enabled: !!selectedId,
    refetchInterval: query => !query.state.data || (isImportActive(query.state.data) || query.state.data.status === "Awaiting Approval") ? 1500 : false });
  const start = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Select a file first.");
      if (request.current?.file !== file || request.current?.type !== type) request.current = { file, type, id: crypto.randomUUID() };
      return { job: await startBulkImport(type, file, request.current.id, approvalReason), file };
    },
    onSuccess: ({ job, file: sentFile }) => {
      setSubmittedFile(sentFile); setConfirming(false); selectJob(job.id);
      client.setQueryData(["bulk-import", ...scope, job.id], job);
      void client.invalidateQueries({ queryKey: ["bulk-imports"] });
      void client.invalidateQueries({ queryKey: ["audit-logs"] });
      void client.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
  const cancel = useMutation({ mutationFn: () => cancelBulkImport(selectedId!), onSuccess: job => {
    client.setQueryData(["bulk-import", ...scope, job.id], job);
    void client.invalidateQueries({ queryKey: ["bulk-imports"] });
  } });
  const terminalId = selected.data && !isImportActive(selected.data) ? selected.data.id : null;
  useEffect(() => {
    if (!terminalId) return;
    for (const key of ["bulk-imports", "products", "inventory", "customers", "sales", "dashboard", "analytics", "audit-logs", "notifications", "data-quality", "notification-unread-count"]) {
      void client.invalidateQueries({ queryKey: [key] });
    }
  }, [terminalId, client]);
  return { approvalReason, setApprovalReason, selectedId, selectJob, selected, recent, start, cancel, confirming, setConfirming,
    historyPage, setHistoryPage, historyType, setHistoryType, historyStatus, setHistoryStatus,
    alreadySubmitted: !!file && submittedFile === file };
}
export type BulkProcessingState = ReturnType<typeof useBulkImportProcessing>;
