"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { BrandingProvider } from "@/lib/branding/provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <BrandingProvider>{children}</BrandingProvider>
    </NextThemesProvider>
  );
}
