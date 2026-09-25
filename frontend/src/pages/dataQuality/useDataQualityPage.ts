// Owns API polling, mutations, filters, dialogs and error recovery.
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "../../api/axiosInstance";
import { useAuth } from "../../hooks/useAuth";
import type { Run, Issue, Overview } from "./dataQualityTypes";
import { initialFilters } from "./dataQualityConstants";

export function useDataQualityPage() {
  const { user } = useAuth();

  const manage = ["COMPANY_ADMIN", "SUPER_ADMIN"].includes(user?.role ?? "");

  const client = useQueryClient();

  const [filters, setFilters] = useState(initialFilters);

  const [applied, setApplied] = useState(initialFilters);

  const [page, setPage] = useState(1);

  const [historyPage, setHistoryPage] = useState(1);

  const [selected, setSelected] = useState<string | null>(null);

  const [selectedRun, setSelectedRun] = useState<Run | null>(null);

  const [newStatus, setNewStatus] = useState("Investigating");

  const [note, setNote] = useState("");

  const [message, setMessage] = useState("");

  const prefix = ["data-quality", user?.companyId ?? user?.company?.id];

  const overview = useQuery({
    queryKey: [...prefix, "overview"],
    queryFn: async () =>
      (await axios.get<Overview>("/data-quality/overview")).data,
    refetchInterval: 4000,
  });

  const issues = useQuery({
    queryKey: [...prefix, "issues", applied, page],
    queryFn: async () =>
      (
        await axios.get<{ items: Issue[]; total: number }>(
          "/data-quality/issues",
          {
            params: {
              ...Object.fromEntries(
                Object.entries(applied).filter(([, v]) => v),
              ),
              page,
            },
          },
        )
      ).data,
    refetchInterval: 5000,
  });

  const history = useQuery({
    queryKey: [...prefix, "runs", historyPage],
    queryFn: async () =>
      (
        await axios.get<{ items: Run[]; total: number }>("/data-quality/runs", {
          params: { page: historyPage },
        })
      ).data,
    refetchInterval: 4000,
  });

  const detail = useQuery({
    queryKey: [...prefix, "issue", selected],
    queryFn: async () =>
      (await axios.get<Issue>(`/data-quality/issues/${selected}`)).data,
    enabled: !!selected,
  });

  const refresh = () => client.invalidateQueries({ queryKey: prefix });

  const run = useMutation({
    mutationFn: () => axios.post("/data-quality/runs"),
    onSuccess: () => {
      setMessage("Reconciliation started. Results update automatically.");
      void refresh();
    },
  });

  const update = useMutation({
    mutationFn: () =>
      axios.patch(`/data-quality/issues/${selected}`, {
        status: newStatus,
        previous_status: detail.data?.status,
        note,
      }),
    onSuccess: () => {
      setMessage("Issue status and audit history updated.");
      setNote("");
      void refresh();
    },
  });

  const download = useMutation({
    mutationFn: async (format: "CSV" | "PDF") => {
      const response = await axios.get("/data-quality/export", {
        params: {
          ...Object.fromEntries(Object.entries(applied).filter(([, v]) => v)),
          format,
        },
        responseType: "blob",
      });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `data-quality.${format.toLowerCase()}`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
  });
  const latest = overview.data?.latest;

  const baseline = overview.data?.baseline;

  const running = latest?.status === "Running" || run.isPending;

  const issue = detail.data;

  const queryError = overview.error || issues.error || history.error;
  // A successful overview after a failed start proves that the former missing
  // API has recovered. Do not keep its old 404 pinned above healthy live data.
  const recoveredStart =
    (run.error as { response?: { status?: number } } | null)?.response
      ?.status === 404 &&
    overview.isSuccess &&
    overview.dataUpdatedAt > run.submittedAt;
  const error =
    queryError ||
    (recoveredStart ? null : run.error) ||
    update.error ||
    download.error;
  const retry = () => {
    run.reset();
    update.reset();
    download.reset();
    setMessage("");
    void refresh();
  };

  return {
    user,
    manage,
    filters,
    setFilters,
    applied,
    setApplied,
    page,
    setPage,
    historyPage,
    setHistoryPage,
    selected,
    setSelected,
    selectedRun,
    setSelectedRun,
    newStatus,
    setNewStatus,
    note,
    setNote,
    message,
    setMessage,
    overview,
    issues,
    history,
    detail,
    run,
    update,
    download,
    latest,
    baseline,
    running,
    issue,
    queryError,
    error,
    retry,
  };
}

export type DataQualityPageState = ReturnType<typeof useDataQualityPage>;
