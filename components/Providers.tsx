"use client";

import { useEffect, useMemo, useState } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { lightTheme, darkTheme } from "@/lib/theme";

function MuiThemeWrapper({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const theme = useMemo(
    () => (resolvedTheme === "dark" ? darkTheme : lightTheme),
    [resolvedTheme]
  );

  // Avoid rendering MUI with the wrong theme before next-themes resolves
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <SessionProvider>
        <MuiThemeWrapper>{children}</MuiThemeWrapper>
      </SessionProvider>
    </NextThemesProvider>
  );
}
