import type {
  HTMLInputTypeAttribute,
  InputHTMLAttributes,
} from "react";

import TextField from "@mui/material/TextField";
import type { UseFormRegisterReturn } from "react-hook-form";

import "./FormInput.css";

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