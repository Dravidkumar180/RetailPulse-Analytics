import { Box, Typography } from "@mui/material";
import LockResetOutlinedIcon from "@mui/icons-material/LockResetOutlined";
import Button from "../../components/common/Button/Button";

// This card opens the password dialog; the actual form lives in that dialog.
// This component receives prepared data and renders the feature-specific interface.
export default function ProfileSecurityCard({
  onChangePassword,
}: {
  onChangePassword: () => void;
}) {
  return (
    <Box className="profile-page__password-card">
      <Typography component="h2">Password & Security</Typography>
      <Typography component="p">
        Keep your account secure by using a strong, unique password.
      </Typography>
      <Button
        className="profile-page__password-button"
        startIcon={<LockResetOutlinedIcon />}
        onClick={onChangePassword}
      >
        Change Password
      </Button>
    </Box>
  );
}
