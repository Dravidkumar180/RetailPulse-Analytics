/* Teaching guide: This file contains main application logic.
 * Follow the comments from imports and setup through actions and output.
 * These comments explain the existing code without changing its behavior.
 */

// Imports the needed tools from react.
import { StrictMode } from "react";
// Imports the needed tools from react-dom/client.
import { createRoot } from "react-dom/client";
// Imports the needed tools from react-router-dom.
import { BrowserRouter } from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import {
  CssBaseline,
  ThemeProvider,
} from "@mui/material";

// Imports the needed tools from ./App.
import App from "./App";
// Imports the needed tools from ./context/AuthContext.
import { AuthProvider } from "./context/AuthContext";
// Imports the needed tools from ./theme/theme.
import theme from "./theme/theme";

// Loads ./styles/global.css styles or setup.
import "./styles/global.css";

// Stores query client for the steps below.
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

// Stores root element for the steps below.
const rootElement =
  document.getElementById("root");

// Checks whether this condition is true.
if (!rootElement) {
  // Stops here and reports the problem.
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