/* Teaching guide: This file contains product form page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
// Handles the product form user interface and its interactions.
import type { Product, ProductInput } from "../../api/catalogApi";

// The declarations below define the public data used by this module.
export const EMPTY_PRODUCT_FORM: ProductInput = {
  name: "",
  sku: "",
  categoryId: "",
  brand: "",
  description: "",
  unitPrice: 0,
  costPrice: 0,
  stockQuantity: 0,
  unitOfMeasure: "Piece",
  status: "ACTIVE",
};

export const productToInput = (product: Product): ProductInput => ({
  name: product.name,
  sku: product.sku,
  categoryId: product.categoryId,
  brand: product.brand || "",
  description: product.description || "",
  unitPrice: product.unitPrice,
  costPrice: product.costPrice,
  stockQuantity: product.stockQuantity,
  unitOfMeasure: product.unitOfMeasure,
  status: product.status,
});
