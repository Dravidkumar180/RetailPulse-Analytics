/* Teaching guide: This file contains categories toolbar page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
// Renders the categories toolbar controls for the categories feature.
import { Box, TextField } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import Button from "../../components/common/Button/Button";

// This component receives prepared data and renders the feature-specific interface.
export default function CategoriesToolbar({
  search,
  canEdit,
  onSearch,
  onAdd,
}: {
  search: string;
  canEdit: boolean;
  onSearch: (value: string) => void;
  onAdd: () => void;
}) {
  return (
    <Box className="category-top">
      <TextField
        size="small"
        placeholder="Search categories by name..."
        value={search}
        onChange={(event) => onSearch(event.target.value)}
      />
      {canEdit && (
        <Button startIcon={<AddIcon />} onClick={onAdd}>
          Add Category
        </Button>
      )}
    </Box>
  );
}
