// Occupancy tasks are still created and stored by the backend, but hidden
// from every screen for now. Flip to true to show them again.
export const SHOW_TASKS = false;

export type OccupancyType = "COUNCIL" | "PRIVATE";
export type OccupancyStatus = "PENDING" | "ACTIVE" | "ENDING" | "ENDED" | "CANCELLED";
export type RateFrequency = "NIGHTLY" | "WEEKLY" | "MONTHLY";

export interface StaffUser {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface PropertyOption {
  id: string;
  addressLine1?: string;
  addressLine2?: string;
  town?: string;
  postCode?: string;
  propertyTypeCategory?: string;
  bedrooms?: number;
  photographs?: string | null;
  vendor?: { firstName?: string; lastName?: string } | null;
  currentStatus?: "Vacant" | "Reserved" | "Occupied" | "Ending";
}

export interface Occupier {
  id: string;
  title?: string;
  FirstName?: string;
  SureName?: string;
  Email?: string;
  MobileNo?: string;
  dateOfBirth?: string;
  occupierType?: OccupancyType | null;
}

export interface CouncilCustomer {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  town?: string;
  postCode?: string;
  defaultTeam?: string;
  notes?: string;
  liveOccupancies?: number;
}

export interface AdditionalOccupier {
  name: string;
  dateOfBirth?: string;
  relationship?: string;
}

export interface OccupancyTask {
  id: string;
  title: string;
  isCompleted: boolean;
  completedAt?: string | null;
  completedByName?: string | null;
  dueDate?: string | null;
  priority: string;
  assignedTo?: StaffUser | null;
}

export interface Occupancy {
  id: string;
  reference: string;
  type: OccupancyType;
  status: OccupancyStatus;
  property: PropertyOption;
  propertyId: string;
  councilCustomer?: CouncilCustomer | null;
  councilContactName?: string;
  councilReference?: string;
  councilTeam?: string;
  privateCustomerKind?: "INDIVIDUAL" | "COMPANY" | null;
  customerTitle?: string;
  customerFirstName?: string;
  customerSurname?: string;
  customerCompanyName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddressLine1?: string;
  customerAddressLine2?: string;
  customerTown?: string;
  customerPostCode?: string;
  customerDocuments?: { fileUrl: string; fileName?: string }[];
  occupier: Occupier;
  additionalOccupiers?: AdditionalOccupier[];
  moveInDate: string;
  expectedMoveOutDate?: string | null;
  actualMoveOutDate?: string | null;
  rateAmount: number;
  rateFrequency: RateFrequency;
  bookingAssignedTo?: StaffUser | null;
  bookingDate?: string | null;
  bookingTime?: string | null;
  bookingNotes?: string | null;
  createdByName?: string;
  createdAt: string;
  tasks?: OccupancyTask[];
  activity?: { id: string; title: string; description: string; createdAt: string }[];
}

// ---- Enums, labels and categories come from the backend (GET occupancy/meta) ----

export interface Option {
  value: string;
  label: string;
  tone?: string;
}

export interface OccupancyMeta {
  types: (Option & { value: OccupancyType; longLabel: string; description: string; defaultRateFrequency: RateFrequency })[];
  statuses: (Option & { value: OccupancyStatus; description: string; actionLabel: string; next: OccupancyStatus[]; live: boolean })[];
  rateFrequencies: (Option & { value: RateFrequency; short: string; rateLabel: string })[];
  customerKinds: (Option & { value: "INDIVIDUAL" | "COMPANY" })[];
  taskPriorities: Option[];
  propertyStatuses: Option[];
  defaultTasks: string[];
  relationships: string[];
  titles: string[];
}

let metaCache: OccupancyMeta | null = null;
let metaPromise: Promise<OccupancyMeta | null> | null = null;

// Fetched once per page load and shared by every occupancy screen.
export function loadOccupancyMeta(fetcher: () => Promise<OccupancyMeta | null>) {
  if (metaCache) return Promise.resolve(metaCache);
  metaPromise ??= fetcher().then((m) => {
    metaCache = m;
    if (!m) metaPromise = null; // allow a retry after a failed load
    return m;
  });
  return metaPromise;
}
export const cachedOccupancyMeta = () => metaCache;

const find = <T extends Option>(list: T[] | undefined, value?: string | null) => list?.find((o) => o.value === value);

export const typeOf = (meta: OccupancyMeta | null, v?: string | null) => find(meta?.types, v);
export const statusOf = (meta: OccupancyMeta | null, v?: string | null) => find(meta?.statuses, v);
export const freqOf = (meta: OccupancyMeta | null, v?: string | null) => find(meta?.rateFrequencies, v);
export const label = (list: Option[] | undefined, v?: string | null) => find(list, v)?.label ?? v ?? "";

// Purely visual: maps the backend's semantic tone to theme classes.
export const TONE_BADGE: Record<string, string> = {
  green: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300",
  red: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  gray: "bg-muted text-muted-foreground",
};
export const TONE_OUTLINE: Record<string, string> = {
  blue: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30",
  gray: "bg-muted text-foreground border-border",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  red: "bg-red-50 text-red-700 border-red-200",
};
export const TONE_HEX: Record<string, string> = {
  green: "#16A34A",
  amber: "#F59E0B",
  blue: "#2563EB",
  red: "#DC2626",
  gray: "#9CA3AF",
};
export const toneBadge = (tone?: string) => TONE_BADGE[tone || "gray"] || TONE_BADGE.gray;
export const toneOutline = (tone?: string) => TONE_OUTLINE[tone || "gray"] || TONE_OUTLINE.gray;

export const money = (n?: number | null) =>
  n == null || isNaN(Number(n))
    ? "-"
    : `£${Number(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatRate = (meta: OccupancyMeta | null, amount?: number | null, freq?: RateFrequency) =>
  amount == null ? "-" : `${money(amount)} ${freqOf(meta, freq)?.short ?? ""}`.trim();

export const fmtDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-";

export const fullName = (p?: { FirstName?: string; SureName?: string; title?: string } | null, withTitle = false) =>
  [withTitle ? p?.title : null, p?.FirstName, p?.SureName].filter(Boolean).join(" ");

export const staffName = (u?: StaffUser | null) =>
  u ? [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email || "" : "";

export const addressLine = (p?: PropertyOption | null) => p?.addressLine1 || "Property";
export const addressSub = (p?: PropertyOption | null) => [p?.town, p?.postCode].filter(Boolean).join(", ");

export const payerName = (o: Occupancy) =>
  o.type === "COUNCIL"
    ? o.councilCustomer?.name || "-"
    : o.privateCustomerKind === "COMPANY"
      ? o.customerCompanyName || "-"
      : [o.customerFirstName, o.customerSurname].filter(Boolean).join(" ") || "-";

export const payerSub = (o: Occupancy) =>
  o.type === "PRIVATE" ? (o.privateCustomerKind === "COMPANY" ? "(Company)" : "(Individual)") : "";

// Whole nights between two dates (UTC-safe), or null if either is missing.
export const nightsBetween = (from?: string, to?: string | null) => {
  if (!from || !to) return null;
  const ms = new Date(to).setHours(0, 0, 0, 0) - new Date(from).setHours(0, 0, 0, 0);
  return ms > 0 ? Math.round(ms / 86400000) : null;
};

export const estimatedIncome = (rate: number, freq: RateFrequency, from?: string, to?: string | null) => {
  const nights = nightsBetween(from, to);
  if (nights == null || !rate) return null;
  if (freq === "NIGHTLY") return rate * nights;
  if (freq === "WEEKLY") return (rate / 7) * nights;
  return ((rate * 12) / 365) * nights;
};

// Server paths for uploads live outside /api; derive the origin from the API base.
export const fileUrl = (path: string) => {
  const api = (import.meta.env.VITE_API_URL as string) || "";
  try {
    return new URL(path, new URL(api).origin).toString();
  } catch {
    return path;
  }
};
