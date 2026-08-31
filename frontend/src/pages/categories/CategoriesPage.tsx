/* Teaching guide: This file contains categories page page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Box } from "@mui/material";
import { Link } from "react-router-dom";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
  type Category,
  type CategoryInput,
} from "../../api/catalogApi";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import { useAuth } from "../../hooks/useAuth";
import CategoriesSummary from "./CategoriesSummary";
import CategoriesTable from "./CategoriesTable";
import CategoriesToolbar from "./CategoriesToolbar";
import CategoryDrawer from "./CategoryDrawer";
import { EMPTY_CATEGORY_FORM, categoryToInput } from "./categoryForm";
import "../products/ProductsPage.css";
import "./CategoriesPage.css";

const PAGE_SIZE = 5;

/** Coordinates category queries and mutations; visual sections live in focused components. */
// This component receives prepared data and renders the feature-specific interface.
const CategoriesPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canEdit = user?.role !== "VIEWER";
  const [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [drawerOpen, setDrawerOpen] = useState(false),
    [editing, setEditing] = useState<Category | null>(null),
    [form, setForm] = useState<CategoryInput>(EMPTY_CATEGORY_FORM),
    [error, setError] = useState("");

  const categoriesQuery = useQuery({
    queryKey: ["categories", search],
    queryFn: () => getCategories(search),
  });
  const saveMutation = useMutation({
    mutationFn: () =>
      editing ? updateCategory(editing.id, form) : createCategory(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDrawerOpen(false);
    },
    onError: (cause: any) =>
      setError(cause.response?.data?.detail || cause.message),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["categories"] }),
    onError: (cause: any) =>
      window.alert(cause.response?.data?.detail || cause.message),
  });

  const categories = categoriesQuery.data?.items ?? [];
  const pageCount = Math.max(1, Math.ceil(categories.length / PAGE_SIZE));
  const visibleCategories = categories.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );
  useEffect(() => setPage(1), [search]);
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const openDrawer = (category?: Category) => {
    setEditing(category ?? null);
    setForm(category ? categoryToInput(category) : { ...EMPTY_CATEGORY_FORM });
    setError("");
    setDrawerOpen(true);
  };
  const confirmDelete = (id: string) => {
    if (window.confirm("Delete this category?")) deleteMutation.mutate(id);
  };

  return (
    <Box className="catalog-page">
      <PageHeader
        title="Categories Management"
        subtitle="Create and organize product categories for your company."
      />
      <CategoriesSummary
        categories={categories}
        total={categoriesQuery.data?.total ?? 0}
      />
      <Box className="catalog-tabs">
        <Link to="/products">Products</Link>
        <Link className="active" to="/categories">
          Categories
        </Link>
      </Box>
      <Box className="catalog-panel">
        <CategoriesToolbar
          search={search}
          canEdit={canEdit}
          onSearch={setSearch}
          onAdd={() => openDrawer()}
        />
        <CategoriesTable
          categories={visibleCategories}
          canEdit={canEdit}
          page={page}
          pageCount={pageCount}
          onPage={setPage}
          onEdit={openDrawer}
          onDelete={confirmDelete}
        />
      </Box>
      <CategoryDrawer
        open={drawerOpen}
        editing={editing}
        form={form}
        error={error}
        saving={saveMutation.isPending}
        onClose={() => setDrawerOpen(false)}
        onChange={setForm}
        onSave={() => saveMutation.mutate()}
      />
    </Box>
  );
};

export default CategoriesPage;
