"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";

interface BrandingConfig {
  appName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  footerText: string;
  showPoweredBy: boolean;
}

const defaultBranding: BrandingConfig = {
  appName: "Webmail Launcher",
  logoUrl: null,
  faviconUrl: null,
  primaryColor: "#0066FF",
  secondaryColor: "#1a1a2e",
  accentColor: "#00D4FF",
  footerText: "",
  showPoweredBy: true,
};

const BrandingContext = createContext<BrandingConfig>(defaultBranding);

export function useBranding() {
  return useContext(BrandingContext);
}

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<BrandingConfig>(defaultBranding);

  const { data } = useQuery({
    queryKey: ["branding"],
    queryFn: () => fetch("/api/branding").then((r) => r.json()),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  useEffect(() => {
    if (data?.branding) {
      setBranding(data.branding);
      applyBrandingStyles(data.branding);
    }
  }, [data]);

  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  );
}

function applyBrandingStyles(branding: BrandingConfig) {
  const root = document.documentElement;

  // Convert hex to HSL for Tailwind CSS custom properties
  const primaryHSL = hexToHSL(branding.primaryColor);
  const secondaryHSL = hexToHSL(branding.secondaryColor);
  const accentHSL = hexToHSL(branding.accentColor);

  root.style.setProperty("--primary", primaryHSL);
  root.style.setProperty("--secondary", secondaryHSL);
  root.style.setProperty("--accent", accentHSL);

  // Update favicon
  if (branding.faviconUrl) {
    const link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (link) {
      link.href = branding.faviconUrl;
    }
  }

  // Update document title
  document.title = branding.appName;
}

function hexToHSL(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "0 0% 0%";

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
