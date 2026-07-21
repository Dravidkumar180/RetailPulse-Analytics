/* Teaching guide: This file contains the form input user interface.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

import type {
  HTMLInputTypeAttribute,
  InputHTMLAttributes,
} from "react";

// Imports the needed tools from @mui/material/TextField.
import TextField from "@mui/material/TextField";
// Imports the needed tools from react-hook-form.
import type { UseFormRegisterReturn } from "react-hook-form";

// Loads ./FormInput.css styles or setup.
import "./FormInput.css";

// Defines the fields allowed in form input props.
interface FormInputProps {
  label: string;
  name: string;
  placeholder?: string;
  type?: HTMLInputTypeAttribute;
  error?: string;
  registration?: UseFormRegisterReturn;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  multiline?: boolean;
  rows?: number;
  autoComplete?: string;
  helperText?: string;
  className?: string;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
}

// Stores form input for the steps below.
const FormInput = ({
  label,
  name,
  placeholder,
  type = "text",
  error,
  registration,
  required = false,
  disabled = false,
  fullWidth = true,
  multiline = false,
  rows,
  autoComplete,
  helperText,
  className = "",
  inputProps,
}: FormInputProps) => {
  // Builds the visible interface below.
  return (
    <div className={`form-input ${className}`.trim()}>
      <TextField
        id={name}
        name={registration?.name ?? name}
        label={label}
        placeholder={placeholder}
        type={type}
        required={required}
        disabled={disabled}
        fullWidth={fullWidth}
        multiline={multiline}
        rows={rows}
        autoComplete={autoComplete}
        error={Boolean(error)}
        helperText={error ?? helperText}
        variant="outlined"
        size="medium"
        inputRef={registration?.ref}
        onChange={registration?.onChange}
        onBlur={registration?.onBlur}
        slotProps={{
          htmlInput: inputProps,
        }}
      />
    </div>
  );
};

export default FormInput;