/* Teaching guide: This file contains products page page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Box } from "@mui/material";
import { Link } from "react-router-dom";
import {
  createProduct,
  deleteProduct,
  getCategories,
  getProducts,
  updateProduct,
  type Product,
  type ProductInput,
} from "../../api/catalogApi";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import { useAuth } from "../../hooks/useAuth";
import ProductDrawer from "./ProductDrawer";
import ProductsFilters from "./ProductsFilters";
import ProductsSummary from "./ProductsSummary";
import ProductsTable from "./ProductsTable";
import { EMPTY_PRODUCT_FORM, productToInput } from "./productForm";
import "./ProductsPage.css";

const PAGE_SIZE = 5;

/** Coordinates product data, filters and mutations; rendering lives in focused child components. */
// This component receives prepared data and renders the feature-specific interface.
const ProductsPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canEdit = user?.role !== "VIEWER";
  const [search, setSearch] = useState(""),
    [category, setCategory] = useState(""),
    [status, setStatus] = useState(""),
    [brand, setBrand] = useState(""),
    [sort, setSort] = useState("recent"),
    [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Product | null>(null),
    [form, setForm] = useState<ProductInput>(EMPTY_PRODUCT_FORM),
    [drawerOpen, setDrawerOpen] = useState(false),
    [error, setError] = useState("");

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });
  const productsQuery = useQuery({
    queryKey: ["products", search, category, status, brand, sort],
    queryFn: () =>
      getProducts({
        search: search || undefined,
        categoryId: category || undefined,
        status: status || undefined,
        brand: brand || undefined,
        sort,
      }),
  });
  const saveMutation = useMutation({
    mutationFn: () =>
      editing ? updateProduct(editing.id, form) : createProduct(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setDrawerOpen(false);
    },
    onError: (cause: any) =>
      setError(cause.response?.data?.detail || cause.message),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });

  const allProducts = productsQuery.data?.items ?? [];
  const brands = useMemo(
    () =>
      Array.from(
        new Set(
          allProducts
            .map((product) => product.brand)
            .filter((value): value is string => Boolean(value)),
        ),
      ),
    [allProducts],
  );
  const pageCount = Math.max(1, Math.ceil(allProducts.length / PAGE_SIZE));
  const visibleProducts = allProducts.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );
  useEffect(() => setPage(1), [search, category, status, brand, sort]);
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const openDrawer = (product?: Product) => {
    setEditing(product ?? null);
    setForm(product ? productToInput(product) : { ...EMPTY_PRODUCT_FORM });
    setError("");
    setDrawerOpen(true);
  };
  const updateField = (key: keyof ProductInput, value: string) =>
    setForm((current) => ({
      ...current,
      [key]: ["unitPrice", "costPrice", "stockQuantity"].includes(key)
        ? Number(value)
        : value,
    }));
  const confirmDelete = (id: string) => {
    if (window.confirm("Delete this product?")) deleteMutation.mutate(id);
  };

  return (
    <Box className="catalog-page">
      <PageHeader
        title="Products Management"
        subtitle="Add, organize and manage your company products."
      />
      <ProductsSummary summary={productsQuery.data} />
      <Box className="catalog-tabs">
        <Link className="active" to="/products">
          Products
        </Link>
        <Link to="/categories">Categories</Link>
      </Box>
      <Box className="catalog-panel">
        <ProductsFilters
          search={search}
          category={category}
          status={status}
          brand={brand}
          sort={sort}
          categories={categoriesQuery.data?.items ?? []}
          brands={brands}
          canEdit={canEdit}
          onSearch={setSearch}
          onCategory={setCategory}
          onStatus={setStatus}
          onBrand={setBrand}
          onSort={setSort}
          onAdd={() => openDrawer()}
        />
        <ProductsTable
          products={visibleProducts}
          canEdit={canEdit}
          page={page}
          pageCount={pageCount}
          onPage={setPage}
          onView={openDrawer}
          onEdit={openDrawer}
          onDelete={confirmDelete}
        />
      </Box>
      <ProductDrawer
        open={drawerOpen}
        editing={editing}
        form={form}
        categories={categoriesQuery.data?.items ?? []}
        error={error}
        canEdit={canEdit}
        saving={saveMutation.isPending}
        onClose={() => setDrawerOpen(false)}
        onField={updateField}
        onSave={() => saveMutation.mutate()}
      />
    </Box>
  );
};

export default ProductsPage;
