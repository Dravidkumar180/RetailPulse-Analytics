/* Teaching guide: This file contains change password dialog page-level user-interface behavior and supporting logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */
import { Dialog, DialogContent, IconButton } from "@mui/material";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import ChangePasswordForm from "../../components/auth/ChangePasswordForm/ChangePasswordForm";

// Wrap the reusable password form in the Profile page's modal dialog.
// This component receives prepared data and renders the feature-specific interface.
export default function ChangePasswordDialog({
  open,
  onClose,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      className="profile-page__password-dialog"
    >
      <IconButton
        className="profile-page__dialog-close"
        aria-label="Close change password dialog"
        onClick={onClose}
      >
        <CloseOutlinedIcon />
      </IconButton>
      <DialogContent>
        <ChangePasswordForm onPasswordChanged={onChanged} />
      </DialogContent>
    </Dialog>
  );
}
