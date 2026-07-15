import type {
  RegisterOptions,
} from "react-hook-form";

import type {
  CompanyRegistrationRequest,
} from "../api/authApi";
import { EMAIL_PATTERN } from "./loginSchema";

export const PHONE_PATTERN =
  /^[0-9+\-()\s]{7,20}$/;

export const STRONG_PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

type CompanyRegistrationRules = {
  companyName: RegisterOptions<
    CompanyRegistrationRequest,
    "companyName"
  >;
  industry: RegisterOptions<
    CompanyRegistrationRequest,
    "industry"
  >;
  companyEmail: RegisterOptions<
    CompanyRegistrationRequest,
    "companyEmail"
  >;
  companyAddress: RegisterOptions<
    CompanyRegistrationRequest,
    "companyAddress"
  >;
  companyPhoneNumber: RegisterOptions<
    CompanyRegistrationRequest,
    "companyPhoneNumber"
  >;
  ownerName: RegisterOptions<
    CompanyRegistrationRequest,
    "ownerName"
  >;
  ownerEmail: RegisterOptions<
    CompanyRegistrationRequest,
    "ownerEmail"
  >;
  password: RegisterOptions<
    CompanyRegistrationRequest,
    "password"
  >;
};

export const companyRegistrationValidationSchema: CompanyRegistrationRules =
  {
    companyName: {
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
    },

    industry: {
      required: "Industry is required.",
    },

    companyEmail: {
      required: "Company email is required.",
      pattern: {
        value: EMAIL_PATTERN,
        message:
          "Enter a valid company email address.",
      },
      maxLength: {
        value: 255,
        message:
          "Company email must not exceed 255 characters.",
      },
    },

    companyAddress: {
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
    },

    companyPhoneNumber: {
      required: "Company phone number is required.",
      pattern: {
        value: PHONE_PATTERN,
        message: "Enter a valid phone number.",
      },
    },

    ownerName: {
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
    },

    ownerEmail: {
      required: "Owner email is required.",
      pattern: {
        value: EMAIL_PATTERN,
        message: "Enter a valid owner email address.",
      },
      maxLength: {
        value: 255,
        message:
          "Owner email must not exceed 255 characters.",
      },
    },

    password: {
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
        value: STRONG_PASSWORD_PATTERN,
        message:
          "Use uppercase, lowercase, number and special character.",
      },
    },
  };

export const createConfirmPasswordValidation = (
  password: string,
): RegisterOptions<
  CompanyRegistrationRequest,
  "confirmPassword"
> => ({
  required: "Confirm password is required.",
  validate: (value) =>
    value === password ||
    "Password and confirm password must match.",
});