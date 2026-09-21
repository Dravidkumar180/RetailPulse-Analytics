/* Collects a new user name, email, temporary password, and role. */
import {
  Alert,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import Button from "../../components/common/Button/Button";
import type { CreateUserRequest } from "../../api/userApi";
import { editableRoles } from "./userConstants";
import { formatLabel } from "./userUtils";
import type { UsersPageState } from "./useUsersPage";

type Props = Pick<
  UsersPageState,
  | "inviteOpen"
  | "setInviteOpen"
  | "inviteMutation"
  | "submitInvite"
  | "invite"
  | "setInvite"
  | "showPassword"
  | "setShowPassword"
>;

export default function InviteUserDialog({
  inviteOpen,
  setInviteOpen,
  inviteMutation,
  submitInvite,
  invite,
  setInvite,
  showPassword,
  setShowPassword,
}: Props) {
  return (
    <Dialog
      open={inviteOpen}
      onClose={() => !inviteMutation.isPending && setInviteOpen(false)}
      fullWidth
      maxWidth="sm"
      className="users-page__dialog"
    >
      <Box component="form" onSubmit={submitInvite}>
        <DialogTitle>
          Invite User
          <IconButton
            aria-label="Close invite dialog"
            onClick={() => setInviteOpen(false)}
            disabled={inviteMutation.isPending}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {inviteMutation.isError && (
            <Alert severity="error">
              Unable to invite this user. Check the details or use a different
              email.
            </Alert>
          )}
          <TextField
            label="Full Name"
            value={invite.name}
            onChange={(event) =>
              setInvite({ ...invite, name: event.target.value })
            }
            required
            inputProps={{ minLength: 2, maxLength: 100 }}
            fullWidth
          />
          <TextField
            label="Email"
            type="email"
            value={invite.email}
            onChange={(event) =>
              setInvite({ ...invite, email: event.target.value })
            }
            required
            fullWidth
          />
          <TextField
            label="Temporary Password"
            type={showPassword ? "text" : "password"}
            value={invite.password}
            onChange={(event) =>
              setInvite({ ...invite, password: event.target.value })
            }
            required
            fullWidth
            slotProps={{
              htmlInput: { minLength: 8, maxLength: 72 },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      onClick={() => setShowPassword((current) => !current)}
                      edge="end"
                    >
                      {showPassword ? (
                        <VisibilityOffOutlinedIcon />
                      ) : (
                        <VisibilityOutlinedIcon />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <FormControl fullWidth>
            <InputLabel id="invite-role-label">Role</InputLabel>
            <Select
              labelId="invite-role-label"
              label="Role"
              value={invite.role}
              onChange={(event) =>
                setInvite({
                  ...invite,
                  role: event.target.value as CreateUserRequest["role"],
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
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => setInviteOpen(false)}
            disabled={inviteMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" loading={inviteMutation.isPending}>
            Send Invite
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
