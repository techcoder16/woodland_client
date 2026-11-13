/** One colour per maintenance priority, used everywhere a priority is shown. */
export const PRIORITY_BADGE: Record<string, string> = {
  Critical: "bg-red-100 text-red-700 border-red-300",
  High: "bg-orange-100 text-orange-700 border-orange-300",
  Medium: "bg-amber-100 text-amber-800 border-amber-300",
  Low: "bg-emerald-100 text-emerald-700 border-emerald-300",
};

export function priorityBadgeClass(priority?: string | null): string {
  if (!priority) return "";
  const key = Object.keys(PRIORITY_BADGE).find((k) => k.toLowerCase() === priority.toLowerCase());
  return key ? PRIORITY_BADGE[key] : "bg-slate-100 text-slate-700 border-slate-300";
}

/** One colour per job status: a badge, and a soft tint + left bar for the whole table row. */
export const STATUS_STYLE: Record<string, { badge: string; row: string }> = {
  QUOTING: { badge: "bg-purple-100 text-purple-700 border-purple-300", row: "bg-purple-50/60 border-l-4 border-l-purple-400" },
  ASSIGNED: { badge: "bg-blue-100 text-blue-700 border-blue-300", row: "bg-blue-50/60 border-l-4 border-l-blue-400" },
  IN_PROGRESS: { badge: "bg-amber-100 text-amber-800 border-amber-300", row: "bg-amber-50/60 border-l-4 border-l-amber-400" },
  CONTRACTOR_DONE: { badge: "bg-cyan-100 text-cyan-700 border-cyan-300", row: "bg-cyan-50/60 border-l-4 border-l-cyan-400" },
  COMPLETED: { badge: "bg-emerald-100 text-emerald-700 border-emerald-300", row: "bg-emerald-50/60 border-l-4 border-l-emerald-500" },
  CANCELLED: { badge: "bg-slate-100 text-slate-500 border-slate-300", row: "bg-slate-50 border-l-4 border-l-slate-300 text-muted-foreground" },
};
const FALLBACK = { badge: "bg-slate-100 text-slate-700 border-slate-300", row: "border-l-4 border-l-transparent" };
export const statusBadgeClass = (status?: string | null) => (STATUS_STYLE[status ?? ""] ?? FALLBACK).badge;
export const statusRowClass = (status?: string | null) => (STATUS_STYLE[status ?? ""] ?? FALLBACK).row;
