/* Teaching guide: This file contains API requests and responses for catalog api.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Imports the needed tools from ./axiosInstance.
import axiosInstance from "./axiosInstance";

// Defines the catalog status type.
export type CatalogStatus = "ACTIVE" | "INACTIVE";
// Defines the fields allowed in category.
export interface Category { id:string; name:string; description?:string; status:CatalogStatus; productCount:number; createdAt:string; }
// Defines the fields allowed in category input.
export interface CategoryInput { name:string; description?:string; status:CatalogStatus; }
// Defines the fields allowed in product.
export interface Product { id:string; name:string; sku:string; categoryId:string; categoryName:string; brand?:string; description?:string; unitPrice:number; costPrice:number; stockQuantity:number; unitOfMeasure:string; status:CatalogStatus; createdAt:string; }
// Defines the fields allowed in product input.
export interface ProductInput { name:string; sku:string; categoryId:string; brand?:string; description?:string; unitPrice:number; costPrice:number; stockQuantity:number; unitOfMeasure:string; status:CatalogStatus; }
// Defines the fields allowed in product list.
export interface ProductList { items:Product[]; total:number; totalProducts:number; activeProducts:number; inactiveProducts:number; totalCategories:number; }

// Gets categories.
export const getCategories = async (search="") => (await axiosInstance.get<{items:Category[];total:number}>("/categories",{params:{search:search||undefined}})).data;
// Adds category.
export const createCategory = async (data:CategoryInput) => (await axiosInstance.post<Category>("/categories",data)).data;
// Saves category.
export const updateCategory = async (id:string,data:CategoryInput) => (await axiosInstance.put<Category>(`/categories/${id}`,data)).data;
// Removes category.
export const deleteCategory = async (id:string) => { await axiosInstance.delete(`/categories/${id}`); };
// Gets products.
export const getProducts = async (params:Record<string,string|undefined>) => (await axiosInstance.get<ProductList>("/products",{params})).data;
// Adds product.
export const createProduct = async (data:ProductInput) => (await axiosInstance.post<Product>("/products",data)).data;
// Saves product.
export const updateProduct = async (id:string,data:ProductInput) => (await axiosInstance.put<Product>(`/products/${id}`,data)).data;
// Removes product.
export const deleteProduct = async (id:string) => { await axiosInstance.delete(`/products/${id}`); };
