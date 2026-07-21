/* Teaching guide: This file contains mui compat.d application logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Loads @mui/material/TextField styles or setup.
import "@mui/material/TextField";

declare module "@mui/material/TextField" {
  // Defines the fields allowed in base text field props.
  interface BaseTextFieldProps {
    inputProps?: Record<string, unknown>;
  }
}
