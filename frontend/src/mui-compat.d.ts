import "@mui/material/TextField";

declare module "@mui/material/TextField" {
  interface BaseTextFieldProps {
    inputProps?: Record<string, unknown>;
  }
}
