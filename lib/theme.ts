"use client";

import { createTheme } from "@mui/material/styles";

const sharedTypography = {
  fontFamily: "var(--font-geist-sans), sans-serif",
  fontFamilyCode: "var(--font-geist-mono), monospace",
};

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1a1a1a" },
    secondary: { main: "#f5f5f5" },
    error: { main: "#dc2626" },
    background: {
      default: "#ffffff",
      paper: "#ffffff",
    },
    text: {
      primary: "#1a1a1a",
      secondary: "#737373",
    },
    divider: "#e5e5e5",
  },
  typography: sharedTypography,
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 500 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderColor: "#e5e5e5",
        },
      },
      defaultProps: { variant: "outlined" },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500 },
      },
    },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#ffffff" },
    secondary: { main: "#404040" },
    error: { main: "#f87171" },
    background: {
      default: "#121212",
      paper: "#1e1e1e",
    },
    text: {
      primary: "#f5f5f5",
      secondary: "#a0a0a0",
    },
    divider: "rgba(255,255,255,0.12)",
    action: {
      hover: "rgba(255,255,255,0.08)",
      selected: "rgba(255,255,255,0.12)",
    },
  },
  typography: sharedTypography,
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 500 },
        containedPrimary: {
          backgroundColor: "#f5f5f5",
          color: "#121212",
          "&:hover": { backgroundColor: "#e0e0e0" },
        },
        outlinedPrimary: {
          borderColor: "rgba(255,255,255,0.23)",
          color: "#f5f5f5",
          "&:hover": {
            borderColor: "rgba(255,255,255,0.5)",
            backgroundColor: "rgba(255,255,255,0.05)",
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#1e1e1e",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#1e1e1e",
          borderColor: "rgba(255,255,255,0.12)",
        },
      },
      defaultProps: { variant: "outlined" },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
        outlined: {
          borderColor: "rgba(255,255,255,0.12)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500 },
        outlined: {
          borderColor: "rgba(255,255,255,0.23)",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            "& fieldset": {
              borderColor: "rgba(255,255,255,0.23)",
            },
            "&:hover fieldset": {
              borderColor: "rgba(255,255,255,0.5)",
            },
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "rgba(255,255,255,0.12)",
        },
      },
    },
  },
});
