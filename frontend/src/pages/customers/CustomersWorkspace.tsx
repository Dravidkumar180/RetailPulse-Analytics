// Coordinates data, state, and child components for the Customers Workspace screen.
import { useEffect, useMemo, useState } from "react";
import { Box } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  createCustomer,
  deleteCustomer,
  getCustomerAnalytics,
  getCustomers,
  logCustomerExport,
  updateCustomer,
  type Customer,
  type CustomerInput,
} from "../../api/customerApi";
import { useAuth } from "../../hooks/useAuth";
import { createPdfReport } from "../../utils/createPdfReport";
import CustomerAnalyticsPanel from "./CustomerAnalyticsPanel";
import CustomerForm from "./CustomerForm";
import CustomerHistoryPanel from "./CustomerHistoryPanel";
import type { HistoryView } from "./CustomerHistory";
import CustomerListPanel, { type CustomerFilters } from "./CustomerListPanel";
import CustomersHeader, { type CustomerTab } from "./CustomersHeader";
import {
  customerIssueFromError,
  date,
  money,
  title,
  type CustomerIssue,
} from "./customerShared";
import "./CustomersPage.css";
import "./CustomersAnalyticsLayout.css";

// This component receives prepared data and renders the feature-specific interface.
export default function CustomersWorkspace() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const editable = user?.role !== "VIEWER";
  const pageSize = 5;
  // Store the active tab, table filters, selected customer, and form state.
  const [tab, setTab] = useState<CustomerTab>("customers");
  const [historyView, setHistoryView] = useState<HistoryView>("profile");
  const [filters, setFilters] = useState<CustomerFilters>({
    search: "",
    type: "",
    status: "",
    city: "",
    country: "",
  });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Customer>();
  const [editing, setEditing] = useState<Customer>();
  const [formOpen, setFormOpen] = useState(false);
  const [customerIssue, setCustomerIssue] = useState<CustomerIssue | null>(
    null,
  );

  // Load customers using the filters supported directly by the backend.
  const customers = useQuery({
    queryKey: ["customers-v2", filters.search, filters.type, filters.status],
    queryFn: () =>
      getCustomers({
        search: filters.search || undefined,
        customerType: filters.type || undefined,
        status: filters.status || undefined,
        sort: "name",
      }),
  });
  const analytics = useQuery({
    queryKey: ["customer-analytics"],
    queryFn: getCustomerAnalytics,
  });

  useEffect(() => {
    if (customers.data?.items.length && !selected)
      setSelected(customers.data.items[0]);
  }, [customers.data, selected]);
  useEffect(() => setPage(1), [filters]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["customers-v2"] });
    queryClient.invalidateQueries({ queryKey: ["customer-analytics"] });
    queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    queryClient.invalidateQueries({ queryKey: ["customer-notifications"] });
  };
  // Use one mutation for both customer creation and customer updates.
  const save = useMutation({
    mutationFn: (input: CustomerInput) =>
      editing ? updateCustomer(editing.id, input) : createCustomer(input),
    onSuccess: (customer) => {
      setCustomerIssue(null);
      toast.success(editing ? "Customer updated" : "Customer registered");
      setSelected(customer);
      setFormOpen(false);
      setEditing(undefined);
      refresh();
    },
    onError: (error: unknown) =>
      setCustomerIssue(customerIssueFromError(error)),
  });
  const remove = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      setCustomerIssue(null);
      toast.success("Customer deleted");
      setSelected(undefined);
      refresh();
    },
    onError: (error: unknown) =>
      setCustomerIssue(customerIssueFromError(error)),
  });

  // Build the selected customer report and download it in the requested format.
  const exportReport = async (
    kind: "customers" | "analytics" | "history",
    format: "CSV" | "PDF",
  ) => {
    const selectedCustomer =
      customers.data?.items.find((customer) => customer.id === selected?.id) ||
      selected;
    const rows =
      kind === "history" && selectedCustomer
        ? [selectedCustomer]
        : customers.data?.items || [];
    await logCustomerExport(`${title(kind)} (${format})`);
    queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    let csv = "";
    let lines: string[] = [];
    if (kind === "analytics" && analytics.data) {
      const k = analytics.data.kpis;
      csv = [
        "Metric,Value",
        `Total Customers,${k.totalCustomers}`,
        `Active Customers,${k.activeCustomers}`,
        `New Customers,${k.newCustomers}`,
        `Returning Customers,${k.returningCustomers}`,
        `Average Customer Spend,${k.averageCustomerSpend}`,
        `Total Revenue,${k.totalRevenue}`,
        `Average Purchase Frequency,${k.averagePurchaseFrequency}`,
      ].join("\n");
      lines = [
        `Total Customers: ${k.totalCustomers}`,
        `Active Customers: ${k.activeCustomers}`,
        `New Customers: ${k.newCustomers}`,
        `Returning Customers: ${k.returningCustomers}`,
        `Average Customer Spend: ${money(k.averageCustomerSpend)}`,
        `Total Revenue: ${money(k.totalRevenue)}`,
        `Average Purchase Frequency: ${k.averagePurchaseFrequency.toFixed(2)} / month`,
      ];
    } else {
      csv =
        "Customer ID,Name,Email,Phone,Type,Status,Segment,Total Orders,Total Spend\n" +
        rows
          .map((customer) =>
            [
              customer.customerId,
              customer.fullName,
              customer.email,
              customer.phone,
              customer.customerType,
              customer.status,
              customer.segment,
              customer.summary.totalOrders,
              customer.summary.totalRevenue,
            ]
              .map((value) => `"${String(value).replaceAll('"', '""')}"`)
              .join(","),
          )
          .join("\n");
      lines = rows.map((customer, index) =>
        [
          `${index + 1}. ${customer.fullName}`,
          customer.customerId,
          `Orders: ${customer.summary.totalOrders}`,
          `Revenue: ${money(customer.summary.totalRevenue)}`,
          customer.segment,
        ].join(" | "),
      );
      if (kind === "history" && selectedCustomer)
        lines.push(
          ...selectedCustomer.timeline.map(
            (event) =>
              `${date(event.occurredAt)} — ${event.event}${event.details ? `: ${event.details}` : ""}`,
          ),
        );
    }
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      format === "CSV"
        ? new Blob([csv], { type: "text/csv" })
        : createPdfReport(`Customer ${title(kind)} Report`, lines),
    );
    link.download = `customer-${kind}.${format.toLowerCase()}`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success(`${title(kind)} ${format} downloaded`);
  };

  const allRows = customers.data?.items || [];
  const current = useMemo(
    () => allRows.find((customer) => customer.id === selected?.id) || selected,
    [allRows, selected],
  );
  const cities = useMemo(
    () =>
      [
        ...new Set(
          allRows.map((customer) => customer.city).filter(Boolean) as string[],
        ),
      ].sort(),
    [allRows],
  );
  const countries = useMemo(
    () =>
      [
        ...new Set(
          allRows
            .map((customer) => customer.country)
            .filter(Boolean) as string[],
        ),
      ].sort(),
    [allRows],
  );
  // City and country filtering is applied locally to the loaded customer rows.
  const filteredRows = useMemo(
    () =>
      allRows.filter(
        (customer) =>
          (!filters.city || customer.city === filters.city) &&
          (!filters.country || customer.country === filters.country),
      ),
    [allRows, filters.city, filters.country],
  );
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const visibleRows = filteredRows.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );
  const addCustomer = () => {
    setEditing(undefined);
    setCustomerIssue(null);
    setFormOpen(true);
  };

  return (
    <Box className="customers-page">
      <CustomersHeader
        tab={tab}
        editable={editable}
        onTab={setTab}
        onAdd={addCustomer}
      />
      {tab === "customers" && (
        <CustomerListPanel
          rows={visibleRows}
          allRows={allRows}
          cities={cities}
          countries={countries}
          filters={filters}
          editable={editable}
          loading={customers.isLoading}
          failed={customers.isError}
          issue={customerIssue}
          deleting={remove.isPending}
          page={page}
          pageCount={pageCount}
          pageSize={pageSize}
          onFilter={(key, value) =>
            setFilters((currentFilters) => ({
              ...currentFilters,
              [key]: value,
            }))
          }
          onClear={() =>
            setFilters({
              search: "",
              type: "",
              status: "",
              city: "",
              country: "",
            })
          }
          onAdd={addCustomer}
          onView={(customer) => {
            setSelected(customer);
            setTab("history");
          }}
          onEdit={(customer) => {
            setEditing(customer);
            setFormOpen(true);
          }}
          onDelete={(customer) => {
            if (window.confirm(`Delete ${customer.fullName}?`))
              remove.mutate(customer.id);
          }}
          onPage={setPage}
          onCloseIssue={() => setCustomerIssue(null)}
          onRetry={() => customers.refetch()}
          onExport={(format) => exportReport("customers", format)}
        />
      )}
      {tab === "analytics" && (
        <CustomerAnalyticsPanel
          data={analytics.data}
          customers={allRows}
          editable={editable}
          onExport={(format) => exportReport("analytics", format)}
        />
      )}
      {tab === "history" && (
        <CustomerHistoryPanel
          customers={allRows}
          current={current}
          view={historyView}
          editable={editable}
          onCustomer={setSelected}
          onView={setHistoryView}
          onExport={(format) => exportReport("history", format)}
        />
      )}
      <CustomerForm
        open={formOpen}
        customer={editing}
        issue={customerIssue}
        onClose={() => {
          setFormOpen(false);
          setCustomerIssue(null);
        }}
        onSave={(input) => save.mutate(input)}
        onValidationError={setCustomerIssue}
      />
    </Box>
  );
}
