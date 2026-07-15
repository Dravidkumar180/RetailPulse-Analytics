import { createTheme } from "@mui/material/styles";

import { colors } from "./colors";

const theme = createTheme({
  palette: {
    mode: "light",

    primary: colors.primary,
    secondary: colors.secondary,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.info,

    background: colors.background,
    text: colors.text,
    divider: colors.divider,
  },

  typography: {
    fontFamily: [
      "Inter",
      "system-ui",
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "sans-serif",
    ].join(","),

    h1: {
      fontSize: "2rem",
      fontWeight: 700,
      lineHeight: 1.25,
    },

    h2: {
      fontSize: "1.5rem",
      fontWeight: 700,
      lineHeight: 1.3,
    },

    h3: {
      fontSize: "1.25rem",
      fontWeight: 700,
      lineHeight: 1.35,
    },

    body1: {
      fontSize: "0.9375rem",
      lineHeight: 1.6,
    },

    body2: {
      fontSize: "0.8125rem",
      lineHeight: 1.5,
    },

    button: {
      fontSize: "0.875rem",
      fontWeight: 600,
      textTransform: "none",
    },
  },

  shape: {
    borderRadius: 8,
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: colors.background.default,
        },
      },
    },

    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },

      styleOverrides: {
        root: {
          minHeight: 42,
          borderRadius: 8,
          paddingInline: 18,
          textTransform: "none",
        },

        contained: {
          "&.MuiButton-containedPrimary:hover": {
            backgroundColor: colors.primary.dark,
          },
        },
      },
    },

    MuiTextField: {
      defaultProps: {
        size: "medium",
        variant: "outlined",
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: colors.background.paper,
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${colors.divider}`,
          borderRadius: 12,
          boxShadow: "0 5px 20px rgb(15 23 42 / 5%)",
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 14,
        },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: colors.background.default,
          color: colors.secondary.dark,
          fontSize: 12,
          fontWeight: 700,
        },

        body: {
          color: "#334155",
          fontSize: 13,
        },
      },
    },

    MuiTooltip: {
      defaultProps: {
        arrow: true,
      },
    },
  },
});

export default theme;