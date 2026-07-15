import axiosInstance from "./axiosInstance";

export type CatalogStatus = "ACTIVE" | "INACTIVE";
export interface Category { id:string; name:string; description?:string; status:CatalogStatus; productCount:number; createdAt:string; }
export interface CategoryInput { name:string; description?:string; status:CatalogStatus; }
export interface Product { id:string; name:string; sku:string; categoryId:string; categoryName:string; brand?:string; description?:string; unitPrice:number; costPrice:number; stockQuantity:number; unitOfMeasure:string; status:CatalogStatus; createdAt:string; }
export interface ProductInput { name:string; sku:string; categoryId:string; brand?:string; description?:string; unitPrice:number; costPrice:number; stockQuantity:number; unitOfMeasure:string; status:CatalogStatus; }
export interface ProductList { items:Product[]; total:number; totalProducts:number; activeProducts:number; inactiveProducts:number; totalCategories:number; }

export const getCategories = async (search="") => (await axiosInstance.get<{items:Category[];total:number}>("/categories",{params:{search:search||undefined}})).data;
export const createCategory = async (data:CategoryInput) => (await axiosInstance.post<Category>("/categories",data)).data;
export const updateCategory = async (id:string,data:CategoryInput) => (await axiosInstance.put<Category>(`/categories/${id}`,data)).data;
export const deleteCategory = async (id:string) => { await axiosInstance.delete(`/categories/${id}`); };
export const getProducts = async (params:Record<string,string|undefined>) => (await axiosInstance.get<ProductList>("/products",{params})).data;
export const createProduct = async (data:ProductInput) => (await axiosInstance.post<Product>("/products",data)).data;
export const updateProduct = async (id:string,data:ProductInput) => (await axiosInstance.put<Product>(`/products/${id}`,data)).data;
export const deleteProduct = async (id:string) => { await axiosInstance.delete(`/products/${id}`); };
