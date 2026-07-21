/* Teaching guide: This file contains the company registration page page.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Imports the needed tools from @mui/material.
import { Box } from "@mui/material";

// Imports the needed tools from ../../../components/auth/CompanyRegistrationForm/CompanyRegistrationForm.
import CompanyRegistrationForm from "../../../components/auth/CompanyRegistrationForm/CompanyRegistrationForm";

// Loads ./CompanyRegistrationPage.css styles or setup.
import "./CompanyRegistrationPage.css";

// Shows the company registration page.
const CompanyRegistrationPage = () => {
  // Builds the visible interface below.
  return (
    <Box className="company-registration-page">
      <Box className="company-registration-page__card">
        <CompanyRegistrationForm />
      </Box>
    </Box>
  );
};

export default CompanyRegistrationPage;