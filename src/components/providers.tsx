"use client";

import { CssBaseline, ThemeProvider } from "@mui/material";
import { createContext, startTransition, useContext, useEffect, useState, type ReactNode } from "react";

import { buildTheme, themeOptions, type ThemeName } from "@/theme";

const ThemeModeContext = createContext<{ themeName: ThemeName; setThemeName: (name: ThemeName) => void }>({
  themeName: "ocean",
  setThemeName: () => undefined,
});

export function useThemeMode() {
  return useContext(ThemeModeContext);
}

export function Providers({ children }: { children: ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>("ocean");

  useEffect(() => {
    const saved = window.localStorage.getItem("clothflow-theme") as ThemeName | null;
    if (saved && saved in themeOptions) startTransition(() => setThemeName(saved));
  }, []);

  function changeTheme(name: ThemeName) {
    setThemeName(name);
    window.localStorage.setItem("clothflow-theme", name);
  }

  return (
    <ThemeModeContext.Provider value={{ themeName, setThemeName: changeTheme }}>
      <ThemeProvider theme={buildTheme(themeName)}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}
