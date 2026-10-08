import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Building2, Check, CheckCircle2, Download, Landmark, Loader2, Plus, Search, User } from "lucide-react";
import { exportIncomingPaymentToPdf } from "@/utils/incomingPaymentExport";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { get, post } from "@/helper/api";
import { formatPropertyReference } from "@/utils/propertyReference";
import { currentPeriod, formatPeriod, IncomingPayment, money, OccupancyOption, PayerKind, RATE_SHORT, round2 } from "./incomingPaymentShared";

const STEPS = ["Select Payer / Occupancy", "Payment Details", "Review & Confirm"] as const;

const PAYER_CARDS: { kind: PayerKind; title: string; description: string; icon: typeof User }[] = [
  { kind: "INDIVIDUAL", title: "Individual Tenant Payment", description: "Record a payment for a single tenant / occupancy", icon: User },
  { kind: "COMPANY", title: "Company Payment (Bulk)", description: "Record a bulk payment from a company and allocate to multiple properties", icon: Building2 },
  { kind: "COUNCIL", title: "Council Payment (Bulk)", description: "Record a bulk payment from a council and allocate to multiple properties", icon: Landmark },
];

const DEFAULT_METHODS = ["Bank Transfer", "Card", "Cash", "Cheque", "Standing Order", "Direct Debit"];

const emptyPayment = () => ({
  paymentDate: new Date().toISOString().slice(0, 10),
  amount: "",
  paymentMethod: "Bank Transfer",
  paymentReference: "",
  notes: "",
});

function Detail({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4 py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className={`text-right ${strong ? "font-semibold" : "font-medium"}`}>{value}</span>
    </div>
  );
}

export default function NewIncomingPayment() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<IncomingPayment | null>(null);
  const [methods, setMethods] = useState<string[]>(DEFAULT_METHODS);

  const [payerKind, setPayerKind] = useState<PayerKind>("INDIVIDUAL");
  const isBulk = payerKind !== "INDIVIDUAL";
  const [period, setPeriod] = useState(currentPeriod());
  const [payment, setPayment] = useState(emptyPayment());
  const updatePayment = (key: keyof ReturnType<typeof emptyPayment>, value: string) => setPayment((p) => ({ ...p, [key]: value }));

  // ---- Individual: pick one occupancy ----
  const [occSearch, setOccSearch] = useState("");
  const [occOptions, setOccOptions] = useState<OccupancyOption[]>([]);
  const [occupancy, setOccupancy] = useState<OccupancyOption | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);

  // ---- Bulk: pick a company/council, then allocate across its occupancies ----
  const [payers, setPayers] = useState<{ id: string; name: string }[]>([]);
  const [payerId, setPayerId] = useState("");
  const [bulkSearch, setBulkSearch] = useState("");
  const [bulkOptions, setBulkOptions] = useState<OccupancyOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [allocations, setAllocations] = useState<Record<string, string>>({});

  useEffect(() => {
    get<{ paymentMethods: string[] }>("incoming-payments/meta").then(({ data }) => {
      if (data?.paymentMethods?.length) setMethods(data.paymentMethods);
    });
  }, []);

  // Switching payer type starts the selection over.
  const choosePayerKind = (kind: PayerKind) => {
    setPayerKind(kind);
    setOccupancy(null);
    setPayerId("");
    setAllocations({});
    setBulkOptions([]);
  };

  // Individual occupancy search (debounced). Errors are shown in the list
  // rather than swallowed, so an empty list always means "nothing matched".
  const [occLoading, setOccLoading] = useState(false);
  const [occError, setOccError] = useState("");
  useEffect(() => {
    if (payerKind !== "INDIVIDUAL") return;
    let cancelled = false;
    setOccLoading(true);
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ payerKind: "INDIVIDUAL", period, search: occSearch.trim() });
      get<OccupancyOption[]>(`incoming-payments/occupancies?${params}`).then(({ data, error }) => {
        if (cancelled) return;
        setOccLoading(false);
        setOccError(error?.message || "");
        setOccOptions(Array.isArray(data) ? data : []);
      });
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [payerKind, occSearch, period]);

  // Re-read the chosen occupancy's figures when the rent period changes.
  useEffect(() => {
    if (!occupancy || occupancy.period === period) return;
    const params = new URLSearchParams({ payerKind: "INDIVIDUAL", period, search: occupancy.reference });
    get<OccupancyOption[]>(`incoming-payments/occupancies?${params}`).then(({ data }) => {
      const fresh = data?.find((o) => o.id === occupancy.id);
      if (fresh) setOccupancy(fresh);
    });
  }, [period, occupancy]);

  // The property photo, for the one occupancy being shown.
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

  // Company / council list for the bulk payer picker.
  useEffect(() => {
    if (!isBulk) return;
    setPayers([]);
    get<{ id: string; name: string }[]>(`incoming-payments/payers?kind=${payerKind}`).then(({ data }) => {
      if (Array.isArray(data)) setPayers(data);
    });
  }, [payerKind, isBulk]);
  const payerName = payers.find((p) => p.id === payerId)?.name || "";

  // The payer's occupancies for the period, for the allocation table.
  useEffect(() => {
    if (!isBulk || !payerId) { setBulkOptions([]); return; }
    let cancelled = false;
    setLoadingOptions(true);
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ payerKind, period, search: bulkSearch.trim() });
      if (payerKind === "COMPANY") params.set("payerName", payerId);
      else params.set("councilCustomerId", payerId);
      get<OccupancyOption[]>(`incoming-payments/occupancies?${params}`).then(({ data }) => {
        if (cancelled) return;
        setLoadingOptions(false);
        if (Array.isArray(data)) setBulkOptions(data);
      });
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [isBulk, payerKind, payerId, period, bulkSearch]);

  // Rows already ticked stay listed even if the search filters them out.
  const [allocatedRows, setAllocatedRows] = useState<Record<string, OccupancyOption>>({});
  useEffect(() => {
    setAllocatedRows((rows) => {
      const next = { ...rows };
      for (const o of bulkOptions) if (next[o.id]) next[o.id] = o;
      return next;
    });
  }, [bulkOptions]);
  const tableRows = useMemo(() => {
    const ids = new Set(bulkOptions.map((o) => o.id));
    return [...Object.values(allocatedRows).filter((o) => !ids.has(o.id)), ...bulkOptions];
  }, [bulkOptions, allocatedRows]);

  const amountReceived = round2(Number(payment.amount || 0));
  const totalAllocated = round2(Object.values(allocations).reduce((sum, v) => sum + Number(v || 0), 0));
  const remaining = round2(amountReceived - totalAllocated);

  const toggleRow = (o: OccupancyOption, checked: boolean) => {
    if (checked) {
      // Default to what's outstanding, capped at what's left of the payment.
      const left = Math.max(0, round2(amountReceived - totalAllocated));
      const suggested = round2(Math.min(Math.max(o.outstanding, 0), left || Math.max(o.outstanding, 0)));
      setAllocations((a) => ({ ...a, [o.id]: suggested ? String(suggested) : "" }));
      setAllocatedRows((rows) => ({ ...rows, [o.id]: o }));
    } else {
      setAllocations(({ [o.id]: _removed, ...rest }) => rest);
      setAllocatedRows(({ [o.id]: _removed, ...rest }) => rest);
    }
  };

  // Changing the period clears allocations — they were sized for the old one.
  const changePeriod = (value: string) => {
    if (!value) return;
    setPeriod(value);
    setAllocations({});
    setAllocatedRows({});
  };

  const allocationList = isBulk
    ? Object.entries(allocations)
        .map(([occupancyId, value]) => ({ occupancyId, period, amount: round2(Number(value || 0)) }))
        .filter((a) => a.amount > 0)
    : occupancy ? [{ occupancyId: occupancy.id, period, amount: amountReceived }] : [];

  // ---- Step navigation ----
  const goToDetails = () => {
    if (!isBulk && !occupancy) return toast({ title: "Select the tenant / occupancy", variant: "destructive" });
    if (isBulk && !payerId) return toast({ title: `Select the paying ${payerKind === "COMPANY" ? "company" : "council"}`, variant: "destructive" });
    if (!isBulk && occupancy && !payment.amount && occupancy.outstanding > 0) updatePayment("amount", String(occupancy.outstanding));
    setStep(1);
  };

  const goToReview = () => {
    if (!payment.paymentDate) return toast({ title: "Enter the payment date", variant: "destructive" });
    if (amountReceived <= 0) return toast({ title: "Enter the amount received", variant: "destructive" });
    if (!payment.paymentMethod) return toast({ title: "Select the payment method", variant: "destructive" });
    if (isBulk) {
      if (!allocationList.length) return toast({ title: "Allocate the payment to at least one property", variant: "destructive" });
      if (Math.abs(remaining) > 0.005) {
        return toast({
          title: remaining > 0 ? `${money(remaining)} still to allocate` : `Allocated ${money(-remaining)} more than received`,
          description: "Total allocated must equal the amount received.",
          variant: "destructive",
        });
      }
    }
    setStep(2);
  };

  const confirm = async () => {
    setSaving(true);
    const { data, error } = await post<IncomingPayment>("incoming-payments", {
      payerKind,
      payerName: payerKind === "COMPANY" ? payerId : undefined,
      councilCustomerId: payerKind === "COUNCIL" ? payerId : undefined,
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
    setPayerId("");
    setAllocations({});
    setAllocatedRows({});
    setPeriod(currentPeriod());
  };

  const paymentFields = (
    <div className="space-y-3">
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
            <p className="text-sm text-muted-foreground">Record a payment from a tenant, company or council.</p>
          </div>
          <div className="flex gap-2">
            {step === 0 && <Button variant="outline" onClick={() => navigate("/finance/incoming-payments")}>Cancel</Button>}
            {step === 1 && <Button variant="outline" onClick={() => setStep(0)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>}
            {step === 2 && <Button variant="outline" onClick={() => setStep(1)} disabled={saving}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>}
            {step === 0 && <Button onClick={goToDetails}>Next: {isBulk ? "Allocate" : "Payment Details"}<ArrowRight className="ml-2 h-4 w-4" /></Button>}
            {step === 1 && <Button onClick={goToReview}>Next: Review<ArrowRight className="ml-2 h-4 w-4" /></Button>}
            {step === 2 && <Button onClick={() => void confirm()} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirm Payment</Button>}
          </div>
        </div>

        {/* Stepper */}
        {step < 3 && (
          <div className="surface flex items-center gap-2 px-6 py-4">
            {STEPS.map((label, index) => (
              <div key={label} className="flex flex-1 items-center gap-2">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${index < step ? "bg-emerald-600 text-white" : index === step ? "bg-primary text-primary-foreground" : "border text-muted-foreground"}`}>
                  {index < step ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <span className={`text-sm ${index === step ? "font-medium" : "text-muted-foreground"}`}>{index === 1 && isBulk ? "Allocate to Properties" : label}</span>
                {index < STEPS.length - 1 && <span className={`mx-2 h-px flex-1 ${index < step ? "bg-emerald-600" : "bg-border"}`} />}
              </div>
            ))}
          </div>
        )}

        {/* ---- Step 1: payer / occupancy ---- */}
        {step === 0 && (
          <div className="surface space-y-5 p-6">
            <div>
              <h2 className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-5 w-5 text-emerald-600" />Select Payer / Occupancy</h2>
              <p className="text-sm text-muted-foreground">Choose the tenant, company, council or occupancy for this payment.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {PAYER_CARDS.map(({ kind, title, description, icon: Icon }) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => choosePayerKind(kind)}
                  className={`flex gap-3 rounded-lg border p-4 text-left transition ${payerKind === kind ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/40"}`}
                >
                  <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${payerKind === kind ? "border-primary" : ""}`}>
                    {payerKind === kind && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </span>
                  <span>
                    <span className={`flex items-center gap-1.5 font-medium ${payerKind === kind ? "text-primary" : ""}`}><Icon className="h-4 w-4" />{title}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{description}</span>
                  </span>
                </button>
              ))}
            </div>

            {!isBulk ? (
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
                <div className="space-y-2">
                  <Label>Search Tenant / Occupancy *</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-8" placeholder="Name, property or OCC reference" value={occSearch} onChange={(e) => setOccSearch(e.target.value)} />
                  </div>
                  <div className="max-h-80 overflow-y-auto rounded-lg border">
                    {occOptions.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setOccupancy(o)}
                        className={`flex w-full items-center justify-between gap-2 border-b px-3 py-2 text-left text-sm last:border-0 ${occupancy?.id === o.id ? "bg-primary/10" : "hover:bg-muted/40"}`}
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{o.payerName}</span>
                          <span className="block truncate text-xs text-muted-foreground">{o.property.addressLine1} · {o.reference}</span>
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">{money(o.rateAmount)} {RATE_SHORT[o.rateFrequency]}</span>
                      </button>
                    ))}
                    {!occOptions.length && (
                      <div className="space-y-2 p-4 text-center text-sm text-muted-foreground">
                        {occLoading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                          : occError ? <p className="text-destructive">Could not load occupancies: {occError}</p>
                          : occSearch.trim() ? <p>No private occupancy matches “{occSearch.trim()}”.</p>
                          : (
                            <>
                              <p>No private occupancies yet. Payments are recorded against an occupancy (the tenant, property and rent), so create one first.</p>
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
                      <div className="h-32 w-full shrink-0 overflow-hidden rounded-md bg-muted sm:w-44">
                        {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Building2 className="h-8 w-8 text-muted-foreground" /></div>}
                      </div>
                      <div className="flex-1 text-sm">
                        <Detail label="Property" value={[occupancy.property.addressLine1, occupancy.property.town, occupancy.property.postCode].filter(Boolean).join(", ")} />
                        <Detail label="Occupancy Ref" value={occupancy.reference} />
                        <Detail label="Tenant Name" value={occupancy.payerName} />
                        <Detail label="Tenancy Type" value={occupancy.tenancyType} />
                        <Detail label="Tenancy Start" value={new Date(occupancy.moveInDate).toLocaleDateString("en-GB")} />
                        <Detail label="Rent" value={`${money(occupancy.rateAmount)} ${RATE_SHORT[occupancy.rateFrequency]}`} strong />
                      </div>
                    </div>
                  ) : <p className="text-sm text-muted-foreground">Select an occupancy to see its details.</p>}
                </div>
              </div>
            ) : (
              <div className="max-w-md space-y-2">
                <Label>{payerKind === "COMPANY" ? "Company Payer" : "Council Payer"} *</Label>
                <Select value={payerId} onValueChange={(v) => { setPayerId(v); setAllocations({}); setAllocatedRows({}); }}>
                  <SelectTrigger><SelectValue placeholder={`Select ${payerKind === "COMPANY" ? "company" : "council"}`} /></SelectTrigger>
                  <SelectContent>{payers.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
                {!payers.length && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{payerKind === "COMPANY" ? "No company-paid occupancies yet — create an occupancy with a Private Company as the payer." : "No councils yet — add one under Council Customers, then create a council occupancy."}</span>
                    <Button size="sm" variant="outline" className="h-7 shrink-0" onClick={() => navigate(payerKind === "COMPANY" ? "/occupancy/new" : "/council-customers")}>
                      <Plus className="mr-1 h-3 w-3" />{payerKind === "COMPANY" ? "New Occupancy" : "Council Customers"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ---- Step 2 (individual): rent period + payment details ---- */}
        {step === 1 && !isBulk && occupancy && (
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="surface p-5 text-sm">
              <h3 className="mb-3 flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Occupancy Summary</h3>
              <div className="mb-3 h-28 overflow-hidden rounded-md bg-muted">
                {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Building2 className="h-7 w-7 text-muted-foreground" /></div>}
              </div>
              <Detail label="Property" value={occupancy.property.addressLine1} />
              <Detail label="Occupancy Ref" value={occupancy.reference} />
              <Detail label="Tenant" value={occupancy.payerName} />
              <Detail label="Tenancy Start" value={new Date(occupancy.moveInDate).toLocaleDateString("en-GB")} />
              <Detail label="Rent" value={`${money(occupancy.rateAmount)} ${RATE_SHORT[occupancy.rateFrequency]}`} strong />
            </div>
            <div className="surface space-y-3 p-5 text-sm">
              <h3 className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Rent Period Information</h3>
              <div className="space-y-1"><Label>Rent Period</Label><Input type="month" value={period} onChange={(e) => changePeriod(e.target.value)} /></div>
              <div><p className="text-muted-foreground">Rent Due ({formatPeriod(period)})</p><p className="text-base font-semibold">{money(occupancy.rentDue)}</p></div>
              <div><p className="text-muted-foreground">Previously Received</p><p className="text-base font-semibold">{money(occupancy.previouslyReceived)}</p></div>
              <div><p className="text-muted-foreground">Outstanding</p><p className={`text-base font-semibold ${occupancy.outstanding > 0 ? "text-amber-700" : "text-emerald-700"}`}>{money(occupancy.outstanding)}</p></div>
            </div>
            <div className="surface p-5">
              <h3 className="mb-3 flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Payment Details</h3>
              {paymentFields}
            </div>
          </div>
        )}

        {/* ---- Step 2 (bulk): payment details + allocation table ---- */}
        {step === 1 && isBulk && (
          <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
            <div className="surface space-y-3 p-5">
              <h3 className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4 text-emerald-600" />{payerKind === "COMPANY" ? "Company" : "Council"} Payment Details</h3>
              <div className="space-y-1"><Label>{payerKind === "COMPANY" ? "Company" : "Council"} Payer</Label><Input value={payerName} disabled /></div>
              {paymentFields}
            </div>
            <div className="surface space-y-3 p-5">
              <div>
                <h3 className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Allocate to Properties</h3>
                <p className="text-xs text-muted-foreground">Select the occupancies this payment covers. You can allocate full or partial amounts.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative min-w-[14rem] flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-8" placeholder="Search by property, occupancy, tenant…" value={bulkSearch} onChange={(e) => setBulkSearch(e.target.value)} />
                </div>
                <Input className="w-44" type="month" value={period} onChange={(e) => changePeriod(e.target.value)} />
              </div>
              <div className="max-h-[28rem] overflow-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="w-8 px-3 py-2" />
                      <th className="px-3 py-2 font-medium">Property</th>
                      <th className="px-3 py-2 font-medium">Occupancy Ref</th>
                      <th className="px-3 py-2 font-medium">Tenant</th>
                      <th className="px-3 py-2 text-right font-medium">Rent Due</th>
                      <th className="px-3 py-2 text-right font-medium">Prev. Received</th>
                      <th className="px-3 py-2 text-right font-medium">Outstanding</th>
                      <th className="px-3 py-2 text-right font-medium">Allocate (£)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((o) => {
                      const checked = o.id in allocations;
                      return (
                        <tr key={o.id} className={`border-t ${checked ? "bg-primary/5" : ""}`}>
                          <td className="px-3 py-2"><input type="checkbox" className="h-4 w-4 accent-[hsl(var(--primary))]" checked={checked} onChange={(e) => toggleRow(o, e.target.checked)} /></td>
                          <td className="px-3 py-2">{o.property.addressLine1}</td>
                          <td className="px-3 py-2 font-mono text-xs">{o.reference}</td>
                          <td className="px-3 py-2">{o.tenantName}</td>
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
                        </tr>
                      );
                    })}
                    {!tableRows.length && (
                      <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">{loadingOptions ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "No occupancies found for this payer."}</td></tr>
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
                    <Detail label={payerKind === "COMPANY" ? "Company Payer" : "Council Payer"} value={payerName} />
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
                    <Detail label="Tenant" value={occupancy.payerName} />
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
                        const row = allocatedRows[a.occupancyId];
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
            <div className="flex justify-center gap-2 pt-2">
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
