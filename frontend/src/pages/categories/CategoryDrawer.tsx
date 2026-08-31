/* Teaching guide: This file contains category drawer page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
// Handles the category drawer user interface and its interactions.
import {
  Box,
  Drawer,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { Category, CategoryInput } from "../../api/catalogApi";
import Button from "../../components/common/Button/Button";

type Props = {
  open: boolean;
  editing: Category | null;
  form: CategoryInput;
  error: string;
  saving: boolean;
  onClose: () => void;
  onChange: (form: CategoryInput) => void;
  onSave: () => void;
};
// This component receives prepared data and renders the feature-specific interface.
export default function CategoryDrawer(p: Props) {
  return (
    <Drawer anchor="right" open={p.open} onClose={p.onClose}>
      <Box className="catalog-drawer">
        <Box className="catalog-drawer__head">
          <Typography component="h2">
            {p.editing ? "Edit Category" : "Add Category"}
          </Typography>
          <IconButton onClick={p.onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        {p.error && <p className="catalog-error">{p.error}</p>}
        <TextField
          required
          label="Category Name"
          value={p.form.name}
          onChange={(event) =>
            p.onChange({ ...p.form, name: event.target.value })
          }
        />
        <TextField
          multiline
          rows={4}
          label="Description"
          value={p.form.description}
          onChange={(event) =>
            p.onChange({ ...p.form, description: event.target.value })
          }
        />
        <TextField
          select
          label="Status"
          value={p.form.status}
          onChange={(event) =>
            p.onChange({
              ...p.form,
              status: event.target.value as CategoryInput["status"],
            })
          }
        >
          <MenuItem value="ACTIVE">Active</MenuItem>
          <MenuItem value="INACTIVE">Inactive</MenuItem>
        </TextField>
        <Box className="catalog-drawer__actions">
          <Button variant="outlined" onClick={p.onClose}>
            Cancel
          </Button>
          <Button loading={p.saving} onClick={p.onSave}>
            Save Category
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
