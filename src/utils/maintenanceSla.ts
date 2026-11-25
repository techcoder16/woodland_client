// Client-side PREVIEW of the maintenance SLA. The server is the source of truth
// for dueAt / chaseUpAt; these rules mirror it so the Add Maintenance form can
// show the expected times before saving.
//
//   Critical  before 14:00 due +4h; from 14:00 due 17:30 the same day (never next day)
//   High      due 24 office hours  chase up 12 office hours
//   Medium    due 10 calendar days chase up 5 calendar days
//   Low       due 21 calendar days chase up 10 calendar days
//
// Office hours = 09:00-18:00 Monday-Friday, London time.

const LONDON = "Europe/London";
const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

type SlaRule = { unit: "office-hours" | "days"; due: number; chase: number };

export const PRIORITY_SLA: Record<string, SlaRule> = {
  Critical: { unit: "office-hours", due: 4, chase: 2 },
  High: { unit: "office-hours", due: 24, chase: 12 },
  Medium: { unit: "days", due: 10, chase: 5 },
  Low: { unit: "days", due: 21, chase: 10 },
};

const londonFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: LONDON,
  weekday: "short",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

interface LondonParts {
  weekday: string;
  hour: number;
  minute: number;
}

function londonParts(date: Date): LondonParts {
  const parts = londonFormatter.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    weekday: get("weekday"),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  };
}

const isOfficeMinute = (date: Date) => {
  const { weekday, hour, minute } = londonParts(date);
  if (weekday === "Sat" || weekday === "Sun") return false;
  const mins = hour * 60 + minute;
  return mins >= 9 * 60 && mins < 18 * 60;
};

/** Adds `hours` of office time (09:00-18:00 London, Mon-Fri) to `start`. */
export function addOfficeHours(start: Date, hours: number): Date {
  let remaining = hours * 60;
  let cursor = start.getTime();
  // Walk minute by minute, counting each minute that starts inside office hours.
  // A few thousand steps at most, even across weekends.
  let guard = 0;
  while (remaining > 0 && guard < 200_000) {
    if (isOfficeMinute(new Date(cursor))) remaining -= 1;
    cursor += MINUTE;
    guard += 1;
  }
  return new Date(cursor);
}

export interface SlaTimes {
  dueAt: Date;
  chaseUpAt: Date;
}

/** Due and chase-up times for a priority, counted from `from` (default now). Null if priority is unknown. */
export function computeSla(priority: string | null | undefined, from: Date = new Date()): SlaTimes | null {
  const rule = priority ? PRIORITY_SLA[priority] : undefined;
  if (!rule) return null;
  if (priority === "Critical") {
    // First office minute at or after `from`, then the same-day rule.
    let start = from.getTime();
    for (let i = 0; i < 200_000 && !isOfficeMinute(new Date(start)); i++) start += MINUTE;
    const { hour, minute } = londonParts(new Date(start));
    const minsNow = hour * 60 + minute;
    const toClose = (18 * 60 - minsNow) * MINUTE;
    const dueMs = minsNow < 14 * 60 ? start + Math.min(4 * 60 * MINUTE, toClose) : minsNow < 17 * 60 + 30 ? start + (17 * 60 + 30 - minsNow) * MINUTE : start + toClose;
    return { dueAt: new Date(dueMs), chaseUpAt: new Date(start + (dueMs - start) / 2) };
  }
  if (rule.unit === "days") {
    return {
      dueAt: new Date(from.getTime() + rule.due * DAY),
      chaseUpAt: new Date(from.getTime() + rule.chase * DAY),
    };
  }
  return {
    dueAt: addOfficeHours(from, rule.due),
    chaseUpAt: addOfficeHours(from, rule.chase),
  };
}

/** "Mon 23 Nov, 14:30" in London time. */
export function formatLondonDateTime(value?: string | Date | null): string {
  if (!value) return "-";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-GB", {
    timeZone: LONDON,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

/** "23 Nov 2026" in London time. */
export function formatLondonDate(value?: string | Date | null): string {
  if (!value) return "-";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", { timeZone: LONDON, day: "numeric", month: "short", year: "numeric" });
}

/** "14:30" in London time. */
export function formatLondonTime(value?: string | Date | null): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-GB", { timeZone: LONDON, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
}

/** Today's date in London as YYYY-MM-DD, offset by `days`. */
export function londonDateString(days = 0): string {
  const base = new Intl.DateTimeFormat("en-CA", { timeZone: LONDON, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const [y, m, d] = base.split("-").map(Number);
  const shifted = new Date(Date.UTC(y, m - 1, d + days));
  return shifted.toISOString().slice(0, 10);
}

/** Due date/time for a job: server dueAt, falling back to the legacy dueDate. */
export function jobDueValue(job: { dueAt?: string | null; dueDate?: string | null }): string | undefined {
  return job.dueAt || job.dueDate || undefined;
}

/** A job is overdue when the server says so, or its due time has passed while still open. */
export function isJobOverdue(job: { isOverdue?: boolean; status: string; dueAt?: string | null; dueDate?: string | null }): boolean {
  if (job.status === "COMPLETED" || job.status === "CANCELLED") return false;
  if (typeof job.isOverdue === "boolean") return job.isOverdue;
  const due = jobDueValue(job);
  if (!due) return false;
  const t = new Date(due).getTime();
  return !isNaN(t) && t < Date.now();
}
