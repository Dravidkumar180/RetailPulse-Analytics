import { useEffect, useRef, useState } from "react";
import { downloadImportTemplate, previewImport, validateImportFile, type ImportPreviewResult, type ImportValidationResult, type ImportType } from "../../api/dataImportApi";
import { MAX_SIZE, TYPES } from "./importConstants";

function safeError(error: unknown): string {
  const e = error as { response?: { status?: number; data?: { detail?: unknown } } };
  const detail = e.response?.data?.detail;
  return e.response?.status && e.response.status < 500 && typeof detail === "string"
    ? detail : "Unable to validate this file. Please try again.";
}

export function useImportPreparation() {
  const [type, setType] = useState<ImportType>("products");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [validation, setValidation] = useState<ImportValidationResult | null>(null);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<"idle" | "uploading" | "validating">("idle");
  const [downloading, setDownloading] = useState(false);
  const [templateError, setTemplateError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  const templateRequest = useRef(0);
  useEffect(() => () => request.current?.abort(), []);
  const clear = () => {
    request.current?.abort(); request.current = null;
    setFile(null); setPreview(null); setValidation(null); setError(""); setPhase("idle");
    if (input.current) input.current.value = "";
  };
  const selectType = (value: ImportType) => {
    clear(); setType(value); setTemplateError(""); templateRequest.current += 1; setDownloading(false);
  };
  const choose = async (selected?: File) => {
    if (!selected) return;
    clear();
    if (!selected.name.toLowerCase().endsWith(".csv")) { setError("Invalid file type. Only .csv files are allowed."); return; }
    if (selected.size > MAX_SIZE) { setError("File size exceeds the 10 MB limit."); return; }
    if (!selected.size) { setError("The selected file is empty."); return; }
    setFile(selected); setPhase("uploading");
    const controller = new AbortController(); request.current = controller;
    try {
      const result = await previewImport(type, selected, controller.signal);
      if (request.current === controller) setPreview(result);
    } catch (err) {
      if (request.current === controller && !controller.signal.aborted) setError(safeError(err));
    } finally { if (request.current === controller) setPhase("idle"); }
  };
  const validate = async () => {
    if (!file || !preview?.structureValid || phase !== "idle") return;
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    setValidation(null); setError(""); setPhase("validating");
    try {
      const result = await validateImportFile(type, file, controller.signal);
      if (request.current === controller) setValidation(result);
    } catch (err) {
      if (request.current === controller && !controller.signal.aborted) setError(safeError(err));
    } finally { if (request.current === controller) setPhase("idle"); }
  };
  const download = async () => {
    const id = ++templateRequest.current;
    setDownloading(true); setTemplateError("");
    try { await downloadImportTemplate(type); }
    catch (err) { if (id === templateRequest.current) setTemplateError(safeError(err)); }
    finally { if (id === templateRequest.current) setDownloading(false); }
  };
  return { type, file, preview, validation, error, phase, downloading, templateError, input,
    current: TYPES.find(item => item.value === type)!, clear, selectType, choose, validate, download,
    rejectMultiple: () => { clear(); setError("Choose one CSV file at a time."); } };
}
