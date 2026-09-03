import { createTheme, type Theme } from "@mui/material/styles";

export const themeOptions = {
  ocean: { label: "بحري", primary: "#176b87", secondary: "#ef8354", background: "#f2f8fa" },
  forest: { label: "غابة", primary: "#397d54", secondary: "#d9a441", background: "#f4f8f1" },
  sunset: { label: "غروب", primary: "#b84a62", secondary: "#e58f65", background: "#fff6f0" },
  lavender: { label: "لافندر", primary: "#665191", secondary: "#e27d9b", background: "#f8f5fc" },
} as const;

export type ThemeName = keyof typeof themeOptions;

export function buildTheme(name: ThemeName): Theme {
  const selected = themeOptions[name];
  return createTheme({
  palette: {
    mode: "light",
    primary: {
      main: selected.primary,
      light: `${selected.primary}66`,
      dark: selected.primary,
      contrastText: "#ffffff",
    },
    secondary: {
      main: selected.secondary,
      light: `${selected.secondary}44`,
      dark: selected.secondary,
      contrastText: "#ffffff",
    },
    background: {
      default: selected.background,
      paper: "#ffffff",
    },
    info: {
      main: selected.primary,
      light: "#dfeaf1",
      dark: "#4e6e81",
    },
    success: {
      main: "#4f9d69",
    },
    warning: {
      main: "#d9a441",
    },
    error: {
      main: "#c94c4c",
    },
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 800 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 700 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 18px 38px rgba(31, 45, 43, 0.08)",
          border: "1px solid rgba(31, 45, 43, 0.08)",
          background: "linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.72) 100%)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          minHeight: 46,
          boxShadow: "none",
          textTransform: "none",
          fontWeight: 700,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
  },
  });
}

export const theme = createTheme(buildTheme("ocean"));
