import { Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

// Text size for the whole app (handy on tablets). Everything is sized in rem, so changing
// the root font size scales text, spacing and buttons together. Saved in this browser.
const KEY = "woodland:text-size";
const SIZES = [
  { id: "normal", label: "Normal", px: 16 },
  { id: "large", label: "Large", px: 18 },
  { id: "larger", label: "Larger", px: 20 },
] as const;
type SizeId = (typeof SIZES)[number]["id"];

const savedSize = (): SizeId => {
  try {
    const v = localStorage.getItem(KEY);
    return SIZES.some((s) => s.id === v) ? (v as SizeId) : "normal";
  } catch {
    return "normal";
  }
};

export function applySavedTextSize(id: SizeId = savedSize()) {
  const size = SIZES.find((s) => s.id === id) ?? SIZES[0];
  document.documentElement.style.fontSize = size.id === "normal" ? "" : `${size.px}px`;
}

export function TextSizeToggle() {
  const [current, setCurrent] = useState<SizeId>(savedSize);
  const choose = (id: SizeId) => {
    try {
      localStorage.setItem(KEY, id);
    } catch {
      /* private mode: still apply for this visit */
    }
    applySavedTextSize(id);
    setCurrent(id);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9" title="Text size">
          <Type className="h-[1.15rem] w-[1.15rem]" />
          <span className="sr-only">Text size</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Text size</DropdownMenuLabel>
        {SIZES.map((s) => (
          <DropdownMenuItem key={s.id} onClick={() => choose(s.id)} className={current === s.id ? "font-semibold text-primary" : ""}>
            <span style={{ fontSize: `${s.px - 2}px` }}>{s.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
