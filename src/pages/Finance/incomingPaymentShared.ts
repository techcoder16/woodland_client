// Types and helpers shared by the Incoming Payments list and wizard.

export type PayerKind = "INDIVIDUAL" | "COMPANY" | "COUNCIL";

export type Allocation = {
  id: string;
  occupancyId: string;
  propertyId: string;
  period: string; // "YYYY-MM"
  amount: number;
  occupancy?: { id: string; reference: string; occupier?: { FirstName?: string; SureName?: string } };
  property?: { id: string; propertyNumber?: number; addressLine1?: string; postCode?: string };
};

export type IncomingPayment = {
  id: string;
  reference: string;
  payerKind: PayerKind;
  payerName: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  paymentReference?: string | null;
  notes?: string | null;
  createdByName?: string | null;
  allocations: Allocation[];
};

// One row of GET incoming-payments/occupancies — an occupancy the payer can
// allocate to, with the selected period's figures.
export type OccupancyOption = {
  id: string;
  reference: string;
  status: string;
  payerKind: PayerKind;
  payerName: string;
  tenantName: string;
  tenancyType: string;
  moveInDate: string;
  rateAmount: number;
  rateFrequency: "NIGHTLY" | "WEEKLY" | "MONTHLY";
  property: { id: string; propertyNumber?: number; addressLine1?: string; town?: string; postCode?: string };
  period: string;
  rentDue: number;
  previouslyReceived: number;
  outstanding: number;
};

export const PAYER_TABS: { value: "" | PayerKind; label: string }[] = [
  { value: "", label: "All Payments" },
  { value: "INDIVIDUAL", label: "Individual Payments" },
  { value: "COMPANY", label: "Company Payments" },
  { value: "COUNCIL", label: "Council Payments" },
];

export const RATE_SHORT: Record<string, string> = { NIGHTLY: "pn", WEEKLY: "pw", MONTHLY: "pcm" };

export const money = (value: unknown) =>
  `£${Number(value || 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const round2 = (value: number) => Math.round(value * 100) / 100;

export const currentPeriod = () => new Date().toISOString().slice(0, 7);

// "2026-10" → "October 2026"
export const formatPeriod = (period: string) => {
  const [year, month] = period.split("-").map(Number);
  if (!year || !month) return period;
  return new Date(year, month - 1, 1).toLocaleString("en-GB", { month: "long", year: "numeric" });
};
