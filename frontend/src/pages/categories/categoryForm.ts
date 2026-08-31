/* Teaching guide: This file contains category form page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
// Handles the category form user interface and its interactions.
import type { Category, CategoryInput } from "../../api/catalogApi";

// The declarations below define the public data used by this module.
export const EMPTY_CATEGORY_FORM: CategoryInput = {
  name: "",
  description: "",
  status: "ACTIVE",
};
export const categoryToInput = (category: Category): CategoryInput => ({
  name: category.name,
  description: category.description || "",
  status: category.status,
});
