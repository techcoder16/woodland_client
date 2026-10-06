import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  Home,
  Loader2,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  Upload,
  User,
  Users,
  X,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { get, post } from "@/helper/api";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useOccupancyMeta } from "./useOccupancyMeta";
import {
  AdditionalOccupier,
  CouncilCustomer,
  Occupancy,
  OccupancyType,
  Occupier,
  PropertyOption,
  RateFrequency,
  StaffUser,
  addressSub,
  estimatedIncome,
  fmtDate,
  freqOf,
  fullName,
  money,
  nightsBetween,
  monthlyRentAs,
  parseRent,
  staffName,
  toneBadge,
  typeOf,
} from "./occupancyShared";

const STEPS = ["Property", "Occupancy Type", "Customer & Occupier", "Dates & Rate", "Handover", "Review & Create"];

interface FormState {
  propertyId: string;
  type: OccupancyType | "";
  // council
  councilCustomerId: string;
  councilContactName: string;
  councilReference: string;
  councilTeam: string;
  // private
  privateCustomerKind: "INDIVIDUAL" | "COMPANY";
  customerTitle: string;
  customerFirstName: string;
  customerSurname: string;
  customerCompanyName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddressLine1: string;
  customerTown: string;
  customerPostCode: string;
  // occupier
  occupierMode: "new" | "existing";
  occupierId: string;
  occTitle: string;
  occFirstName: string;
  occSurname: string;
  occDob: string;
  occPhone: string;
  occEmail: string;
  additionalOccupiers: AdditionalOccupier[];
  // dates & rate
  moveInDate: string;
  expectedMoveOutDate: string;
  rateAmount: string;
  rateFrequency: RateFrequency | "";
  // booking
  bookingAssignedToId: string;
  bookingDate: string;
  bookingTime: string;
  bookingNotes: string;
}

const EMPTY: FormState = {
  propertyId: "",
  type: "",
  councilCustomerId: "",
  councilContactName: "",
  councilReference: "",
  councilTeam: "",
  privateCustomerKind: "INDIVIDUAL",
  customerTitle: "",
  customerFirstName: "",
  customerSurname: "",
  customerCompanyName: "",
  customerEmail: "",
  customerPhone: "",
  customerAddressLine1: "",
  customerTown: "",
  customerPostCode: "",
  occupierMode: "new",
  occupierId: "",
  occTitle: "",
  occFirstName: "",
  occSurname: "",
  occDob: "",
  occPhone: "",
  occEmail: "",
  additionalOccupiers: [],
  moveInDate: "",
  expectedMoveOutDate: "",
  rateAmount: "",
  rateFrequency: "",
  bookingAssignedToId: "",
  bookingDate: "",
  bookingTime: "10:00",
  bookingNotes: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Field({ label, required, error, children, className }: { label: string; required?: boolean; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-sm">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Panel({ icon: Icon, title, subtitle, children, className }: { icon?: any; title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("surface p-5 space-y-4", className)}>
      <div className="flex items-start gap-3">
        {Icon && <Icon className="h-5 w-5 mt-0.5 text-primary" />}
        <div>
          <h3 className="font-semibold">{title}</h3>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function PropertyCard({ property, statusTone }: { property: PropertyOption; statusTone?: string }) {
  const landlord = [property.vendor?.firstName, property.vendor?.lastName].filter(Boolean).join(" ");
  return (
    <div className="flex gap-4 rounded-xl border bg-muted/30 p-4">
      <div className="h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-muted flex items-center justify-center">
        {property.photographs && !property.photographs.startsWith("data:application/pdf") ? (
          <img src={property.photographs} alt="" className="h-full w-full object-cover" />
        ) : (
          <Home className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 space-y-1 text-sm">
        <p className="font-semibold text-base">{property.addressLine1 || "Untitled property"}</p>
        <p className="text-muted-foreground">{addressSub(property)}</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 pt-1">
          {property.propertyTypeCategory && (<><dt className="text-muted-foreground">Property Type</dt><dd>{property.propertyTypeCategory}</dd></>)}
          {property.bedrooms != null && (<><dt className="text-muted-foreground">Bedrooms</dt><dd>{property.bedrooms}</dd></>)}
          {landlord && (<><dt className="text-muted-foreground">Landlord</dt><dd>{landlord}</dd></>)}
          {property.currentStatus && (
            <>
              <dt className="text-muted-foreground">Current Status</dt>
              <dd><span className={cn("rounded px-2 py-0.5 text-xs font-medium", toneBadge(statusTone))}>{property.currentStatus}</span></dd>
            </>
          )}
        </dl>
      </div>
    </div>
  );
}

function ReviewBlock({ title, rows }: { title: string; rows: [string, React.ReactNode][] }) {
  return (
    <div className="surface p-4">
      <h4 className="font-semibold mb-2">{title}</h4>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        {rows.filter(([, v]) => v !== undefined && v !== null && v !== "").map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="font-medium break-words">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function CreateOccupancy() {
  const navigate = useNavigate();
  const meta = useOccupancyMeta();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [propertySearch, setPropertySearch] = useState("");
  const debouncedPropertySearch = useDebouncedValue(propertySearch, 300);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<PropertyOption | null>(null);
  const [propertyOpen, setPropertyOpen] = useState(false);

  const [councils, setCouncils] = useState<CouncilCustomer[]>([]);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [occupierSearch, setOccupierSearch] = useState("");
  const debouncedOccupierSearch = useDebouncedValue(occupierSearch, 300);
  const [occupierOptions, setOccupierOptions] = useState<Occupier[]>([]);
  const [selectedOccupier, setSelectedOccupier] = useState<Occupier | null>(null);
  const [documents, setDocuments] = useState<File[]>([]);
  const [addingMember, setAddingMember] = useState<AdditionalOccupier | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  useEffect(() => {
    get<{ properties: PropertyOption[] }>(`occupancy/options/properties?search=${encodeURIComponent(debouncedPropertySearch)}`).then(({ data }) =>
      setProperties(data?.properties || []),
    );
  }, [debouncedPropertySearch]);

  useEffect(() => {
    get<{ councils: CouncilCustomer[] }>("occupancy/councils").then(({ data }) => setCouncils(data?.councils || []));
    get<{ users: StaffUser[] }>("occupancy/options/staff").then(({ data }) => setStaff(data?.users || []));
  }, []);

  useEffect(() => {
    if (form.occupierMode !== "existing") return;
    get<{ occupiers: Occupier[] }>(`occupancy/options/occupiers?search=${encodeURIComponent(debouncedOccupierSearch)}`).then(({ data }) =>
      setOccupierOptions(data?.occupiers || []),
    );
  }, [debouncedOccupierSearch, form.occupierMode]);

  const selectedCouncil = councils.find((c) => c.id === form.councilCustomerId);
  const typeMeta = typeOf(meta, form.type);
  const freq = freqOf(meta, form.rateFrequency);
  const propertyTone = (status?: string) => meta?.propertyStatuses.find((s) => s.value === status)?.tone;

  const chooseType = (type: OccupancyType) => {
    const t = typeOf(meta, type);
    setForm((f) => ({ ...f, type, rateFrequency: f.rateFrequency || t?.defaultRateFrequency || "" }));
    setErrors((e) => ({ ...e, type: "" }));
  };

  const chooseCouncil = (id: string) => {
    const c = councils.find((x) => x.id === id);
    setForm((f) => ({
      ...f,
      councilCustomerId: id,
      councilContactName: f.councilContactName || c?.contactName || "",
      councilTeam: f.councilTeam || c?.defaultTeam || "",
    }));
    setErrors((e) => ({ ...e, councilCustomerId: "" }));
  };

  // Private individual is very often the occupier too — copy their details across.
  const copyCustomerToOccupier = () => {
    setForm((f) => ({
      ...f,
      occupierMode: "new",
      occTitle: f.customerTitle,
      occFirstName: f.customerFirstName,
      occSurname: f.customerSurname,
      occPhone: f.customerPhone,
      occEmail: f.customerEmail,
    }));
  };

  const propertyRent = parseRent(selectedProperty?.rentPerMonth);
  // Only filled in when the user clicks "Use property rent" — never automatically —
  // and converted from per-month to the selected frequency (per night / week).
  const rentFreq: RateFrequency = form.rateFrequency || "MONTHLY";
  const convertedRent = propertyRent ? monthlyRentAs(propertyRent, rentFreq) : null;
  const usingPropertyRent = convertedRent != null && Number(form.rateAmount) === convertedRent;
  const nights = nightsBetween(form.moveInDate, form.expectedMoveOutDate);
  const income = form.rateFrequency ? estimatedIncome(Number(form.rateAmount), form.rateFrequency, form.moveInDate, form.expectedMoveOutDate) : null;

  const validate = (s: number): Record<string, string> => {
    const e: Record<string, string> = {};
    if (s === 0 && !form.propertyId) e.propertyId = "Select a property";
    if (s === 1 && !form.type) e.type = "Choose an occupancy type";
    if (s === 2) {
      if (form.type === "COUNCIL" && !form.councilCustomerId) e.councilCustomerId = "Select the council";
      if (form.type === "PRIVATE") {
        if (form.privateCustomerKind === "INDIVIDUAL") {
          if (!form.customerFirstName) e.customerFirstName = "Required";
          if (!form.customerSurname) e.customerSurname = "Required";
        } else if (!form.customerCompanyName) e.customerCompanyName = "Required";
        if (!form.customerEmail) e.customerEmail = "Required";
        else if (!EMAIL_RE.test(form.customerEmail)) e.customerEmail = "Enter a valid email";
        if (!form.customerPhone) e.customerPhone = "Required";
      }
      if (form.occupierMode === "existing") {
        if (!form.occupierId) e.occupierId = "Choose an occupier";
      } else {
        if (!form.occFirstName) e.occFirstName = "Required";
        if (form.occEmail && !EMAIL_RE.test(form.occEmail)) e.occEmail = "Enter a valid email";
      }
    }
    if (s === 3) {
      if (!form.moveInDate) e.moveInDate = "Required";
      if (form.expectedMoveOutDate && form.moveInDate && form.expectedMoveOutDate <= form.moveInDate) e.expectedMoveOutDate = "Must be after the move-in date";
      if (!(Number(form.rateAmount) > 0)) e.rateAmount = "Enter an amount greater than 0";
    }
    if (s === 4) {
      if (!form.bookingAssignedToId) e.bookingAssignedToId = "Assign a staff member";
      if (!form.bookingDate) e.bookingDate = "Required";
      if (!form.bookingTime) e.bookingTime = "Required";
    }
    return e;
  };

  const next = () => {
    const e = validate(step);
    setErrors(e);
    if (Object.values(e).some(Boolean)) {
      toast.error("Please complete the highlighted fields");
      return;
    }
    // Booking-in defaults to the move-in day.
    if (step === 3 && !form.bookingDate) set("bookingDate", form.moveInDate);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    for (let s = 0; s < 5; s++) {
      const e = validate(s);
      if (Object.values(e).some(Boolean)) {
        setErrors(e);
        setStep(s);
        toast.error("Some details are missing");
        return;
      }
    }
    setSubmitting(true);
    const clean = (v: string) => (v.trim() ? v.trim() : undefined);
    const payload: Record<string, unknown> = {
      propertyId: form.propertyId,
      type: form.type,
      moveInDate: form.moveInDate,
      expectedMoveOutDate: clean(form.expectedMoveOutDate),
      rateAmount: Number(form.rateAmount),
      rateFrequency: form.rateFrequency || undefined,
      bookingAssignedToId: form.bookingAssignedToId,
      bookingDate: form.bookingDate,
      bookingTime: form.bookingTime,
      bookingNotes: clean(form.bookingNotes),
      additionalOccupiers: form.additionalOccupiers,
    };
    if (form.type === "COUNCIL") {
      Object.assign(payload, {
        councilCustomerId: form.councilCustomerId,
        councilContactName: clean(form.councilContactName),
        councilReference: clean(form.councilReference),
        councilTeam: clean(form.councilTeam),
      });
    } else {
      Object.assign(payload, {
        privateCustomerKind: form.privateCustomerKind,
        customerTitle: clean(form.customerTitle),
        customerFirstName: clean(form.customerFirstName),
        customerSurname: clean(form.customerSurname),
        customerCompanyName: clean(form.customerCompanyName),
        customerEmail: clean(form.customerEmail),
        customerPhone: clean(form.customerPhone),
        customerAddressLine1: clean(form.customerAddressLine1),
        customerTown: clean(form.customerTown),
        customerPostCode: clean(form.customerPostCode),
      });
    }
    if (form.occupierMode === "existing") payload.occupierId = form.occupierId;
    else
      payload.occupier = {
        title: clean(form.occTitle),
        FirstName: form.occFirstName.trim(),
        SureName: clean(form.occSurname),
        dateOfBirth: clean(form.occDob),
        MobileNo: clean(form.occPhone),
        Email: clean(form.occEmail),
      };

    const { data, error } = await post<Occupancy>("occupancy", payload);
    if (error || !data) {
      setSubmitting(false);
      toast.error(error?.message || "Failed to create occupancy");
      return;
    }
    if (documents.length) {
      const fd = new FormData();
      documents.forEach((f) => fd.append("files", f));
      const { error: docError } = await post(`occupancy/${data.id}/documents`, fd);
      if (docError) toast.error(`Occupancy created, but documents failed to upload: ${docError.message}`);
    }
    toast.success(`Occupancy ${data.reference} created`);
    navigate(`/occupancy/${data.id}`);
  };

  const occupierDisplay =
    form.occupierMode === "existing" ? fullName(selectedOccupier) : [form.occTitle, form.occFirstName, form.occSurname].filter(Boolean).join(" ");
  const assignedStaff = staff.find((u) => u.id === form.bookingAssignedToId);
  const payerDisplay =
    form.type === "COUNCIL"
      ? selectedCouncil?.name
      : form.privateCustomerKind === "COMPANY"
        ? form.customerCompanyName
        : [form.customerTitle, form.customerFirstName, form.customerSurname].filter(Boolean).join(" ");

  const stepper = (
    <ol className="flex items-start">
      {STEPS.map((label, i) => {
        const done = i < step;
        const current = i === step;
        return (
          <li key={label} className="relative flex flex-1 flex-col items-center text-center">
            {i > 0 && <span className={cn("absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2", i <= step ? "bg-primary" : "bg-border")} />}
            <button
              type="button"
              disabled={i > step}
              onClick={() => i < step && setStep(i)}
              className={cn(
                "relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                done ? "bg-primary text-primary-foreground" : current ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
              )}
              aria-label={`Step ${i + 1}: ${label}`}
            >
              {done ? <Check className="h-4 w-4" /> : i + 1}
            </button>
            <span className={cn("mt-2 hidden text-xs sm:block", current ? "font-semibold text-foreground" : "text-muted-foreground")}>{label}</span>
          </li>
        );
      })}
    </ol>
  );

  const nextLabel = step < STEPS.length - 1 ? `Next: ${STEPS[step + 1]}` : "";

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <button className="text-sm text-muted-foreground hover:text-foreground" onClick={() => navigate("/occupancy")}>
            Occupancy
          </button>
          <span className="mx-2 text-muted-foreground">›</span>
          <span className="text-sm font-medium">Create New Occupancy</span>
          <h1 className="hero-stat text-[2rem] mt-2">Create a New Occupancy</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {form.type ? `Add a new ${typeMeta?.label.toLowerCase()} booking for a property` : "Add a new booking for a property"}
          </p>
        </div>

        {stepper}
        <p className="text-sm font-medium sm:hidden">Step {step + 1} of {STEPS.length} – {STEPS[step]}</p>

        <div className="surface p-5 sm:p-6 space-y-6">
          {/* Step 1 — Property */}
          {step === 0 && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">Select Property</h2>
                  <p className="text-sm text-muted-foreground">Choose the property for this occupancy.</p>
                </div>
                <Field label="Property" required error={errors.propertyId}>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="Search or select a property..."
                      value={propertySearch}
                      onFocus={() => setPropertyOpen(true)}
                      onBlur={() => setTimeout(() => setPropertyOpen(false), 150)}
                      onChange={(e) => {
                        setPropertySearch(e.target.value);
                        setPropertyOpen(true);
                      }}
                    />
                    {propertyOpen && (
                      <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border bg-popover shadow-md">
                        {properties.length === 0 ? (
                          <p className="p-3 text-sm text-muted-foreground">No properties found.</p>
                        ) : (
                          properties.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setSelectedProperty(p);
                                set("propertyId", p.id);
                                setPropertySearch(p.addressLine1 || "");
                                setPropertyOpen(false);
                              }}
                            >
                              <span className="min-w-0">
                                <span className="block truncate font-medium">{p.addressLine1 || "Untitled"}</span>
                                <span className="block truncate text-xs text-muted-foreground">{addressSub(p)}</span>
                              </span>
                              <span className={cn("shrink-0 rounded px-2 py-0.5 text-xs", toneBadge(propertyTone(p.currentStatus)))}>{p.currentStatus}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </Field>
                {selectedProperty && selectedProperty.currentStatus !== "Vacant" && (
                  <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                    This property is currently <strong>{selectedProperty.currentStatus}</strong>. You can only book it from the date the current occupancy ends.
                  </p>
                )}
              </div>
              {selectedProperty ? (
                <PropertyCard property={selectedProperty} statusTone={propertyTone(selectedProperty.currentStatus)} />
              ) : (
                <div className="flex items-center justify-center rounded-xl border border-dashed p-8 text-sm text-muted-foreground">
                  The selected property will appear here.
                </div>
              )}
            </div>
          )}

          {/* Step 2 — Occupancy type */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Select Occupancy Type</h2>
                <p className="text-sm text-muted-foreground">Choose the type of occupancy.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {(meta?.types ?? []).map((t) => {
                  const selected = form.type === t.value;
                  const Icon = t.value === "COUNCIL" ? Users : User;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => chooseType(t.value)}
                      className={cn(
                        "relative flex flex-col items-center gap-2 rounded-xl border-2 p-6 text-center transition-colors",
                        selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
                      )}
                      aria-pressed={selected}
                    >
                      <span className={cn("absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border", selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40")}>
                        {selected && <Check className="h-3 w-3" />}
                      </span>
                      <Icon className={cn("h-9 w-9", selected ? "text-primary" : "text-muted-foreground")} />
                      <span className="font-semibold">{t.longLabel}</span>
                      <span className="text-sm text-muted-foreground max-w-xs">{t.description}</span>
                    </button>
                  );
                })}
              </div>
              {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
            </div>
          )}

          {/* Step 3 — Customer & occupier */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold">Step 3 of 6 – Customer &amp; Occupier</h2>
                <p className="text-sm text-muted-foreground">
                  {form.type === "COUNCIL"
                    ? "Enter the council customer and the household who will occupy the property."
                    : "Enter the details of the private customer and the occupier who will live at the property."}
                </p>
              </div>
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
                <div className="space-y-5">
                  {form.type === "COUNCIL" ? (
                    <Panel icon={Building2} title="Council Customer (Payer)" subtitle="The council paying for this occupancy.">
                      <Field label="Council Customer" required error={errors.councilCustomerId}>
                        <div className="flex gap-2">
                          <Select value={form.councilCustomerId} onValueChange={chooseCouncil}>
                            <SelectTrigger><SelectValue placeholder="Select a council" /></SelectTrigger>
                            <SelectContent>
                              {councils.map((c) => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button type="button" variant="outline" onClick={() => window.open("/council-customers", "_blank")}>
                            {councils.length ? "Manage" : "Add council"}
                          </Button>
                        </div>
                        {councils.length === 0 && (
                          <p className="text-xs text-muted-foreground">No councils yet — add one in Council Customers, then come back.</p>
                        )}
                      </Field>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Council Contact (Optional)">
                          <Input value={form.councilContactName} onChange={(e) => set("councilContactName", e.target.value)} />
                        </Field>
                        <Field label="Council Reference (Optional)">
                          <Input value={form.councilReference} onChange={(e) => set("councilReference", e.target.value)} />
                        </Field>
                        <Field label="Council Team (Optional)" className="sm:col-span-2">
                          <Input value={form.councilTeam} placeholder="e.g. Temporary Accommodation" onChange={(e) => set("councilTeam", e.target.value)} />
                        </Field>
                      </div>
                    </Panel>
                  ) : (
                    <Panel icon={User} title="Private Customer (Payer)" subtitle="Enter the person or company paying for this occupancy.">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {(meta?.customerKinds ?? []).map((k) => {
                          const selected = form.privateCustomerKind === k.value;
                          return (
                            <button
                              key={k.value}
                              type="button"
                              onClick={() => set("privateCustomerKind", k.value)}
                              className={cn("flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium", selected ? "border-primary bg-primary/5" : "hover:border-primary/40")}
                              aria-pressed={selected}
                            >
                              <span className={cn("flex h-4 w-4 items-center justify-center rounded-full border", selected ? "border-primary bg-primary" : "border-muted-foreground/50")}>
                                {selected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                              </span>
                              {k.value === "COMPANY" ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
                              {k.label}
                            </button>
                          );
                        })}
                      </div>
                      {form.privateCustomerKind === "INDIVIDUAL" ? (
                        <div className="grid gap-4 sm:grid-cols-[120px_1fr_1fr]">
                          <Field label="Title">
                            <Select value={form.customerTitle} onValueChange={(v) => set("customerTitle", v)}>
                              <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
                              <SelectContent>{(meta?.titles ?? []).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                            </Select>
                          </Field>
                          <Field label="First Name" required error={errors.customerFirstName}>
                            <Input value={form.customerFirstName} onChange={(e) => set("customerFirstName", e.target.value)} />
                          </Field>
                          <Field label="Surname" required error={errors.customerSurname}>
                            <Input value={form.customerSurname} onChange={(e) => set("customerSurname", e.target.value)} />
                          </Field>
                        </div>
                      ) : (
                        <Field label="Company Name" required error={errors.customerCompanyName}>
                          <Input value={form.customerCompanyName} onChange={(e) => set("customerCompanyName", e.target.value)} />
                        </Field>
                      )}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Email Address" required error={errors.customerEmail}>
                          <Input type="email" value={form.customerEmail} onChange={(e) => set("customerEmail", e.target.value)} />
                        </Field>
                        <Field label="Telephone Number" required error={errors.customerPhone}>
                          <Input value={form.customerPhone} onChange={(e) => set("customerPhone", e.target.value)} />
                        </Field>
                      </div>
                      <Field label="Address">
                        <Input placeholder="Address line" value={form.customerAddressLine1} onChange={(e) => set("customerAddressLine1", e.target.value)} />
                      </Field>
                      <div className="grid gap-4 grid-cols-[1fr_140px]">
                        <Input placeholder="Town" aria-label="Town" value={form.customerTown} onChange={(e) => set("customerTown", e.target.value)} />
                        <Input placeholder="Postcode" aria-label="Postcode" value={form.customerPostCode} onChange={(e) => set("customerPostCode", e.target.value)} />
                      </div>
                    </Panel>
                  )}

                  {form.type === "PRIVATE" && (
                    <Panel title="Customer Documents (Optional)" subtitle="Upload any relevant documents for the private customer (e.g. company ID, proof of address).">
                      <input
                        ref={fileInput}
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          const tooBig = files.filter((f) => f.size > 10 * 1024 * 1024);
                          if (tooBig.length) toast.error(`${tooBig.map((f) => f.name).join(", ")} is over 10MB`);
                          setDocuments((d) => [...d, ...files.filter((f) => f.size <= 10 * 1024 * 1024)]);
                          e.target.value = "";
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => fileInput.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDocuments((d) => [...d, ...Array.from(e.dataTransfer.files).filter((f) => f.size <= 10 * 1024 * 1024)]);
                        }}
                        className="flex w-full items-center justify-center gap-3 rounded-lg border border-dashed p-6 text-sm hover:bg-muted/40"
                      >
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-left">
                          <span className="block font-medium">Drag and drop files here, or click to upload</span>
                          <span className="block text-xs text-muted-foreground">PDF, JPG, PNG (Max 10MB each)</span>
                        </span>
                      </button>
                      {documents.length > 0 && (
                        <ul className="space-y-1 text-sm">
                          {documents.map((f, i) => (
                            <li key={`${f.name}-${i}`} className="flex items-center justify-between rounded border px-3 py-1.5">
                              <span className="truncate">{f.name}</span>
                              <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setDocuments((d) => d.filter((_, j) => j !== i))}>
                                <X className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </Panel>
                  )}
                </div>

                <div className="space-y-5">
                  {selectedProperty && (
                    <Panel icon={Home} title="Selected Property">
                      <PropertyCard property={selectedProperty} statusTone={propertyTone(selectedProperty.currentStatus)} />
                    </Panel>
                  )}

                  <Panel icon={Users} title="Occupier Details" subtitle="The person/household who will occupy the property.">
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant={form.occupierMode === "new" ? "default" : "outline"} onClick={() => set("occupierMode", "new")}>
                        New occupier
                      </Button>
                      <Button type="button" size="sm" variant={form.occupierMode === "existing" ? "default" : "outline"} onClick={() => set("occupierMode", "existing")}>
                        Existing occupier
                      </Button>
                      {form.type === "PRIVATE" && form.privateCustomerKind === "INDIVIDUAL" && (
                        <Button type="button" size="sm" variant="ghost" onClick={copyCustomerToOccupier}>
                          Same as customer
                        </Button>
                      )}
                    </div>

                    {form.occupierMode === "existing" ? (
                      <Field label="Find occupier" required error={errors.occupierId}>
                        <Input placeholder="Search by name, email or phone..." value={occupierSearch} onChange={(e) => setOccupierSearch(e.target.value)} />
                        <div className="mt-2 max-h-48 overflow-auto rounded-md border">
                          {occupierOptions.length === 0 ? (
                            <p className="p-3 text-sm text-muted-foreground">No occupiers found.</p>
                          ) : (
                            occupierOptions.map((o) => (
                              <button
                                key={o.id}
                                type="button"
                                onClick={() => {
                                  setSelectedOccupier(o);
                                  set("occupierId", o.id);
                                }}
                                className={cn("flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted", form.occupierId === o.id && "bg-primary/5")}
                              >
                                <span>
                                  <span className="block font-medium">{fullName(o, true) || "Unnamed"}</span>
                                  <span className="block text-xs text-muted-foreground">{[o.Email, o.MobileNo].filter(Boolean).join(" · ")}</span>
                                </span>
                                {form.occupierId === o.id && <Check className="h-4 w-4 text-primary" />}
                              </button>
                            ))
                          )}
                        </div>
                      </Field>
                    ) : (
                      <>
                        <div className="grid gap-4 sm:grid-cols-[100px_1fr_1fr]">
                          <Field label="Title">
                            <Select value={form.occTitle} onValueChange={(v) => set("occTitle", v)}>
                              <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
                              <SelectContent>{(meta?.titles ?? []).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                            </Select>
                          </Field>
                          <Field label="First Name" required error={errors.occFirstName}>
                            <Input value={form.occFirstName} onChange={(e) => set("occFirstName", e.target.value)} />
                          </Field>
                          <Field label="Surname">
                            <Input value={form.occSurname} onChange={(e) => set("occSurname", e.target.value)} />
                          </Field>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field label="Date of Birth">
                            <Input type="date" value={form.occDob} onChange={(e) => set("occDob", e.target.value)} />
                          </Field>
                          <Field label="Contact Number">
                            <Input value={form.occPhone} onChange={(e) => set("occPhone", e.target.value)} />
                          </Field>
                          <Field label="Email Address" error={errors.occEmail} className="sm:col-span-2">
                            <Input type="email" value={form.occEmail} onChange={(e) => set("occEmail", e.target.value)} />
                            <p className="text-xs text-muted-foreground">With an email, the occupier gets a portal login and a welcome email.</p>
                          </Field>
                        </div>
                      </>
                    )}

                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">Additional Occupiers <span className="font-normal text-muted-foreground">(Optional)</span></p>
                          <p className="text-xs text-muted-foreground">Other household members who will be living at the property.</p>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => setAddingMember({ name: "", dateOfBirth: "", relationship: "" })}>
                          <Plus className="mr-1 h-4 w-4" /> Add Occupier
                        </Button>
                      </div>
                      {addingMember && (
                        <div className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_140px_140px_auto]">
                          <Input placeholder="Full name" aria-label="Full name" value={addingMember.name} onChange={(e) => setAddingMember({ ...addingMember, name: e.target.value })} />
                          <Input type="date" aria-label="Date of birth" value={addingMember.dateOfBirth} onChange={(e) => setAddingMember({ ...addingMember, dateOfBirth: e.target.value })} />
                          <Select value={addingMember.relationship} onValueChange={(v) => setAddingMember({ ...addingMember, relationship: v })}>
                            <SelectTrigger><SelectValue placeholder="Relationship" /></SelectTrigger>
                            <SelectContent>{(meta?.relationships ?? []).map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                          </Select>
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              size="sm"
                              disabled={!addingMember.name.trim()}
                              onClick={() => {
                                set("additionalOccupiers", [...form.additionalOccupiers, { ...addingMember, name: addingMember.name.trim() }]);
                                setAddingMember(null);
                              }}
                            >
                              Add
                            </Button>
                            <Button type="button" size="sm" variant="ghost" onClick={() => setAddingMember(null)} aria-label="Cancel">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                      {form.additionalOccupiers.length > 0 && (
                        <table className="w-full rounded-lg border text-sm">
                          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                            <tr><th className="p-2">Name</th><th className="p-2">Date of Birth</th><th className="p-2">Relationship</th><th className="p-2 text-right">Actions</th></tr>
                          </thead>
                          <tbody>
                            {form.additionalOccupiers.map((m, i) => (
                              <tr key={i} className="border-t">
                                <td className="p-2">{m.name}</td>
                                <td className="p-2">{m.dateOfBirth ? fmtDate(m.dateOfBirth) : "-"}</td>
                                <td className="p-2">{m.relationship || "-"}</td>
                                <td className="p-2 text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button type="button" variant="ghost" size="icon" aria-label="Member actions"><MoreVertical className="h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => set("additionalOccupiers", form.additionalOccupiers.filter((_, j) => j !== i))}
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" /> Remove
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </Panel>
                </div>
              </div>
            </div>
          )}

          {/* Step 4 — Dates & rate */}
          {step === 3 && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Panel icon={CalendarDays} title="Occupancy Dates">
                <Field label="Proposed Move In Date" required error={errors.moveInDate}>
                  <Input type="date" value={form.moveInDate} onChange={(e) => set("moveInDate", e.target.value)} />
                </Field>
                <Field label="Expected Move Out Date" error={errors.expectedMoveOutDate}>
                  <Input type="date" min={form.moveInDate || undefined} value={form.expectedMoveOutDate} onChange={(e) => set("expectedMoveOutDate", e.target.value)} />
                </Field>
                <Field label="Length of Occupancy">
                  <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                    {nights ? `${nights} night${nights === 1 ? "" : "s"}` : "Ongoing / Not set"}
                  </div>
                </Field>
              </Panel>
              <Panel title="Financial Details">
                <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
                  <Field label={`${freq?.rateLabel || "Rate"} (£)`} required error={errors.rateAmount}>
                    <Input type="number" min="0" step="0.01" inputMode="decimal" value={form.rateAmount} onChange={(e) => set("rateAmount", e.target.value)} />
                  </Field>
                  <Field label="Frequency">
                    <Select value={form.rateFrequency} onValueChange={(v) => set("rateFrequency", v as RateFrequency)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(meta?.rateFrequencies ?? []).map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                {propertyRent && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed px-3 py-2 text-sm">
                    <span className="text-muted-foreground">
                      Property rent: <span className="font-medium text-foreground">{money(propertyRent)} pcm</span>
                      {rentFreq !== "MONTHLY" && (
                        <> = <span className="font-medium text-foreground">{money(convertedRent)} {freqOf(meta, rentFreq)?.short}</span></>
                      )}
                      {usingPropertyRent && " · in use"}
                    </span>
                    {!usingPropertyRent && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          set("rateFrequency", rentFreq);
                          set("rateAmount", String(convertedRent));
                        }}
                      >
                        Use property rent
                      </Button>
                    )}
                  </div>
                )}
                <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-2">
                  <p className="font-medium">Estimated Income (based on dates)</p>
                  <div className="flex justify-between"><span className="text-muted-foreground">{freq?.rateLabel || "Rate"}</span><span>{form.rateAmount ? money(Number(form.rateAmount)) : "-"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Estimated Nights</span><span>{nights ?? "To be calculated"}</span></div>
                  <div className="flex justify-between border-t pt-2 font-semibold"><span>Estimated Income</span><span>{income != null ? money(income) : "-"}</span></div>
                </div>
              </Panel>
            </div>
          )}

          {/* Step 5 — Handover */}
          {step === 4 && (
            <div className="grid gap-6">
              <Panel title="Booking-In Appointment" subtitle="Assign a booking-in appointment for key handover and initial checks.">
                <div className="grid gap-4 sm:grid-cols-[1fr_150px_120px]">
                  <Field label="Assign To" required error={errors.bookingAssignedToId}>
                    <Select value={form.bookingAssignedToId} onValueChange={(v) => set("bookingAssignedToId", v)}>
                      <SelectTrigger><SelectValue placeholder="Select staff member" /></SelectTrigger>
                      <SelectContent>
                        {staff.map((u) => <SelectItem key={u.id} value={u.id}>{staffName(u)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Date" required error={errors.bookingDate}>
                    <Input type="date" value={form.bookingDate} onChange={(e) => set("bookingDate", e.target.value)} />
                  </Field>
                  <Field label="Time" required error={errors.bookingTime}>
                    <Input type="time" value={form.bookingTime} onChange={(e) => set("bookingTime", e.target.value)} />
                  </Field>
                </div>
                <Field label="Notes (Optional)">
                  <Textarea rows={4} placeholder="Add any notes for the booking-in appointment..." value={form.bookingNotes} onChange={(e) => set("bookingNotes", e.target.value)} />
                </Field>
              </Panel>
            </div>
          )}

          {/* Step 6 — Review */}
          {step === 5 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Review the details below and create the occupancy.</p>
              <div className="grid gap-4 lg:grid-cols-3">
                <ReviewBlock
                  title="Property"
                  rows={[
                    ["Address", selectedProperty?.addressLine1],
                    ["Area", addressSub(selectedProperty)],
                    ["Type", selectedProperty?.propertyTypeCategory],
                    ["Bedrooms", selectedProperty?.bedrooms],
                    ["Landlord", [selectedProperty?.vendor?.firstName, selectedProperty?.vendor?.lastName].filter(Boolean).join(" ")],
                    ["Status", selectedProperty?.currentStatus],
                  ]}
                />
                <ReviewBlock
                  title="Occupancy Type"
                  rows={[
                    ["Type", typeMeta?.longLabel],
                    [form.type === "COUNCIL" ? "Council" : "Customer", payerDisplay],
                    ["Contact", form.type === "COUNCIL" ? form.councilContactName : form.customerEmail],
                    ["Reference", form.type === "COUNCIL" ? form.councilReference : form.customerPhone],
                    ["Team", form.type === "COUNCIL" ? form.councilTeam : ""],
                    ["Documents", form.type === "PRIVATE" && documents.length ? `${documents.length} file(s)` : ""],
                  ]}
                />
                <ReviewBlock
                  title="Occupier"
                  rows={[
                    ["Name", occupierDisplay],
                    ["DOB", form.occupierMode === "new" && form.occDob ? fmtDate(form.occDob) : selectedOccupier?.dateOfBirth ? fmtDate(selectedOccupier.dateOfBirth) : ""],
                    ["Phone", form.occupierMode === "new" ? form.occPhone : selectedOccupier?.MobileNo],
                    ["Email", form.occupierMode === "new" ? form.occEmail : selectedOccupier?.Email],
                    ["Household", form.additionalOccupiers.length ? `+${form.additionalOccupiers.length} (${form.additionalOccupiers.map((m) => m.name).join(", ")})` : ""],
                  ]}
                />
                <ReviewBlock
                  title="Dates & Rate"
                  rows={[
                    ["Move In Date", fmtDate(form.moveInDate)],
                    ["Expected Move Out", form.expectedMoveOutDate ? fmtDate(form.expectedMoveOutDate) : "Not set"],
                    [freq?.rateLabel || "Rate", form.rateAmount ? money(Number(form.rateAmount)) : "-"],
                    ["Estimated Income", income != null ? money(income) : "-"],
                  ]}
                />
                <ReviewBlock
                  title="Booking-In Appointment"
                  rows={[
                    ["Assigned To", staffName(assignedStaff)],
                    ["Date", fmtDate(form.bookingDate)],
                    ["Time", form.bookingTime],
                  ]}
                />
                <div className="surface p-4 text-sm space-y-2">
                  <h4 className="font-semibold">What happens next</h4>
                  <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                    <li>The occupancy is created as <strong>{meta?.statuses.find((s) => s.value === "PENDING")?.label}</strong>.</li>
                    {(form.occupierMode === "new" ? form.occEmail : selectedOccupier?.Email) && <li>The occupier is emailed their {typeMeta?.label.toLowerCase()} occupancy details and portal access.</li>}
                    <li>{staffName(assignedStaff) || "The assigned staff member"} is emailed the booking-in details.</li>
                    <li>Woodland's team inbox is notified.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-5">
            <Button type="button" variant="outline" onClick={step === 0 ? () => navigate("/occupancy") : back}>
              <ArrowLeft className="mr-2 h-4 w-4" /> {step === 0 ? "Cancel" : "Back"}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={next}>
                {nextLabel} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={submit} disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Create Occupancy
              </Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
