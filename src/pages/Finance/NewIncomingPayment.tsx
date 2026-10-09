import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Building2, Check, CheckCircle2, Download, Layers, Loader2, Plus, Search, User } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { get, post } from "@/helper/api";
import { formatPropertyReference } from "@/utils/propertyReference";
import { exportIncomingPaymentToPdf } from "@/utils/incomingPaymentExport";
import { currentPeriod, formatPeriod, IncomingPayment, money, OccupancyOption, PayerKind, RATE_SHORT, round2 } from "./incomingPaymentShared";

// Individual: pick the occupancy → this month's rent + the payment → review.
// Bulk: enter the payment → allocate it across occupancies → review.
const STEPS: Record<PayerKind, readonly string[]> = {
  INDIVIDUAL: ["Select Occupancy", "Payment Details", "Review & Confirm"],
  BULK: ["Payment Details", "Allocate to Properties", "Review & Confirm"],
};

const TYPE_CARDS: { kind: PayerKind; title: string; description: string; icon: typeof User }[] = [
  { kind: "INDIVIDUAL", title: "Individual Payment", description: "Payment for one occupancy — shows this month's rent due, received and outstanding", icon: User },
  { kind: "BULK", title: "Bulk Payment", description: "One payment (e.g. from a company or council) allocated across several properties", icon: Layers },
];

const DEFAULT_METHODS = ["Bank Transfer", "Card", "Cash", "Cheque", "Standing Order", "Direct Debit"];

const emptyPayment = () => ({
  payerName: "",
  paymentDate: new Date().toISOString().slice(0, 10),
  amount: "",
  paymentMethod: "Bank Transfer",
  paymentReference: "",
  notes: "",
});
type PaymentForm = ReturnType<typeof emptyPayment>;

function Detail({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4 py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className={`text-right ${strong ? "font-semibold" : "font-medium"}`}>{value}</span>
    </div>
  );
}

// Occupancies for a period, optionally searched — the individual picker and
// the bulk allocation table both read this.
function useOccupancyOptions(enabled: boolean, period: string, search: string) {
  const [options, setOptions] = useState<OccupancyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ period, search: search.trim() });
      get<OccupancyOption[]>(`incoming-payments/occupancies?${params}`).then(({ data, error: err }) => {
        if (cancelled) return;
        setLoading(false);
        setError(err?.message || "");
        setOptions(Array.isArray(data) ? data : []);
      });
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [enabled, period, search]);
  return { options, loading, error };
}

export default function NewIncomingPayment() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<IncomingPayment | null>(null);
  const [methods, setMethods] = useState<string[]>(DEFAULT_METHODS);

  const [kind, setKind] = useState<PayerKind>("INDIVIDUAL");
  const isBulk = kind === "BULK";
  const steps = STEPS[kind];
  const [period, setPeriod] = useState(currentPeriod());
  const [payment, setPayment] = useState<PaymentForm>(emptyPayment());
  const updatePayment = (key: keyof PaymentForm, value: string) => setPayment((p) => ({ ...p, [key]: value }));

  // Individual
  const [occSearch, setOccSearch] = useState("");
  const [occupancy, setOccupancy] = useState<OccupancyOption | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const individual = useOccupancyOptions(!isBulk, period, occSearch);

  // Bulk
  const [bulkSearch, setBulkSearch] = useState("");
  const bulk = useOccupancyOptions(isBulk && step === 1, period, bulkSearch);
  const [allocations, setAllocations] = useState<Record<string, string>>({});
  // Ticked rows are kept even when the search hides them.
  const [ticked, setTicked] = useState<Record<string, OccupancyOption>>({});

  useEffect(() => {
    get<{ paymentMethods: string[] }>("incoming-payments/meta").then(({ data }) => {
      if (data?.paymentMethods?.length) setMethods(data.paymentMethods);
    });
  }, []);

  const chooseKind = (next: PayerKind) => {
    setKind(next);
    setOccupancy(null);
    setAllocations({});
    setTicked({});
  };

  // Keep the selected occupancy's figures in step with the period.
  useEffect(() => {
    if (!occupancy) return;
    const fresh = individual.options.find((o) => o.id === occupancy.id);
    if (fresh && fresh.period !== occupancy.period) setOccupancy(fresh);
  }, [individual.options, occupancy]);
  useEffect(() => {
    if (!occupancy || occupancy.period === period) return;
    const params = new URLSearchParams({ period, search: occupancy.reference });
    get<OccupancyOption[]>(`incoming-payments/occupancies?${params}`).then(({ data }) => {
      const fresh = data?.find((o) => o.id === occupancy.id);
      if (fresh) setOccupancy(fresh);
    });
  }, [period, occupancy]);

  // Property photo for the one occupancy being shown.
  useEffect(() => {
    setPhoto(null);
    if (!occupancy) return;
    let cancelled = false;
    get<any>(`occupancy/${occupancy.id}`).then(({ data }) => {
      const src = data?.property?.photographs;
      if (!cancelled && typeof src === "string" && src && !src.startsWith("data:application/pdf")) setPhoto(src);
    });
    return () => { cancelled = true; };
  }, [occupancy?.id]);

  // Refresh ticked rows with the latest figures.
  useEffect(() => {
    setTicked((rows) => {
      const next = { ...rows };
      for (const o of bulk.options) if (next[o.id]) next[o.id] = o;
      return next;
    });
  }, [bulk.options]);
  // Only occupancies with rent to collect this period (or ticked ones) — an
  // occupancy that ended, or hasn't started, has nothing to allocate to.
  const tableRows = useMemo(() => {
    const listed = new Set(bulk.options.map((o) => o.id));
    const owing = bulk.options.filter((o) => o.id in ticked || o.rentDue > 0 || o.outstanding !== 0);
    return [...Object.values(ticked).filter((o) => !listed.has(o.id)), ...owing];
  }, [bulk.options, ticked]);
  const balanceAfter = (o: OccupancyOption) => round2(o.outstanding - Number(allocations[o.id] || 0));

  const amountReceived = round2(Number(payment.amount || 0));
  const totalAllocated = round2(Object.values(allocations).reduce((sum, v) => sum + Number(v || 0), 0));
  const remaining = round2(amountReceived - totalAllocated);

  const toggleRow = (o: OccupancyOption, checked: boolean) => {
    if (checked) {
      // Default to what's outstanding, capped at what's left of the payment.
      const left = Math.max(0, remaining);
      const suggested = round2(Math.min(Math.max(o.outstanding, 0), left));
      setAllocations((a) => ({ ...a, [o.id]: suggested ? String(suggested) : "" }));
      setTicked((rows) => ({ ...rows, [o.id]: o }));
    } else {
      setAllocations(({ [o.id]: _removed, ...rest }) => rest);
      setTicked(({ [o.id]: _removed, ...rest }) => rest);
    }
  };

  // Allocations were sized for the old period, so a new period starts over.
  const changePeriod = (value: string) => {
    if (!value) return;
    setPeriod(value);
    setAllocations({});
    setTicked({});
  };

  const allocationList = isBulk
    ? Object.entries(allocations)
        .map(([occupancyId, value]) => ({ occupancyId, period, amount: round2(Number(value || 0)) }))
        .filter((a) => a.amount > 0)
    : occupancy ? [{ occupancyId: occupancy.id, period, amount: amountReceived }] : [];

  const paymentValid = () => {
    if (!payment.paymentDate) { toast({ title: "Enter the payment date", variant: "destructive" }); return false; }
    if (amountReceived <= 0) { toast({ title: "Enter the amount received", variant: "destructive" }); return false; }
    if (!payment.paymentMethod) { toast({ title: "Select the payment method", variant: "destructive" }); return false; }
    return true;
  };

  const next = () => {
    if (step === 0) {
      if (!isBulk) {
        if (!occupancy) return toast({ title: "Select the occupancy", variant: "destructive" });
        if (!payment.amount && occupancy.outstanding > 0) updatePayment("amount", String(occupancy.outstanding));
      } else if (!paymentValid()) return;
      setStep(1);
      return;
    }
    if (step === 1) {
      if (!isBulk) {
        if (!paymentValid()) return;
      } else {
        if (!allocationList.length) return toast({ title: "Allocate the payment to at least one occupancy", variant: "destructive" });
        if (Math.abs(remaining) > 0.005) {
          return toast({
            title: remaining > 0 ? `${money(remaining)} still to allocate` : `Allocated ${money(-remaining)} more than received`,
            description: "Total allocated must equal the amount received.",
            variant: "destructive",
          });
        }
      }
      setStep(2);
    }
  };

  const confirm = async () => {
    setSaving(true);
    const { data, error } = await post<IncomingPayment>("incoming-payments", {
      payerKind: kind,
      payerName: isBulk ? payment.payerName || undefined : undefined,
      paymentDate: payment.paymentDate,
      amount: amountReceived,
      paymentMethod: payment.paymentMethod,
      paymentReference: payment.paymentReference || undefined,
      notes: payment.notes || undefined,
      allocations: allocationList,
    });
    setSaving(false);
    if (error || !data) {
      toast({ title: "Could not record payment", description: error?.message || "Please try again.", variant: "destructive" });
      return;
    }
    setCreated(data);
    setStep(3);
  };

  const reset = () => {
    setStep(0);
    setCreated(null);
    setPayment(emptyPayment());
    setOccupancy(null);
    setOccSearch("");
    setBulkSearch("");
    setAllocations({});
    setTicked({});
    setPeriod(currentPeriod());
  };

  const photoBox = (className: string) => (
    <div className={`overflow-hidden rounded-md bg-muted ${className}`}>
      {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Building2 className="h-8 w-8 text-muted-foreground" /></div>}
    </div>
  );

  const paymentFields = (
    <div className="space-y-3">
      {isBulk && (
        <div className="space-y-1">
          <Label>Received From</Label>
          <Input value={payment.payerName} onChange={(e) => updatePayment("payerName", e.target.value)} placeholder="e.g. ABC Housing Ltd, Newham Council" />
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1"><Label>Payment Date *</Label><Input type="date" value={payment.paymentDate} onChange={(e) => updatePayment("paymentDate", e.target.value)} /></div>
        <div className="space-y-1"><Label>Amount Received (£) *</Label><Input type="number" min="0" step="0.01" value={payment.amount} onChange={(e) => updatePayment("amount", e.target.value)} /></div>
        <div className="space-y-1">
          <Label>Payment Method *</Label>
          <Select value={payment.paymentMethod} onValueChange={(v) => updatePayment("paymentMethod", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{methods.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label>Payment Reference</Label><Input value={payment.paymentReference} onChange={(e) => updatePayment("paymentReference", e.target.value)} placeholder="Bank reference" /></div>
      </div>
      <div className="space-y-1">
        <Label>Notes (Optional)</Label>
        <Textarea maxLength={500} value={payment.notes} onChange={(e) => updatePayment("notes", e.target.value)} placeholder="Add any notes about this payment…" />
        <p className="text-right text-xs text-muted-foreground">{payment.notes.length}/500</p>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1400px] space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Finance / Incoming Payments / New Payment</p>
            <h1 className="text-2xl font-semibold tracking-tight">New Incoming Payment</h1>
            <p className="text-sm text-muted-foreground">Record a payment for one occupancy, or a bulk payment split across properties.</p>
          </div>
          {step < 3 && (
            <div className="flex gap-2">
              {step === 0
                ? <Button variant="outline" onClick={() => navigate("/finance/incoming-payments")}>Cancel</Button>
                : <Button variant="outline" onClick={() => setStep(step - 1)} disabled={saving}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>}
              {step < 2
                ? <Button onClick={next}>Next: {steps[step + 1]}<ArrowRight className="ml-2 h-4 w-4" /></Button>
                : <Button onClick={() => void confirm()} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirm Payment</Button>}
            </div>
          )}
        </div>

        {step < 3 && (
          <div className="surface flex items-center gap-2 px-6 py-4">
            {steps.map((label, index) => (
              <div key={label} className="flex flex-1 items-center gap-2">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${index < step ? "bg-emerald-600 text-white" : index === step ? "bg-primary text-primary-foreground" : "border text-muted-foreground"}`}>
                  {index < step ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <span className={`text-sm ${index === step ? "font-medium" : "text-muted-foreground"}`}>{label}</span>
                {index < steps.length - 1 && <span className={`mx-2 h-px flex-1 ${index < step ? "bg-emerald-600" : "bg-border"}`} />}
              </div>
            ))}
          </div>
        )}

        {/* ---- Step 1 ---- */}
        {step === 0 && (
          <div className="surface space-y-5 p-6">
            <div className="grid gap-3 md:grid-cols-2">
              {TYPE_CARDS.map(({ kind: k, title, description, icon: Icon }) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => chooseKind(k)}
                  className={`flex gap-3 rounded-lg border p-4 text-left transition ${kind === k ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/40"}`}
                >
                  <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${kind === k ? "border-primary" : ""}`}>
                    {kind === k && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </span>
                  <span>
                    <span className={`flex items-center gap-1.5 font-medium ${kind === k ? "text-primary" : ""}`}><Icon className="h-4 w-4" />{title}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{description}</span>
                  </span>
                </button>
              ))}
            </div>

            {!isBulk ? (
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
                <div className="space-y-2">
                  <Label>Search Occupancy *</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-8" placeholder="Tenant, property, council, company or OCC ref" value={occSearch} onChange={(e) => setOccSearch(e.target.value)} />
                  </div>
                  <div className="max-h-96 overflow-y-auto rounded-lg border">
                    {individual.options.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setOccupancy(o)}
                        className={`flex w-full items-center justify-between gap-2 border-b px-3 py-2 text-left text-sm last:border-0 ${occupancy?.id === o.id ? "bg-primary/10" : "hover:bg-muted/40"}`}
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{o.tenantName}</span>
                          <span className="block truncate text-xs text-muted-foreground">{o.property.addressLine1} · {o.reference} · {o.tenancyType}</span>
                        </span>
                        <span className="shrink-0 text-right text-xs">
                          <span className="block font-medium">{money(o.outstanding)}</span>
                          <span className="text-muted-foreground">due {formatPeriod(period).split(" ")[0]}</span>
                          {o.arrears > 0 && <span className="block text-destructive">+{money(o.arrears)} arrears</span>}
                        </span>
                      </button>
                    ))}
                    {!individual.options.length && (
                      <div className="space-y-2 p-4 text-center text-sm text-muted-foreground">
                        {individual.loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                          : individual.error ? <p className="text-destructive">Could not load occupancies: {individual.error}</p>
                          : occSearch.trim() ? <p>No occupancy matches “{occSearch.trim()}”.</p>
                          : (
                            <>
                              <p>No occupancies yet. Payments are recorded against an occupancy (the tenant, property and rent), so create one first.</p>
                              <Button size="sm" variant="outline" onClick={() => navigate("/occupancy/new")}><Plus className="mr-1.5 h-3.5 w-3.5" />New Occupancy</Button>
                            </>
                          )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="mb-3 font-semibold">Occupancy Details</h3>
                  {occupancy ? (
                    <div className="flex flex-col gap-4 sm:flex-row">
                      {photoBox("h-32 w-full shrink-0 sm:w-44")}
                      <div className="flex-1 text-sm">
                        <Detail label="Property" value={[occupancy.property.addressLine1, occupancy.property.town, occupancy.property.postCode].filter(Boolean).join(", ")} />
                        <Detail label="Occupancy Ref" value={occupancy.reference} />
                        <Detail label="Tenant" value={occupancy.tenantName} />
                        <Detail label="Paid By" value={occupancy.tenancyType === "Private" ? occupancy.payerName : occupancy.tenancyType} />
                        <Detail label="Tenancy Start" value={new Date(occupancy.moveInDate).toLocaleDateString("en-GB")} />
                        <Detail label="Rent" value={`${money(occupancy.rateAmount)} ${RATE_SHORT[occupancy.rateFrequency]}`} strong />
                      </div>
                    </div>
                  ) : <p className="text-sm text-muted-foreground">Select an occupancy to see its details.</p>}
                </div>
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                <div>
                  <h3 className="mb-3 flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Bulk Payment Details</h3>
                  {paymentFields}
                </div>
                <div className="h-fit rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
                  Enter the payment as it arrived in the bank. On the next step you'll see every property with its occupancy and this month's rent, and split the amount across them until nothing is left to allocate.
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---- Step 2 (individual): this month + payment ---- */}
        {step === 1 && !isBulk && occupancy && (
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="surface p-5 text-sm">
              <h3 className="mb-3 flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Occupancy Summary</h3>
              {photoBox("mb-3 h-28")}
              <Detail label="Property" value={occupancy.property.addressLine1} />
              <Detail label="Occupancy Ref" value={occupancy.reference} />
              <Detail label="Tenant" value={occupancy.tenantName} />
              <Detail label="Paid By" value={occupancy.tenancyType === "Private" ? occupancy.payerName : occupancy.tenancyType} />
              <Detail label="Rent" value={`${money(occupancy.rateAmount)} ${RATE_SHORT[occupancy.rateFrequency]}`} strong />
            </div>
            <div className="surface space-y-3 p-5 text-sm">
              <h3 className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Rent Period Information</h3>
              <div className="space-y-1"><Label>Rent Period</Label><Input type="month" value={period} onChange={(e) => changePeriod(e.target.value)} /></div>
              <div><p className="text-muted-foreground">Rent Due ({formatPeriod(period)})</p><p className="text-base font-semibold">{money(occupancy.rentDue)}</p></div>
              <div><p className="text-muted-foreground">Previously Received</p><p className="text-base font-semibold">{money(occupancy.previouslyReceived)}</p></div>
              <div><p className="text-muted-foreground">Outstanding</p><p className={`text-base font-semibold ${occupancy.outstanding > 0 ? "text-amber-700" : "text-emerald-700"}`}>{money(occupancy.outstanding)}</p></div>
              <div>
                <p className="text-muted-foreground">Balance After This Payment</p>
                <p className={`text-base font-semibold ${occupancy.outstanding - amountReceived > 0.005 ? "text-amber-700" : "text-emerald-700"}`}>
                  {occupancy.outstanding - amountReceived < -0.005 ? `${money(amountReceived - occupancy.outstanding)} credit` : money(Math.max(round2(occupancy.outstanding - amountReceived), 0))}
                </p>
              </div>
              {occupancy.arrears > 0 && (
                <p className="rounded-md bg-red-50 p-2 text-xs text-red-700">
                  {money(occupancy.arrears)} unpaid from earlier months. Change the rent period to that month to pay it off.
                </p>
              )}
            </div>
            <div className="surface p-5">
              <h3 className="mb-3 flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Payment Details</h3>
              {paymentFields}
            </div>
          </div>
        )}

        {/* ---- Step 2 (bulk): allocate across occupancies ---- */}
        {step === 1 && isBulk && (
          <div className="surface space-y-3 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Allocate to Properties</h3>
                <p className="text-xs text-muted-foreground">Tick the occupancies this payment covers. You can allocate full or partial amounts.</p>
              </div>
              <div className="text-right text-sm">
                <p className="text-muted-foreground">{payment.payerName || "Bulk payment"} · {new Date(payment.paymentDate).toLocaleDateString("en-GB")}</p>
                <p className="font-semibold">{money(amountReceived)} received</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative min-w-[14rem] flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8" placeholder="Search by property, occupancy, tenant, council or company…" value={bulkSearch} onChange={(e) => setBulkSearch(e.target.value)} />
              </div>
              <Input className="w-44" type="month" value={period} onChange={(e) => changePeriod(e.target.value)} />
            </div>
            <div className="max-h-[28rem] overflow-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="w-8 px-3 py-2" />
                    <th className="px-3 py-2 font-medium">Property</th>
                    <th className="px-3 py-2 font-medium">Occupancy</th>
                    <th className="px-3 py-2 font-medium">Tenant</th>
                    <th className="px-3 py-2 font-medium">Paid By</th>
                    <th className="px-3 py-2 text-right font-medium">Rent Due</th>
                    <th className="px-3 py-2 text-right font-medium">Prev. Received</th>
                    <th className="px-3 py-2 text-right font-medium">Outstanding</th>
                    <th className="px-3 py-2 text-right font-medium">Allocate (£)</th>
                    <th className="px-3 py-2 text-right font-medium" title="Still unpaid for this month once this payment is saved">Balance After</th>
                    <th className="px-3 py-2 text-right font-medium" title="Unpaid from earlier months">Arrears</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((o) => {
                    const checked = o.id in allocations;
                    return (
                      <tr key={o.id} className={`border-t ${checked ? "bg-primary/5" : ""}`}>
                        <td className="px-3 py-2"><input type="checkbox" className="h-4 w-4 accent-[hsl(var(--primary))]" checked={checked} onChange={(e) => toggleRow(o, e.target.checked)} /></td>
                        <td className="px-3 py-2">{formatPropertyReference(o.property.propertyNumber)} · {o.property.addressLine1}</td>
                        <td className="px-3 py-2 font-mono text-xs">{o.reference}</td>
                        <td className="px-3 py-2">{o.tenantName}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{o.tenancyType === "Private" ? "Tenant" : o.tenancyType}</td>
                        <td className="px-3 py-2 text-right">{money(o.rentDue)}</td>
                        <td className="px-3 py-2 text-right">{money(o.previouslyReceived)}</td>
                        <td className={`px-3 py-2 text-right ${o.outstanding > 0 ? "text-amber-700" : ""}`}>{money(o.outstanding)}</td>
                        <td className="px-3 py-2 text-right">
                          <Input
                            className="ml-auto h-8 w-28 text-right"
                            type="number"
                            min="0"
                            step="0.01"
                            disabled={!checked}
                            value={allocations[o.id] ?? ""}
                            onChange={(e) => setAllocations((a) => ({ ...a, [o.id]: e.target.value }))}
                          />
                        </td>
                        <td className={`px-3 py-2 text-right font-medium ${!checked ? "text-muted-foreground" : balanceAfter(o) > 0 ? "text-amber-700" : balanceAfter(o) < 0 ? "text-blue-700" : "text-emerald-700"}`}>
                          {checked ? (balanceAfter(o) < 0 ? `${money(-balanceAfter(o))} credit` : money(balanceAfter(o))) : "-"}
                        </td>
                        <td className={`px-3 py-2 text-right ${o.arrears > 0 ? "text-destructive" : "text-muted-foreground"}`}>{money(o.arrears)}</td>
                      </tr>
                    );
                  })}
                  {!tableRows.length && (
                    <tr><td colSpan={11} className="px-3 py-8 text-center text-muted-foreground">
                      {bulk.loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : bulk.error ? <span className="text-destructive">{bulk.error}</span> : "No occupancies found."}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 rounded-lg bg-primary/5 p-4 sm:grid-cols-3">
              <div><p className="text-xs text-muted-foreground">Payment Received</p><p className="text-lg font-semibold">{money(amountReceived)}</p></div>
              <div><p className="text-xs text-muted-foreground">Total Allocated</p><p className="text-lg font-semibold">{money(totalAllocated)}</p></div>
              <div>
                <p className="text-xs text-muted-foreground">Remaining to Allocate</p>
                <p className={`text-lg font-semibold ${Math.abs(remaining) < 0.005 ? "text-emerald-700" : "text-destructive"}`}>{money(remaining)}</p>
              </div>
            </div>
          </div>
        )}

        {/* ---- Step 3: review ---- */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="surface p-5 text-sm">
                <h3 className="mb-3 font-semibold">Payment Summary</h3>
                {isBulk ? (
                  <>
                    <Detail label="Received From" value={payment.payerName || "-"} />
                    <Detail label="Payment Date" value={new Date(payment.paymentDate).toLocaleDateString("en-GB")} />
                    <Detail label="Amount Received" value={money(amountReceived)} />
                    <Detail label="Payment Method" value={payment.paymentMethod} />
                    <Detail label="Payment Reference" value={payment.paymentReference || "-"} />
                    <Detail label="Notes" value={payment.notes || "-"} />
                    <div className="mt-2 rounded-md bg-emerald-50 p-2">
                      <Detail label="Total Allocated" value={money(totalAllocated)} strong />
                      <Detail label="Remaining to Allocate" value={money(remaining)} strong />
                    </div>
                  </>
                ) : occupancy && (
                  <>
                    <Detail label="Tenant" value={occupancy.tenantName} />
                    <Detail label="Property" value={occupancy.property.addressLine1} />
                    <Detail label="Occupancy Ref" value={occupancy.reference} />
                    <Detail label="Period" value={formatPeriod(period)} />
                    <Detail label="Rent Due" value={money(occupancy.rentDue)} />
                    <Detail label="Previously Received" value={money(occupancy.previouslyReceived)} />
                    <Detail label="Outstanding (before payment)" value={money(occupancy.outstanding)} />
                    <div className="mt-2 rounded-md bg-emerald-50 p-2">
                      <Detail label="Amount Received" value={money(amountReceived)} strong />
                      <Detail label="New Outstanding" value={money(round2(occupancy.outstanding - amountReceived))} strong />
                    </div>
                  </>
                )}
              </div>
              {isBulk ? (
                <div className="surface p-5 text-sm">
                  <h3 className="mb-3 font-semibold">Allocations ({allocationList.length} items)</h3>
                  <table className="w-full">
                    <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-1.5 font-medium">Property</th><th className="py-1.5 font-medium">Occupancy</th><th className="py-1.5 font-medium">Period</th><th className="py-1.5 text-right font-medium">Amount</th></tr></thead>
                    <tbody>
                      {allocationList.map((a) => {
                        const row = ticked[a.occupancyId];
                        return (
                          <tr key={a.occupancyId} className="border-t">
                            <td className="py-1.5">{formatPropertyReference(row?.property.propertyNumber)} · {row?.property.addressLine1}</td>
                            <td className="py-1.5 font-mono text-xs">{row?.reference}</td>
                            <td className="py-1.5">{formatPeriod(a.period)}</td>
                            <td className="py-1.5 text-right font-medium">{money(a.amount)}</td>
                          </tr>
                        );
                      })}
                      <tr className="border-t font-semibold"><td colSpan={3} className="py-1.5 text-right">Total</td><td className="py-1.5 text-right">{money(totalAllocated)}</td></tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="surface p-5 text-sm">
                  <h3 className="mb-3 font-semibold">Payment Details</h3>
                  <Detail label="Payment Date" value={new Date(payment.paymentDate).toLocaleDateString("en-GB")} />
                  <Detail label="Payment Method" value={payment.paymentMethod} />
                  <Detail label="Payment Reference" value={payment.paymentReference || "-"} />
                  <Detail label="Notes" value={payment.notes || "-"} />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              Once confirmed, this payment{isBulk ? " and its allocations" : ""} will be recorded and the occupancy financials will be updated.
            </div>
          </div>
        )}

        {/* ---- Done ---- */}
        {step === 3 && created && (
          <div className="surface mx-auto max-w-lg space-y-4 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><Check className="h-6 w-6" /></div>
            <h2 className="text-lg font-semibold">Payment recorded</h2>
            <p className="text-sm text-muted-foreground">Reference <span className="font-mono font-medium text-foreground">{created.reference}</span></p>
            <p className="text-sm text-muted-foreground">{money(created.amount)} from {created.payerName}, allocated to {created.allocations.length} occupanc{created.allocations.length === 1 ? "y" : "ies"}.</p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <Button variant="outline" onClick={() => exportIncomingPaymentToPdf(created)}><Download className="mr-2 h-4 w-4" />Download PDF</Button>
              <Button variant="outline" onClick={reset}>Record another payment</Button>
              <Button onClick={() => navigate("/finance/incoming-payments")}>View all payments</Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
