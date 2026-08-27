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
