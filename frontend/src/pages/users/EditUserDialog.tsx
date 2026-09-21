/* Edits an existing user role and account status and shows save progress or errors. */
import {
  Alert,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Button from "../../components/common/Button/Button";
import type { AccountStatus } from "../../api/authApi";
import type { UpdateUserRequest } from "../../api/userApi";
import { editableRoles, accountStatuses } from "./userConstants";
import { formatLabel } from "./userUtils";
import type { UsersPageState } from "./useUsersPage";

type Props = Pick<
  UsersPageState,
  | "editingUser"
  | "setEditingUser"
  | "editMutation"
  | "submitEdit"
  | "editValues"
  | "setEditValues"
>;

export default function EditUserDialog({
  editingUser,
  setEditingUser,
  editMutation,
  submitEdit,
  editValues,
  setEditValues,
}: Props) {
  return (
    <Dialog
      open={Boolean(editingUser)}
      onClose={() => !editMutation.isPending && setEditingUser(null)}
      fullWidth
      maxWidth="sm"
      className="users-page__dialog"
    >
      <Box component="form" onSubmit={submitEdit}>
        <DialogTitle>
          Edit {editingUser?.name}
          <IconButton
            aria-label="Close edit dialog"
            onClick={() => setEditingUser(null)}
            disabled={editMutation.isPending}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {editMutation.isError && (
            <Alert severity="error">
              Unable to save this user. Please try again.
            </Alert>
          )}
          <FormControl fullWidth>
            <InputLabel id="edit-role-label">Role</InputLabel>
            <Select
              labelId="edit-role-label"
              label="Role"
              value={editValues.role}
              onChange={(event) =>
                setEditValues({
                  ...editValues,
                  role: event.target.value as UpdateUserRequest["role"],
                })
              }
            >
              {editableRoles.map((item) => (
                <MenuItem key={item} value={item}>
                  {formatLabel(item)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="edit-status-label">Status</InputLabel>
            <Select
              labelId="edit-status-label"
              label="Status"
              value={editValues.status}
              onChange={(event) =>
                setEditValues({
                  ...editValues,
                  status: event.target.value as AccountStatus,
                })
              }
            >
              {accountStatuses.map((item) => (
                <MenuItem key={item} value={item}>
                  {formatLabel(item)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => setEditingUser(null)}
            disabled={editMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" loading={editMutation.isPending}>
            Save Changes
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
