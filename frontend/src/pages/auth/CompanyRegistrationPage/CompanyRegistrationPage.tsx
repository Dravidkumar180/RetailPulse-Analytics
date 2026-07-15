import { Box } from "@mui/material";

import CompanyRegistrationForm from "../../../components/auth/CompanyRegistrationForm/CompanyRegistrationForm";

import "./CompanyRegistrationPage.css";

const CompanyRegistrationPage = () => {
  return (
    <Box className="company-registration-page">
      <Box className="company-registration-page__card">
        <CompanyRegistrationForm />
      </Box>
    </Box>
  );
};

export default CompanyRegistrationPage;