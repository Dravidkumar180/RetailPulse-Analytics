/* Manages file checks, upload and import requests, results, history, and step navigation. */
import { useSearchParams } from "react-router-dom";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getImportHistory,
  processImport,
  uploadImport,
  type ImportRecord,
  type ImportType,
} from "../../api/dataImportApi";
import { TYPES, MAX_SIZE } from "./importConstants";
import { errorMessage } from "./importUtils";

export function useDataImportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const client = useQueryClient();
  // Keep references to the file picker and the sections used for step navigation.
  const input = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLElement>(null);
  const previewRef = useRef<HTMLElement>(null);
  const importRef = useRef<HTMLElement>(null);
  const historyRef = useRef<HTMLElement>(null);
  // Store the selected import type, file, validation messages, and server result.
  const [type, setType] = useState<ImportType>("products");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [job, setJob] = useState<ImportRecord | null>(null);
  const [apiError, setApiError] = useState("");
  const [viewedStep, setViewedStep] = useState<number | null>(null);
  // Fetch previous imports for the history table.
  const history = useQuery({
    queryKey: ["import-history"],
    queryFn: getImportHistory,
  });
  // Reload activity views because an import creates audit events and notifications.
  const refreshActivity = () => {
    client.invalidateQueries({ queryKey: ["audit-logs"] });
    client.invalidateQueries({ queryKey: ["notifications"] });
  };
  // Upload the CSV for server validation, then show the preview and counts.
  const upload = useMutation({
    mutationFn: () => uploadImport(type, file!),
    onSuccess: (value) => {
      setJob(value);
      setViewedStep(null);
      setApiError("");
      client.invalidateQueries({ queryKey: ["import-history"] });
      refreshActivity();
    },
    onError: (error) => setApiError(errorMessage(error)),
  });
  // Import the valid rows, then refresh sales, products, customers, and history.
  const process = useMutation({
    mutationFn: () => processImport(job!.id),
    onSuccess: (value) => {
      setJob(value);
      setViewedStep(null);
      setApiError("");
      client.invalidateQueries({ queryKey: ["import-history"] });
      client.invalidateQueries({ queryKey: ["products"] });
      client.invalidateQueries({ queryKey: ["customers"] });
      client.invalidateQueries({ queryKey: ["sales"] });
      refreshActivity();
    },
    onError: (error) => {
      setApiError(errorMessage(error));
      client.invalidateQueries({ queryKey: ["import-history"] });
      refreshActivity();
    },
  });
  // Reject unsupported, oversized, or empty files before sending them to the server.
  const chooseFile = (selected?: File) => {
    setJob(null);
    setApiError("");
    if (!selected) return;
    if (
      !selected.name.toLowerCase().endsWith(".csv") ||
      (selected.type &&
        !["text/csv", "application/vnd.ms-excel"].includes(selected.type))
    ) {
      setFile(null);
      setFileError("Only .csv files are supported.");
      return;
    }
    if (selected.size > MAX_SIZE) {
      setFile(null);
      setFileError("The file exceeds the 10 MB limit.");
      return;
    }
    if (!selected.size) {
      setFile(null);
      setFileError("The selected file is empty.");
      return;
    }
    setFile(selected);
    setFileError("");
  };
  // Clear both React state and the native file input so the same file can be selected again.
  const clear = () => {
    setFile(null);
    setJob(null);
    setViewedStep(null);
    setFileError("");
    setApiError("");
    if (input.current) input.current.value = "";
  };
  const current = TYPES.find((item) => item.value === type)!;
  const finished = job?.status.startsWith("Completed");
  // Work out which steps are available and which step should be highlighted.
  const reachedStep = finished ? 3 : job ? 2 : 0;
  const currentStep = finished ? 3 : process.isPending ? 2 : job ? 1 : 0;
  const completedThrough = finished ? 3 : process.isPending ? 1 : job ? 0 : -1;
  const activeStep = viewedStep ?? currentStep;
  // Scroll to an available workflow section; history is always available.
  const goToStep = (step: number) => {
    if (step > reachedStep && step !== 4) return;
    setViewedStep(step);
    const target =
      step === 0
        ? selectRef
        : step === 1
          ? previewRef
          : step === 4
            ? historyRef
            : importRef;
    target.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return {
    searchParams,
    setSearchParams,
    input,
    selectRef,
    previewRef,
    importRef,
    historyRef,
    type,
    setType,
    file,
    fileError,
    job,
    apiError,
    setViewedStep,
    history,
    upload,
    process,
    chooseFile,
    clear,
    current,
    finished,
    reachedStep,
    completedThrough,
    activeStep,
    goToStep,
  };
}

export type DataImportsPageState = ReturnType<typeof useDataImportsPage>;
