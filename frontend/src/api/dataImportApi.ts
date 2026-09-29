/* Teaching guide: This file contains data import api API requests, response types, and data mapping.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
import axiosInstance from "./axiosInstance";

export type ImportType = "products" | "inventory" | "customers" | "sales";
export interface ImportPreviewResult {
  columns: string[]; requiredColumns: string[]; missingColumns: string[];
  unexpectedColumns: string[]; totalRows: number; rows: Record<string, string>[];
  errors: string[]; structureValid: boolean; validationLevel: "structure";
}
export async function previewImport(type: ImportType, file: File, signal: AbortSignal): Promise<ImportPreviewResult> {
  const body = new FormData(); body.append("importType", type); body.append("file", file);
  return (await axiosInstance.post("/import/preview", body, {
    signal, headers: { "Content-Type": "multipart/form-data" },
  })).data;
}
export async function downloadImportTemplate(type: ImportType) {
  const response = await axiosInstance.get(`/import/templates/${type}`, { responseType: "blob" });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url; link.download = `${type}_import_template.csv`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export interface ImportRecord {
  id: string; importType: ImportType; filename: string; uploadedBy: string; uploadDate: string;
  columns: string[]; rows?: Record<string, string>[]; totalRecords: number; validRecords: number;
  successfulRecords: number; failedRecords: number; duplicateRecords: number; status: string; completedAt?: string | null;
  errors?: {rowNumber: number; errorType: string; message: string; rowData: Record<string, string>}[];
}

export const uploadImport = async (type: ImportType, file: File): Promise<ImportRecord> => {
  const body = new FormData(); body.append("importType", type); body.append("file", file);
  // Override the API client's JSON default so Axios sends a real multipart
  // request with the browser-generated boundary required by FastAPI's Form/File parser.
  const { data } = await axiosInstance.post<ImportRecord>("/import/upload", body, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};
export const processImport = async (id: string): Promise<ImportRecord> => (await axiosInstance.post(`/import/${id}/process`)).data;
export const getImportHistory = async (): Promise<{items: ImportRecord[]; total: number}> => (await axiosInstance.get("/import/history")).data;
export const downloadImportErrors = async (job: ImportRecord) => {
  const response = await axiosInstance.get(`/import/${job.id}/errors`, { responseType: "blob" });
  const url = URL.createObjectURL(response.data); const link = document.createElement("a");
  link.href = url; link.download = `${job.filename.replace(/\.csv$/i, "")}_errors.csv`; link.click(); URL.revokeObjectURL(url);
};
