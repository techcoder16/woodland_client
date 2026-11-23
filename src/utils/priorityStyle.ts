/** One colour per maintenance priority, used everywhere a priority is shown. */
export const PRIORITY_BADGE: Record<string, string> = {
  Critical: "bg-red-100 text-red-700 border-red-300",
  High: "bg-orange-100 text-orange-700 border-orange-300",
  Medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Low: "bg-pink-100 text-pink-700 border-pink-300",
};

/** Soft row tint + left bar per priority (chase-up and jobs tables). */
export const PRIORITY_ROW: Record<string, string> = {
  Critical: "bg-red-50/70 border-l-4 border-l-red-500",
  High: "bg-orange-50/70 border-l-4 border-l-orange-500",
  Medium: "bg-yellow-50/70 border-l-4 border-l-yellow-500",
  Low: "bg-pink-50/70 border-l-4 border-l-pink-400",
};

const matchPriority = (priority?: string | null) => {
  if (!priority) return undefined;
  return Object.keys(PRIORITY_BADGE).find((k) => k.toLowerCase() === priority.toLowerCase());
};

export function priorityBadgeClass(priority?: string | null): string {
  if (!priority) return "";
  const key = matchPriority(priority);
  return key ? PRIORITY_BADGE[key] : "bg-slate-100 text-slate-700 border-slate-300";
}

export function priorityRowClass(priority?: string | null): string {
  const key = matchPriority(priority);
  return key ? PRIORITY_ROW[key] : "border-l-4 border-l-transparent";
}

/** Text colour for a due date/time: the priority colour, or red when overdue. */
export function priorityTextClass(priority?: string | null, overdue?: boolean): string {
  if (overdue) return "text-red-600 font-semibold";
  switch (matchPriority(priority)) {
    case "Critical": return "text-red-700 font-medium";
    case "High": return "text-orange-700 font-medium";
    case "Medium": return "text-yellow-800 font-medium";
    case "Low": return "text-pink-700 font-medium";
    default: return "";
  }
}

/** One colour per job status: a badge, and a soft tint + left bar for the whole table row. */
export const STATUS_STYLE: Record<string, { badge: string; row: string }> = {
  OPEN: { badge: "bg-sky-100 text-sky-700 border-sky-300", row: "bg-sky-50/60 border-l-4 border-l-sky-400" },
  WAITING_AUTHORIZATION: { badge: "bg-violet-100 text-violet-700 border-violet-300", row: "bg-violet-50/60 border-l-4 border-l-violet-400" },
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
