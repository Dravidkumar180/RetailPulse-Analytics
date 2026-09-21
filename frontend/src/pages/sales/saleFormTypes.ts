/* Defines the values and callbacks shared by the sale form sections. */
import type { Product } from "../../api/catalogApi";
import type { Customer } from "../../api/customerApi";
import type { Sale, SaleInput, SaleItemInput } from "../../api/salesApi";

// The page owns the form state; these callbacks let each section request changes.
export type SaleFormProps = {
  editing: Sale | null;
  form: SaleInput;
  products: Product[];
  customers: Customer[];
  error: string;
  saving: boolean;
  invalid: boolean;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  onForm: (form: SaleInput) => void;
  onAddItem: () => void;
  onUpdateItem: (
    index: number,
    key: keyof SaleItemInput,
    value: string,
  ) => void;
  itemError: (item: SaleItemInput) => string;
  onCancel: () => void;
  onSave: () => void;
};
