/* Teaching guide: This file contains the company registration form user interface.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Imports the needed tools from react.
import { useState } from "react";
// Imports the needed tools from react-router-dom.
import { Link, useNavigate } from "react-router-dom";
// Imports the needed tools from @tanstack/react-query.
import { useMutation } from "@tanstack/react-query";
// Imports the needed tools from react-hook-form.
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  Box,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
// Imports the needed tools from @mui/icons-material/BusinessOutlined.
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
// Imports the needed tools from @mui/icons-material/PersonOutlined.
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
// Imports the needed tools from @mui/icons-material/VisibilityOutlined.
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
// Imports the needed tools from @mui/icons-material/VisibilityOffOutlined.
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

import {
  registerCompany,
  // Defines the company registration request type.
  type CompanyRegistrationRequest,
} from "../../../api/authApi";
// Imports the needed tools from ../../common/Button/Button.
import Button from "../../common/Button/Button";
// Imports the needed tools from ../../common/FormInput/FormInput.
import FormInput from "../../common/FormInput/FormInput";

// Loads ./CompanyRegistrationForm.css styles or setup.
import "./CompanyRegistrationForm.css";

// Stores industries for the steps below.
const industries = [
  "Retail",
  "E-Commerce",
  "Technology",
  "Healthcare",
  "Finance",
  "Manufacturing",
  "Hospitality",
  "Education",
  "Logistics",
  "Other",
];

// Gets error message.
const getErrorMessage = (error: unknown): string => {
  // Checks whether this condition is true.
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    // Stores axios error for the steps below.
    const axiosError = error as {
      response?: {
        data?: {
          detail?: string;
          message?: string;
        };
      };
    };

    // Builds the visible interface below.
    return (
      axiosError.response?.data?.detail ??
      axiosError.response?.data?.message ??
      "Company registration failed. Please verify the entered details."
    );
  }

  // Checks whether this condition is true.
  if (error instanceof Error) {
    // Returns the completed result to the caller.
    return error.message;
  }

  // Returns the completed result to the caller.
  return "Company registration failed. Please try again.";
};

// Shows the company registration form.
const CompanyRegistrationForm = () => {
  // Stores navigate for the steps below.
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CompanyRegistrationRequest>({
    defaultValues: {
      companyName: "",
      industry: "",
      companyEmail: "",
      companyAddress: "",
      companyPhoneNumber: "",
      ownerName: "",
      ownerEmail: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onBlur",
  });

  // Runs password value logic.
  const passwordValue = watch("password");

  // Runs registration mutation logic.
  const registrationMutation = useMutation({
    mutationFn: registerCompany,
    onSuccess: () => {
      // Updates the page or stored state with this result.
      navigate("/login", {
        replace: true,
        state: {
          registrationSuccess:
            "Company registered successfully. Login with the company admin account.",
        },
      });
    },
  });

  // Runs on submit logic.
  const onSubmit = (formData: CompanyRegistrationRequest) => {
    registrationMutation.mutate({
      companyName: formData.companyName.trim(),
      industry: formData.industry.trim(),
      companyEmail: formData.companyEmail.trim().toLowerCase(),
      companyAddress: formData.companyAddress.trim(),
      companyPhoneNumber: formData.companyPhoneNumber.trim(),
      ownerName: formData.ownerName.trim(),
      ownerEmail: formData.ownerEmail.trim().toLowerCase(),
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    });
  };

  // Builds the visible interface below.
  return (
    <Box
      component="form"
      className="company-registration-form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <Box className="company-registration-form__main-icon">
        <BusinessOutlinedIcon />
      </Box>

      <Box className="company-registration-form__header">
        <Typography component="h1">
          Register your company
        </Typography>

        <Typography component="p">
          Create your RetailPulse Analytics company account and first
          administrator.
        </Typography>
      </Box>

      {registrationMutation.isError && (
        <Alert severity="error">
          {getErrorMessage(registrationMutation.error)}
        </Alert>
      )}

      <Box className="company-registration-form__section">
        <Box className="company-registration-form__section-title">
          <BusinessOutlinedIcon />

          <Box>
            <Typography component="h2">
              Company information
            </Typography>

            <Typography component="p">
              Enter the official details of your organization.
            </Typography>
          </Box>
        </Box>

        <Box className="company-registration-form__grid">
          <FormInput
            name="companyName"
            label="Company Name"
            placeholder="Enter company name"
            required
            registration={register("companyName", {
              required: "Company name is required.",
              minLength: {
                value: 2,
                message:
                  "Company name must contain at least 2 characters.",
              },
              maxLength: {
                value: 150,
                message:
                  "Company name must not exceed 150 characters.",
              },
            })}
            error={errors.companyName?.message}
          />

          <Controller
            name="industry"
            control={control}
            rules={{
              required: "Industry is required.",
            }}
            render={({ field }) => (
              <FormControl
                fullWidth
                required
                error={Boolean(errors.industry)}
                className="company-registration-form__select"
              >
                <InputLabel id="industry-label">Industry</InputLabel>

                <Select
                  {...field}
                  labelId="industry-label"
                  label="Industry"
                >
                  {industries.map((industry) => (
                    <MenuItem key={industry} value={industry}>
                      {industry}
                    </MenuItem>
                  ))}
                </Select>

                {errors.industry?.message && (
                  <FormHelperText>
                    {errors.industry.message}
                  </FormHelperText>
                )}
              </FormControl>
            )}
          />

          <FormInput
            name="companyEmail"
            label="Company Email"
            type="email"
            placeholder="company@example.com"
            autoComplete="organization-email"
            required
            registration={register("companyEmail", {
              required: "Company email is required.",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Enter a valid company email address.",
              },
            })}
            error={errors.companyEmail?.message}
          />

          <FormInput
            name="companyPhoneNumber"
            label="Company Phone Number"
            type="tel"
            placeholder="+91 98765 43210"
            autoComplete="tel"
            required
            registration={register("companyPhoneNumber", {
              required: "Company phone number is required.",
              pattern: {
                value: /^[0-9+\-()\s]{7,20}$/,
                message: "Enter a valid phone number.",
              },
            })}
            error={errors.companyPhoneNumber?.message}
          />

          <FormInput
            name="companyAddress"
            label="Company Address"
            placeholder="Enter the complete company address"
            multiline
            rows={3}
            required
            className="company-registration-form__full-width"
            registration={register("companyAddress", {
              required: "Company address is required.",
              minLength: {
                value: 5,
                message:
                  "Company address must contain at least 5 characters.",
              },
              maxLength: {
                value: 500,
                message:
                  "Company address must not exceed 500 characters.",
              },
            })}
            error={errors.companyAddress?.message}
          />
        </Box>
      </Box>

      <Box className="company-registration-form__section">
        <Box className="company-registration-form__section-title">
          <PersonOutlinedIcon />

          <Box>
            <Typography component="h2">
              Company administrator
            </Typography>

            <Typography component="p">
              This user will become the first Company Admin.
            </Typography>
          </Box>
        </Box>

        <Box className="company-registration-form__grid">
          <FormInput
            name="ownerName"
            label="Owner Name"
            placeholder="Enter owner name"
            autoComplete="name"
            required
            registration={register("ownerName", {
              required: "Owner name is required.",
              minLength: {
                value: 2,
                message:
                  "Owner name must contain at least 2 characters.",
              },
              maxLength: {
                value: 100,
                message:
                  "Owner name must not exceed 100 characters.",
              },
            })}
            error={errors.ownerName?.message}
          />

          <FormInput
            name="ownerEmail"
            label="Owner Email"
            type="email"
            placeholder="owner@example.com"
            autoComplete="email"
            required
            registration={register("ownerEmail", {
              required: "Owner email is required.",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Enter a valid owner email address.",
              },
            })}
            error={errors.ownerEmail?.message}
          />

          <div className="company-registration-form__password-field">
            <FormInput
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              required
              registration={register("password", {
                required: "Password is required.",
                minLength: {
                  value: 8,
                  message:
                    "Password must contain at least 8 characters.",
                },
                maxLength: {
                  value: 128,
                  message:
                    "Password must not exceed 128 characters.",
                },
                pattern: {
                  value:
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
                  message:
                    "Use uppercase, lowercase, number and special character.",
                },
              })}
              error={errors.password?.message}
            />

            <IconButton
              type="button"
              className="company-registration-form__password-toggle"
              aria-label={
                showPassword ? "Hide password" : "Show password"
              }
              onClick={() =>
                // Updates the page or stored state with this result.
                setShowPassword((current) => !current)
              }
            >
              {showPassword ? (
                <VisibilityOffOutlinedIcon />
              ) : (
                <VisibilityOutlinedIcon />
              )}
            </IconButton>
          </div>

          <div className="company-registration-form__password-field">
            <FormInput
              name="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Enter the password again"
              autoComplete="new-password"
              required
              registration={register("confirmPassword", {
                required: "Confirm password is required.",
                validate: (value) =>
                  value === passwordValue ||
                  "Password and confirm password must match.",
              })}
              error={errors.confirmPassword?.message}
            />

            <IconButton
              type="button"
              className="company-registration-form__password-toggle"
              aria-label={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
              onClick={() =>
                // Updates the page or stored state with this result.
                setShowConfirmPassword((current) => !current)
              }
            >
              {showConfirmPassword ? (
                <VisibilityOffOutlinedIcon />
              ) : (
                <VisibilityOutlinedIcon />
              )}
            </IconButton>
          </div>
        </Box>
      </Box>

      <label className="company-registration-form__terms">
        <input type="checkbox" required />
        <span>I agree to the <a href="#terms">Terms &amp; Conditions</a></span>
      </label>

      <Box className="company-registration-form__actions">
        <Typography component="p">
          Already registered?
          <Link
            to="/login"
            className="company-registration-form__login-link"
          >
            Sign in
          </Link>
        </Typography>

        <Button
          type="submit"
          loading={registrationMutation.isPending}
          disabled={registrationMutation.isPending}
          className="company-registration-form__submit"
        >
          Register Company
        </Button>
      </Box>
    </Box>
  );
};

export default CompanyRegistrationForm;
