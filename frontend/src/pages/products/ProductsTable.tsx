// Renders the products table data and related row actions.
import { Box, IconButton, Pagination } from "@mui/material";
import DeleteIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditIcon from "@mui/icons-material/EditOutlined";
import VisibilityIcon from "@mui/icons-material/VisibilityOutlined";
import type { Product } from "../../api/catalogApi";

type Props = {
  products: Product[];
  canEdit: boolean;
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
};
// This component receives prepared data and renders the feature-specific interface.
export default function ProductsTable(p: Props) {
  return (
    <Box className="catalog-table">
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>SKU</th>
            <th>Category</th>
            <th>Brand</th>
            <th>Unit Price</th>
            <th>Status</th>
            <th>Stock</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {p.products.map((product) => (
            <tr key={product.id}>
              <td>
                <strong>{product.name}</strong>
                <small>{product.description}</small>
              </td>
              <td>{product.sku}</td>
              <td>{product.categoryName}</td>
              <td>{product.brand || "—"}</td>
              <td>₹{Number(product.unitPrice).toFixed(2)}</td>
              <td>
                <span
                  className={`catalog-status ${product.status.toLowerCase()}`}
                >
                  {product.status === "ACTIVE" ? "Active" : "Inactive"}
                </span>
              </td>
              <td>{product.stockQuantity}</td>
              <td>
                <IconButton title="View" onClick={() => p.onView(product)}>
                  <VisibilityIcon />
                </IconButton>
                {p.canEdit && (
                  <>
                    <IconButton title="Edit" onClick={() => p.onEdit(product)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      title="Delete"
                      color="error"
                      onClick={() => p.onDelete(product.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!p.products.length && (
        <p className="catalog-empty">No products found.</p>
      )}
      {p.pageCount > 1 && (
        <Box className="catalog-pagination">
          <Pagination
            count={p.pageCount}
            page={p.page}
            onChange={(_, page) => p.onPage(page)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
}
