import axiosInstance from "./axiosInstance";
import type { ImportType } from "./dataImportApi";

export interface BulkImportJob {
  id: string; importType: ImportType; filename: string; uploadedBy: string; uploadDate: string; columns: string[];
  totalRecords: number; successfulRecords: number; failedRecords: number; skippedRecords: number; duplicateRecords: number;
  processedRecords: number; progress: number; status: string; cancelRequested: boolean; durationSeconds: number;
  startedAt: string | null; completedAt: string | null; message: string | null;
}
export interface BulkImportRow {
  rowNumber: number; data: Record<string, string>; status: string; action: string | null;
  errorType: string | null; message: string | null; recordId: string | null;
}
export const isImportActive = (job?: BulkImportJob) => !!job && ["Uploaded", "Validating", "Processing"].includes(job.status);
export async function startBulkImport(type: ImportType, file: File, requestId: string, reason?: string): Promise<BulkImportJob> {
  const body = new FormData(); body.append("importType", type); body.append("file", file); body.append("requestId", requestId); if (reason) body.append("reason", reason);
  return (await axiosInstance.post("/import/jobs", body, { timeout: 120000, headers: { "Content-Type": "multipart/form-data" } })).data;
}
export const getBulkImport = async (id: string): Promise<BulkImportJob> => (await axiosInstance.get(`/import/jobs/${id}`)).data;
export const getImportOverview = async (): Promise<{ total: number; completed: number; withErrors: number; failed: number; active: number; cancelled: number }> =>
  (await axiosInstance.get("/import/jobs/overview")).data;
export const getRecentBulkImports = async (page = 1, importType = "", status = ""): Promise<{ items: BulkImportJob[]; total: number }> =>
  (await axiosInstance.get("/import/jobs", { params: { page, import_type: importType || undefined, status: status || undefined } })).data;
export const cancelBulkImport = async (id: string): Promise<BulkImportJob> => (await axiosInstance.post(`/import/jobs/${id}/cancel`)).data;
export const getBulkImportRows = async (id: string, status: string, page: number): Promise<{ items: BulkImportRow[]; total: number }> =>
  (await axiosInstance.get(`/import/jobs/${id}/rows`, { params: { status, page, page_size: 10 } })).data;
export async function downloadBulkImportReport(id: string, kind: "errors" | "success") {
  const { data } = await axiosInstance.get(`/import/jobs/${id}/report`, { params: { kind }, responseType: "blob", timeout: 120000 });
  const url = URL.createObjectURL(data); const link = document.createElement("a");
  link.href = url; link.download = `import_${id}_${kind}.csv`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
