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
