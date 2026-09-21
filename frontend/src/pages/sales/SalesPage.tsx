/* Connects sales state to the list, form, details, and analytics views. */
import { Box } from "@mui/material";
import AnalyticsPage from "../analytics/AnalyticsPage";
import SaleDetailsPanel from "./SaleDetailsPanel";
import SaleFormPanel from "./SaleFormPanel";
import SalesListPanel from "./SalesListPanel";
import SalesHeader from "./SalesHeader";
import SalesTabs from "./SalesTabs";
import { useSalesPage } from "./useSalesPage";
import "./SalesPage.css";

export default function SalesPage() {
  const sales = useSalesPage();
  const {
    canEdit,
    tab,
    filters,
    page,
    setPage,
    view,
    editing,
    form,
    setForm,
    error,
    categoriesQuery,
    customersQuery,
    salesQuery,
    summaryQuery,
    products,
    subtotal,
    discount,
    tax,
    total,
    itemError,
    formInvalid,
    saveMutation,
    openDetails,
    addItem,
    updateItem,
    pageCount,
    visible,
    changeFilter,
    clearFilters,
    cancelEdit,
    confirmDelete,
    exportPdf,
    exportCsv,
    exportSales,
    begin,
  } = sales;
  return (
    <Box className="sales-page">
      <SalesHeader {...sales} />
      <SalesTabs {...sales} />
      {tab === 0 && (
        <SalesListPanel
          summary={summaryQuery.data}
          filters={filters}
          categories={categoriesQuery.data?.items ?? []}
          sales={visible}
          loading={salesQuery.isLoading}
          failed={salesQuery.isError}
          canEdit={canEdit}
          page={page}
          pageCount={pageCount}
          onFilter={changeFilter}
          onClear={clearFilters}
          onPage={setPage}
          onView={openDetails}
          onEdit={begin}
          onDelete={confirmDelete}
          onExport={exportSales}
        />
      )}
      {tab === 1 && (
        <SaleFormPanel
          editing={editing}
          form={form}
          products={products}
          customers={customersQuery.data?.items ?? []}
          error={error}
          saving={saveMutation.isPending}
          invalid={formInvalid}
          subtotal={subtotal}
          discount={discount}
          tax={tax}
          total={total}
          onForm={setForm}
          onAddItem={addItem}
          onUpdateItem={updateItem}
          itemError={itemError}
          onCancel={cancelEdit}
          onSave={() => saveMutation.mutate()}
        />
      )}
      {tab === 2 && view && (
        <SaleDetailsPanel
          sale={view}
          products={products}
          onPdf={() => exportPdf(view)}
          onCsv={() => exportCsv(view)}
        />
      )}
      {tab === 3 && canEdit && <AnalyticsPage />}
    </Box>
  );
}
