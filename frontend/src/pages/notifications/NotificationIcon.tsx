/* Chooses an icon for import, sales, system, or stock notifications. */
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";

export default function NotificationIcon({ type }: { type: string }) {
  return type.startsWith("IMPORT") ? (
    <CloudUploadOutlinedIcon />
  ) : type === "SALES_ALERT" ? (
    <ShoppingCartOutlinedIcon />
  ) : type === "SYSTEM_ALERT" ? (
    <SettingsOutlinedIcon />
  ) : (
    <Inventory2OutlinedIcon />
  );
}
