import React, { createContext, useContext, useEffect, useState } from "react";

export interface FontOption {
  id: string;
  label: string;
  family: string;
  googleFontParam: string; // e.g. "Inter:wght@300;400;500;600;700;800"
}

export const FONT_OPTIONS: FontOption[] = [
 
  {
    id: "inter",
    label: "Inter",
    family: "Inter",
    googleFontParam: "Inter:wght@300;400;500;600;700;800",
  },
  {
    id: "poppins",
    label: "Poppins",
    family: "Poppins",
    googleFontParam: "Poppins:wght@300;400;500;600;700;800",
  },
  {
    id: "plus-jakarta-sans",
    label: "Plus Jakarta Sans",
    family: "Plus Jakarta Sans",
    googleFontParam: "Plus+Jakarta+Sans:wght@300;400;500;600;700;800",
  },
  {
    id: "manrope",
    label: "Manrope",
    family: "Manrope",
    googleFontParam: "Manrope:wght@300;400;500;600;700;800",
  },
  {
    id: "sora",
    label: "Sora",
    family: "Sora",
    googleFontParam: "Sora:wght@300;400;500;600;700;800",
  },
  {
    id: "dm-sans",
    label: "DM Sans",
    family: "DM Sans",
    googleFontParam: "DM+Sans:wght@300;400;500;600;700;800",
  },
  {
    id: "outfit",
    label: "Outfit",
    family: "Outfit",
    googleFontParam: "Outfit:wght@300;400;500;600;700;800",
  },
  {
    id: "space-grotesk",
    label: "Space Grotesk",
    family: "Space Grotesk",
    googleFontParam: "Space+Grotesk:wght@300;400;500;600;700",
  },
  {
    id: "roboto",
    label: "Roboto",
    family: "Roboto",
    googleFontParam: "Roboto:wght@300;400;500;700;900",
  },
  {
    id: "open-sans",
    label: "Open Sans",
    family: "Open Sans",
    googleFontParam: "Open+Sans:wght@300;400;500;600;700;800",
  },
  {
    id: "lato",
    label: "Lato",
    family: "Lato",
    googleFontParam: "Lato:wght@300;400;700;900",
  },
  {
    id: "montserrat",
    label: "Montserrat",
    family: "Montserrat",
    googleFontParam: "Montserrat:wght@300;400;500;600;700;800;900",
  },
  {
    id: "playfair-display",
    label: "Playfair Display",
    family: "Playfair Display",
    googleFontParam: "Playfair+Display:wght@400;500;600;700;800;900",
  },
  {
    id: "merriweather",
    label: "Merriweather",
    family: "Merriweather",
    googleFontParam: "Merriweather:wght@300;400;700;900",
  },
  {
    id: "nunito",
    label: "Nunito",
    family: "Nunito",
    googleFontParam: "Nunito:wght@300;400;500;600;700;800",
  },
  {
    id: "raleway",
    label: "Raleway",
    family: "Raleway",
    googleFontParam: "Raleway:wght@300;400;500;600;700;800",
  },
  {
    id: "ubuntu",
    label: "Ubuntu",
    family: "Ubuntu",
    googleFontParam: "Ubuntu:wght@300;400;500;700",
  },
  {
    id: "oswald",
    label: "Oswald",
    family: "Oswald",
    googleFontParam: "Oswald:wght@300;400;500;600;700",
  },
  {
    id: "source-sans-3",
    label: "Source Sans 3",
    family: "Source Sans 3",
    googleFontParam: "Source+Sans+3:wght@300;400;500;600;700;800",
  },
  {
    id: "quicksand",
    label: "Quicksand",
    family: "Quicksand",
    googleFontParam: "Quicksand:wght@300;400;500;600;700",
  },
  {
    id: "pt-sans",
    label: "PT Sans",
    family: "PT Sans",
    googleFontParam: "PT+Sans:wght@400;700",
  },
  {
    id: "pt-serif",
    label: "PT Serif",
    family: "PT Serif",
    googleFontParam: "PT+Serif:wght@400;700",
  },
  {
    id: "cabin",
    label: "Cabin",
    family: "Cabin",
    googleFontParam: "Cabin:wght@400;500;600;700",
  },
  {
    id: "lora",
    label: "Lora",
    family: "Lora",
    googleFontParam: "Lora:wght@400;500;600;700",
  },
  {
    id: "kanit",
    label: "Kanit",
    family: "Kanit",
    googleFontParam: "Kanit:wght@300;400;500;600;700;800",
  },
  {
    id: "fira-sans",
    label: "Fira Sans",
    family: "Fira Sans",
    googleFontParam: "Fira+Sans:wght@300;400;500;600;700;800",
  },
  {
    id: "work-sans",
    label: "Work Sans",
    family: "Work Sans",
    googleFontParam: "Work+Sans:wght@300;400;500;600;700;800",
  },
  {
    id: "cinzel",
    label: "Cinzel",
    family: "Cinzel",
    googleFontParam: "Cinzel:wght@400;500;600;700;800;900",
  },
  {
    id: "barlow",
    label: "Barlow",
    family: "Barlow",
    googleFontParam: "Barlow:wght@300;400;500;600;700;800",
  },
  {
    id: "urbanist",
    label: "Urbanist",
    family: "Urbanist",
    googleFontParam: "Urbanist:wght@300;400;500;600;700;800",
  },
  {
    id: "syne",
    label: "Syne",
    family: "Syne",
    googleFontParam: "Syne:wght@400;500;600;700;800",
  },
  {
    id: "lexend",
    label: "Lexend",
    family: "Lexend",
    googleFontParam: "Lexend:wght@300;400;500;600;700;800",
  },
  {
    id: "archivo",
    label: "Archivo",
    family: "Archivo",
    googleFontParam: "Archivo:wght@300;400;500;600;700;800",
  },
  {
    id: "libre-baskerville",
    label: "Libre Baskerville",
    family: "Libre Baskerville",
    googleFontParam: "Libre+Baskerville:wght@400;700",
  },
  {
    id: "cormorant-garamond",
    label: "Cormorant Garamond",
    family: "Cormorant Garamond",
    googleFontParam: "Cormorant+Garamond:wght@300;400;500;600;700",
  },
  {
    id: "bricolage-grotesque",
    label: "Bricolage Grotesque",
    family: "Bricolage Grotesque",
    googleFontParam: "Bricolage+Grotesque:wght@300;400;500;600;700;800",
  },
  {
    id: "figtree",
    label: "Figtree",
    family: "Figtree",
    googleFontParam: "Figtree:wght@300;400;500;600;700;800",
  },
  {
    id: "space-mono",
    label: "Space Mono",
    family: "Space Mono",
    googleFontParam: "Space+Mono:wght@400;700",
  },
  {
    id: "fira-code",
    label: "Fira Code",
    family: "Fira Code",
    googleFontParam: "Fira+Code:wght@300;400;500;600;700",
  },
  {
    id: "jetbrains-mono",
    label: "JetBrains Mono",
    family: "JetBrains Mono",
    googleFontParam: "JetBrains+Mono:wght@300;400;500;600;700;800",
  },
  {
    id: "ibm-plex-sans",
    label: "IBM Plex Sans",
    family: "IBM Plex Sans",
    googleFontParam: "IBM+Plex+Sans:wght@300;400;500;600;700",
  },
  {
    id: "clash-display",
    label: "Cabinet Grotesk",
    family: "Cabinet Grotesk",
    googleFontParam: "Cabinet+Grotesk:wght@300;400;500;700;800",
  }

];

const DEFAULT_FONT_ID = "inter";
const STORAGE_KEY = "site-font";
const LINK_EL_ID = "dynamic-google-font";

function getFontOption(id: string): FontOption {
  return FONT_OPTIONS.find((f) => f.id === id) || FONT_OPTIONS[0];
}

function loadGoogleFont(option: FontOption) {
  let link = document.getElementById(LINK_EL_ID) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.id = LINK_EL_ID;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  link.href = `https://fonts.googleapis.com/css2?family=${option.googleFontParam}&display=swap`;
}

function applyFont(option: FontOption) {
  document.documentElement.style.setProperty(
    "--font-sans-override",
    `"${option.family}", system-ui, sans-serif`
  );
}

interface FontContextType {
  fontId: string;
  fontOption: FontOption;
  setFontId: (id: string) => void;
  options: FontOption[];
}

const FontContext = createContext<FontContextType | undefined>(undefined);

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [fontId, setFontId] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) || DEFAULT_FONT_ID
  );

  useEffect(() => {
    const option = getFontOption(fontId);
    loadGoogleFont(option);
    applyFont(option);
    localStorage.setItem(STORAGE_KEY, fontId);
  }, [fontId]);

  const value: FontContextType = {
    fontId,
    fontOption: getFontOption(fontId),
    setFontId,
    options: FONT_OPTIONS,
  };

  return <FontContext.Provider value={value}>{children}</FontContext.Provider>;
}

export const useFont = (): FontContextType => {
  const context = useContext(FontContext);
  if (context === undefined) {
    throw new Error("useFont must be used within a FontProvider");
  }
  return context;
};
