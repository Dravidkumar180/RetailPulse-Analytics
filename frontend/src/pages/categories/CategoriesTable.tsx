/* Teaching guide: This file contains categories table page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
// Renders the categories table data and related row actions.
import { Box, IconButton, Pagination, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutlineOutlined";
import type { Category } from "../../api/catalogApi";

type Props = {
  categories: Category[];
  canEdit: boolean;
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
};
// This component receives prepared data and renders the feature-specific interface.
export default function CategoriesTable(p: Props) {
  return (
    <Box className="catalog-table">
      <table>
        <thead>
          <tr>
            <th>Category Name</th>
            <th>Description</th>
            <th>Status</th>
            <th>Products</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {p.categories.map((category) => (
            <tr key={category.id}>
              <td>
                <strong>{category.name}</strong>
              </td>
              <td className="category-description">
                {category.description || "—"}
              </td>
              <td>
                <span
                  className={`catalog-status ${category.status.toLowerCase()}`}
                >
                  {category.status === "ACTIVE" ? "Active" : "Inactive"}
                </span>
              </td>
              <td>{category.productCount}</td>
              <td>
                {p.canEdit ? (
                  <Box className="category-actions">
                    <IconButton title="Edit" onClick={() => p.onEdit(category)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      title="Delete"
                      color="error"
                      onClick={() => p.onDelete(category.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ) : (
                  <Typography component="span">View only</Typography>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!p.categories.length && (
        <p className="catalog-empty">No categories found.</p>
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
