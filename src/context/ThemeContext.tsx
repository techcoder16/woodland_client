
import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

// Brand colors as raw HSL triples ("H S% L%", no hsl() wrapper) — the same
// format the --primary etc. custom properties already use in index.css, so
// these can be written straight onto documentElement.style to override them.
export interface BrandColors {
  primary: string;
  success: string;
  warning: string;
  destructive: string;
}

export const DEFAULT_BRAND_COLORS: BrandColors = {
  primary: "0 81% 43%",
  success: "152 62% 28%",
  warning: "38 85% 38%",
  destructive: "20 78% 45%",
};

const BRAND_COLORS_KEY = "brandColors";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  brandColors: BrandColors;
  setBrandColors: (colors: BrandColors) => void;
  resetBrandColors: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function loadBrandColors(): BrandColors {
  try {
    const raw = localStorage.getItem(BRAND_COLORS_KEY);
    if (!raw) return DEFAULT_BRAND_COLORS;
    return { ...DEFAULT_BRAND_COLORS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_BRAND_COLORS;
  }
}

function applyBrandColors(colors: BrandColors) {
  const root = window.document.documentElement;
  root.style.setProperty("--primary", colors.primary);
  root.style.setProperty("--ring", colors.primary);
  root.style.setProperty("--sidebar-primary", colors.primary);
  root.style.setProperty("--sidebar-ring", colors.primary);
  root.style.setProperty("--success", colors.success);
  root.style.setProperty("--warning", colors.warning);
  root.style.setProperty("--destructive", colors.destructive);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem("theme") as Theme) || "light"
  );
  const [brandColors, setBrandColorsState] = useState<BrandColors>(loadBrandColors);

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("dark", "light");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    applyBrandColors(brandColors);
  }, [brandColors]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const setBrandColors = (colors: BrandColors) => {
    setBrandColorsState(colors);
    localStorage.setItem(BRAND_COLORS_KEY, JSON.stringify(colors));
  };

  const resetBrandColors = () => {
    setBrandColorsState(DEFAULT_BRAND_COLORS);
    localStorage.removeItem(BRAND_COLORS_KEY);
  };

  const value = {
    theme,
    toggleTheme,
    setTheme,
    brandColors,
    setBrandColors,
    resetBrandColors,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  
  return context;
};
