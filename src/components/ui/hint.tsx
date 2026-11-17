import { ReactNode } from "react";
import { Info } from "lucide-react";
import { getHint } from "@/helper/hints";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/** Wraps any element so hovering/focusing it explains what it is and why. */
export function Hint({ text, children, side = "top" }: { text: string; children: ReactNode; side?: "top" | "right" | "bottom" | "left" }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** Small (i) icon with an explanation, for labels and column headings. */
export function InfoHint({ text, side = "top", quiet = false }: { text: string; side?: "top" | "right" | "bottom" | "left"; quiet?: boolean }) {
  return (
    <Hint text={text} side={side}>
      <span {...(quiet ? { "aria-hidden": true } : { tabIndex: 0, "aria-label": text })} className="inline-flex align-middle ml-1 text-muted-foreground cursor-help">
        <Info className="h-3.5 w-3.5" />
      </span>
    </Hint>
  );
}

/** (i) icon for a heading/label, looked up by its text in helper/hints.ts. Renders nothing if unknown. */
export function AutoHint({ for: label }: { for: string }) {
  const text = getHint(label);
  return text ? <InfoHint quiet text={text} /> : null;
}
