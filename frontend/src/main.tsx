import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import {
  CssBaseline,
  ThemeProvider,
} from "@mui/material";

import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import theme from "./theme/theme";

import "./styles/global.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false,
    },

    mutations: {
      retry: 0,
    },
  },
});

const rootElement =
  document.getElementById("root");

if (!rootElement) {
  throw new Error(
    'Root element with id "root" was not found.',
  );
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />

          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
);