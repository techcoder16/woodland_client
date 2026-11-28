import { useEffect, useMemo, useRef, useState } from "react";
import { bankAccountLabel, fetchVendorBankAccounts, type VendorBankAccount } from "@/components/vendors/VendorBankAccounts";
import { jobRef } from "@/utils/contractorLabel";
import { Link, useSearchParams } from "react-router-dom";
import { AutoHint } from "@/components/ui/hint";
import { uploadFileOnce } from "@/helper/fileUpload";
import { ArrowLeft, ArrowRight, Check, Download, FileText, Loader2, Plus, Trash2, Upload, Wand2, Wrench, X } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchProperties } from "@/redux/dataStore/propertySlice";
import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks";
import { get, post } from "@/helper/api";
import { formatPropertyReference } from "@/utils/propertyReference";
import { fetchVendors } from "@/redux/dataStore/vendorSlice";
import { useToast } from "@/components/ui/use-toast";
import PropertyPicker from "@/utils/PropertyPicker";
import VendorSearchSelect from "@/utils/VendorSearchSelect";
import MonthYearPicker from "@/utils/MonthYearPicker";
import { exportPaymentReviewToPdf } from "@/utils/transactionExport";

const API_URL = import.meta.env.VITE_API_URL;
const money = (value: unknown) =>
  `£${Number(value || 0).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const STEPS = ["Payment Details", "Review & Confirm", "Complete"] as const;

// jobTypeId is set when the line came from a completed maintenance job, so
// the server can track how much of that job has been recharged — a job can
// be recharged in parts, and keeps being offered until nothing is left.
// deductionId is set when the line recovers part or all of a property deduction.
type Adjustment = { id: string; type: string; description?: string; relatedTo?: string; amount: number; jobTypeId?: string; deductionId?: string };
// A deduction still owed to the landlord-side ledger, offered on payments due on or after its date.
type BillableDeduction = { id: string; description: string; date: string; amount: number; outstanding: number };
type PeriodCheck = { exists: boolean; transaction: { id: string; reference?: string; status?: string; toLandlordNetPaid?: number; paidAt?: string } | null };
// total = landlord charge for the job, charged = recharged on earlier
// payments, amount = what's left to recharge.
type BillableJob = { id: string; jobType: string; description?: string; dateDone?: string; total: number; charged: number; amount: number };
type RechargeMode = "FULL" | "PERCENT" | "FIXED";

const ADJUSTMENT_TYPES = ["Maintenance Recharge", "Management Fee", "VAT", "Other"];

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
// The accounting period picker works in "November 2026"; the API uses "2026-11".
const periodLabel = (ym: string) => {
  const match = /^(\d{4})-(\d{2})$/.exec(ym);
  return match ? `${MONTH_NAMES[Number(match[2]) - 1]} ${match[1]}` : ym;
};
const labelToPeriod = (label: string) => {
  const [month, year] = label.split(" ");
  const index = MONTH_NAMES.indexOf(month);
  return index >= 0 && /^\d{4}$/.test(year || "") ? `${year}-${String(index + 1).padStart(2, "0")}` : "";
};
const dmy = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};

export default function NewLandlordPayment() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  // Every published property (the shared store only holds one page of 10).
  const { properties: pagedProperties } = useAppSelector((state) => state.properties);
  const [allProperties, setAllProperties] = useState<any[] | null>(null);
  const properties = allProperties ?? pagedProperties;
  const { vendors } = useAppSelector((state) => state.vendors);

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [createdTransaction, setCreatedTransaction] = useState<any>(null);

  const [vendorId, setVendorId] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [payment, setPayment] = useState({
    paymentDate: new Date().toISOString().slice(0, 10),
    accountingPeriod: new Date().toLocaleString("en-GB", { month: "long", year: "numeric" }),
    description: "",
    contractualRent: "",
    paymentMethod: "Bank Transfer",
    bankAccountLabel: "",
    expectedPaymentDate: new Date().toISOString().slice(0, 10),
    paymentReference: "",
  });
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [documents, setDocuments] = useState<{ name: string; file: File }[]>([]);
  const docInputRef = useRef<HTMLInputElement>(null);
  const adjFileInputRef = useRef<HTMLInputElement>(null);

  // Add/edit-adjustment popup state
  const [adjModalOpen, setAdjModalOpen] = useState(false);
  const [editingAdjId, setEditingAdjId] = useState<string | null>(null);
  const [adjForm, setAdjForm] = useState({ type: ADJUSTMENT_TYPES[0], description: "", relatedTo: "", amount: "" });
  const [adjFile, setAdjFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    dispatch(fetchProperties({ page: 1, search: "", propertyStatus: "PUBLISHED" }));
    void get<{ items?: any[] }>("properties?page=1&limit=5000&search=&propertyStatus=PUBLISHED").then(({ data }) => {
      if (data?.items) setAllProperties(data.items);
    });
    dispatch(fetchVendors({ page: 1, search: "" }));
  }, [dispatch]);

  // PropertyPicker searches the server, so the pick may not be in the
  // redux list (page 1 only) — fetch it by id for rent and details.
  const [fetchedProperty, setFetchedProperty] = useState<any>(null);
  useEffect(() => {
    if (!propertyId) { setFetchedProperty(null); return; }
    let cancelled = false;
    get<any>(`properties/${propertyId}`).then(({ data }) => { if (!cancelled) setFetchedProperty(data || null); });
    return () => { cancelled = true; };
  }, [propertyId]);
  const selectedProperty: any = useMemo(
    () => (fetchedProperty?.id === propertyId ? fetchedProperty : properties.find((property) => property.id === propertyId)),
    [fetchedProperty, properties, propertyId],
  );
  const selectedVendor: any = useMemo(
    () => vendors.find((vendor: any) => vendor.id === vendorId),
    [vendors, vendorId],
  );

  // Contractual rent = the property's "Rent per month" (Management Agreement
  // step). Stored as free text ("7,000", "£7000") — keep digits only.
  const propertyRent = Number(String(selectedProperty?.rentPerMonth ?? "").replace(/[^0-9.]/g, "")) || 0;
  // Filled in whenever the property changes; still editable for a part month.
  useEffect(() => {
    setPayment((current) => ({ ...current, contractualRent: propertyRent ? String(propertyRent) : "" }));
  }, [selectedProperty?.id, propertyRent]);

  // Completed maintenance jobs on this property not yet billed to the landlord.
  const [billableJobs, setBillableJobs] = useState<BillableJob[]>([]);
  useEffect(() => {
    setBillableJobs([]);
    if (!propertyId) return;
    let cancelled = false;
    get<BillableJob[]>(`transaction/billable-jobs?propertyId=${propertyId}`).then(({ data }) => {
      if (!cancelled && Array.isArray(data)) setBillableJobs(data);
    });
    return () => { cancelled = true; };
  }, [propertyId]);
  const unaddedJobs = billableJobs.filter((job) => !adjustments.some((a) => a.jobTypeId === job.id));

  // Opened from a property's Rent Due row: landlord, property, accounting period
  // and expected payment date (the rent due date) arrive prefilled.
  const [searchParams] = useSearchParams();
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current) return;
    prefilled.current = true;
    const qVendor = searchParams.get("vendorId");
    const qProperty = searchParams.get("propertyId");
    const qPeriod = searchParams.get("period") || "";
    const qDue = searchParams.get("due") || "";
    if (qVendor) setVendorId(qVendor);
    if (qProperty) setPropertyId(qProperty);
    setPayment((current) => ({
      ...current,
      ...(/^\d{4}-\d{2}$/.test(qPeriod) ? { accountingPeriod: periodLabel(qPeriod) } : {}),
      ...(/^\d{4}-\d{2}-\d{2}$/.test(qDue) ? { expectedPaymentDate: qDue } : {}),
    }));
  }, [searchParams]);

  // Rent is paid once per property per accounting period. Check the period
  // whenever the property or period changes; the server also rejects a duplicate with 409.
  const periodKey = labelToPeriod(payment.accountingPeriod);
  const periodScope = propertyId && periodKey ? `${propertyId}|${periodKey}` : "";
  const [periodRefresh, setPeriodRefresh] = useState(0);
  const [periodCheck, setPeriodCheck] = useState<{ scope: string; result: PeriodCheck | null } | null>(null);
  useEffect(() => {
    if (!periodScope) return;
    let cancelled = false;
    get<PeriodCheck>(`transaction/period-status?propertyId=${propertyId}&period=${periodKey}`).then(({ data }) => {
      if (!cancelled) setPeriodCheck({ scope: periodScope, result: data ?? null });
    });
    return () => { cancelled = true; };
  }, [periodScope, propertyId, periodKey, periodRefresh]);
  // undefined while the check for the current property + period is still in flight.
  const periodCurrent = periodCheck?.scope === periodScope ? periodCheck.result : undefined;
  const periodChecking = !!periodScope && periodCurrent === undefined;
  const periodTaken = !!periodCurrent?.exists;
  const periodTransaction = periodCurrent?.transaction;
  const saveBlocked = saving || periodChecking || periodTaken;

  // Outstanding property deductions dated up to the payment's due date (the rent
  // period ends on the due date), offered the same way as billable maintenance jobs.
  const [billableDeductions, setBillableDeductions] = useState<BillableDeduction[]>([]);
  useEffect(() => {
    setBillableDeductions([]);
    if (!propertyId || !payment.expectedPaymentDate) return;
    let cancelled = false;
    get<BillableDeduction[]>(`transaction/billable-deductions?propertyId=${propertyId}&upTo=${payment.expectedPaymentDate}`).then(({ data }) => {
      if (!cancelled && Array.isArray(data)) setBillableDeductions(data);
    });
    return () => { cancelled = true; };
  }, [propertyId, payment.expectedPaymentDate]);
  const unaddedDeductions = billableDeductions.filter((d) => !adjustments.some((a) => a.deductionId === d.id));

  // Deduction popup: recover all that is outstanding, or a lower amount (part recovery).
  const [deductionDraft, setDeductionDraft] = useState<{ deduction: BillableDeduction; adjId: string | null; value: string } | null>(null);
  const deductionAmount = Number(deductionDraft?.value || 0);
  const deductionError = !deductionDraft ? ""
    : deductionAmount <= 0 ? "Enter an amount above £0"
    : deductionAmount > deductionDraft.deduction.outstanding + 0.005 ? `Only ${money(deductionDraft.deduction.outstanding)} is outstanding`
    : "";
  const openDeduction = (deduction: BillableDeduction, adj?: Adjustment) => {
    setDeductionDraft({ deduction, adjId: adj?.id ?? null, value: String(adj ? Math.abs(adj.amount) : deduction.outstanding) });
  };
  const saveDeduction = () => {
    if (!deductionDraft || deductionError) return;
    const { deduction, adjId } = deductionDraft;
    const entry: Adjustment = {
      id: adjId || crypto.randomUUID(),
      type: "Deduction",
      description: deduction.description,
      relatedTo: deduction.date
        ? `Deduction added ${dmy(deduction.date)}`
        : adjustments.find((a) => a.id === adjId)?.relatedTo,
      amount: -Math.round(deductionAmount * 100) / 100,
      deductionId: deduction.id,
    };
    setAdjustments((prev) => (adjId ? prev.map((a) => (a.id === adjId ? entry : a)) : [...prev, entry]));
    setDeductionDraft(null);
  };

  // Recharge popup: charge all of what's left on a job, a % of the job's
  // total, or a fixed amount — anything left over is offered again on the
  // next landlord payment for this property.
  const [rechargeJob, setRechargeJob] = useState<BillableJob | null>(null);
  const [rechargeAdjId, setRechargeAdjId] = useState<string | null>(null);
  const [rechargeMode, setRechargeMode] = useState<RechargeMode>("FULL");
  const [rechargeValue, setRechargeValue] = useState("");
  const rechargeAmount = !rechargeJob ? 0
    : rechargeMode === "FULL" ? rechargeJob.amount
    : rechargeMode === "PERCENT" ? Math.round(rechargeJob.total * Number(rechargeValue || 0)) / 100
    : Number(rechargeValue || 0);
  const rechargeError = rechargeAmount <= 0 ? "Enter an amount above £0"
    : rechargeJob && rechargeAmount > rechargeJob.amount + 0.005 ? `Only ${money(rechargeJob.amount)} is left to recharge`
    : "";

  const openRecharge = (job: BillableJob, adj?: Adjustment) => {
    setRechargeJob(job);
    setRechargeAdjId(adj?.id ?? null);
    const current = adj ? Math.abs(adj.amount) : job.amount;
    setRechargeMode(current >= job.amount ? "FULL" : "FIXED");
    setRechargeValue(current >= job.amount ? "" : String(current));
  };
  const saveRecharge = () => {
    if (!rechargeJob || rechargeError) return;
    const job = rechargeJob;
    const leftAfter = Math.round((job.amount - rechargeAmount) * 100) / 100;
    const entry: Adjustment = {
      id: rechargeAdjId || crypto.randomUUID(),
      type: "Maintenance Recharge",
      description: job.description ? `${job.jobType} — ${job.description}` : job.jobType,
      relatedTo: [
        job.dateDone ? `Job completed ${job.dateDone}` : "Maintenance job",
        leftAfter > 0 ? `part ${money(rechargeAmount)} of ${money(job.total)}, ${money(leftAfter)} left` : null,
      ].filter(Boolean).join(" · "),
      amount: -Math.abs(rechargeAmount),
      jobTypeId: job.id,
    };
    setAdjustments((prev) => (rechargeAdjId ? prev.map((a) => (a.id === rechargeAdjId ? entry : a)) : [...prev, entry]));
    setRechargeJob(null);
  };

  // Auto-generated reference shown in the form (month/year follows the
  // payment date). Only a reference the user types is sent — otherwise the
  // server issues the real one on save, which matches this unless another
  // payment was saved in the meantime.
  const [referencePreview, setReferencePreview] = useState("");
  useEffect(() => {
    let cancelled = false;
    get<{ reference: string }>(`transaction/next-reference?date=${payment.paymentDate}`).then(({ data }) => {
      if (!cancelled && data?.reference) setReferencePreview(data.reference);
    });
    return () => { cancelled = true; };
  }, [payment.paymentDate, step]);
  const typedReference = payment.paymentReference.trim();

  // The landlord's bank accounts. Preselected: the account this property's last
  // payment went to, else the landlord's default. The choice is remembered on
  // the property when the payment is saved.
  const [bankAccounts, setBankAccounts] = useState<VendorBankAccount[]>([]);
  const [bankAccountId, setBankAccountId] = useState("");
  const [makePropertyDefault, setMakePropertyDefault] = useState(false);
  useEffect(() => {
    setBankAccounts([]);
    setBankAccountId("");
    if (!vendorId) return;
    let cancelled = false;
    fetchVendorBankAccounts(vendorId).then((list) => {
      if (!cancelled) setBankAccounts(list);
    });
    return () => { cancelled = true; };
  }, [vendorId]);
  useEffect(() => {
    if (!bankAccounts.length) return;
    const remembered = bankAccounts.find((a) => a.id === selectedProperty?.landlordBankAccountId);
    setBankAccountId((remembered ?? bankAccounts.find((a) => a.isDefault) ?? bankAccounts[0]).id);
  }, [bankAccounts, selectedProperty?.landlordBankAccountId]);
  const selectedBankAccount = bankAccounts.find((a) => a.id === bankAccountId);

  // What the bank account box shows by default; saved unless the user types their own.
  const defaultBankLabel = selectedBankAccount
    ? bankAccountLabel(selectedBankAccount)
    : selectedVendor?.bankName
      ? `${selectedVendor.bankName} (${selectedVendor.bankSortCode || ""} | ${selectedVendor.bankAccountNo || ""})`
      : "";

  // The due date comes from the property's rent schedule for the accounting
  // period and cannot be changed by hand (the server sets it the same way).
  const [scheduleDue, setScheduleDue] = useState<Record<string, string>>({});
  useEffect(() => {
    setScheduleDue({});
    if (!propertyId) return;
    let cancelled = false;
    get<{ rows?: { period: string; dueDate: string }[] }>(`transaction/rent-schedule?propertyId=${propertyId}`).then(({ data }) => {
      if (cancelled) return;
      setScheduleDue(Object.fromEntries((data?.rows ?? []).map((r) => [r.period, String(r.dueDate).slice(0, 10)])));
    });
    return () => { cancelled = true; };
  }, [propertyId]);
  const lockedDueDate = periodKey ? scheduleDue[periodKey] : undefined;
  useEffect(() => {
    // The rent due date comes from the property; the payment date stays the user's own.
    if (lockedDueDate) setPayment((current) => (current.expectedPaymentDate === lockedDueDate ? current : { ...current, expectedPaymentDate: lockedDueDate }));
  }, [lockedDueDate]);
  // The rent period the payment covers: this period's due date up to the day before the next one.
  const nextPeriodKey = periodKey
    ? (() => {
        const [y, m] = periodKey.split("-").map(Number);
        return `${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, "0")}`;
      })()
    : "";
  const rentPeriodEnd = (() => {
    if (!lockedDueDate) return "";
    const next = scheduleDue[nextPeriodKey];
    const base = next ? new Date(`${next}T00:00:00Z`) : (() => { const d = new Date(`${lockedDueDate}T00:00:00Z`); d.setUTCMonth(d.getUTCMonth() + 1); return d; })();
    base.setUTCDate(base.getUTCDate() - 1);
    return base.toISOString().slice(0, 10);
  })();
  const dmyIso = (iso: string) => (iso ? iso.split("-").reverse().join("/") : "");

  // Total of the source, and what is left after this payment (carried to the next payment).
  const lineBalance = (a: Adjustment) => {
    const taken = Math.abs(a.amount);
    const job = a.jobTypeId ? billableJobs.find((j) => j.id === a.jobTypeId) : undefined;
    if (job) return { total: job.total, remaining: Math.max(0, Math.round((job.amount - taken) * 100) / 100) };
    const d = a.deductionId ? billableDeductions.find((x) => x.id === a.deductionId) : undefined;
    if (d) return { total: d.amount, remaining: Math.max(0, Math.round((d.outstanding - taken) * 100) / 100) };
    return { total: taken, remaining: 0 };
  };

  const adjustmentTotal = adjustments.reduce((sum, a) => sum + Number(a.amount || 0), 0);
  const netPayable = Number(payment.contractualRent || 0) + adjustmentTotal;

  const updatePayment = (key: keyof typeof payment, value: string) => {
    setPayment((current) => ({ ...current, [key]: value }));
  };

  // ---- Adjustment popup ----
  const openAddAdjustment = () => {
    setEditingAdjId(null);
    setAdjForm({ type: ADJUSTMENT_TYPES[0], description: "", relatedTo: "", amount: "" });
    setAdjFile(null);
    setAdjModalOpen(true);
  };

  const openEditAdjustment = (adj: Adjustment) => {
    const job = adj.jobTypeId && billableJobs.find((j) => j.id === adj.jobTypeId);
    if (job) { openRecharge(job, adj); return; }
    if (adj.deductionId) {
      const deduction = billableDeductions.find((d) => d.id === adj.deductionId);
      openDeduction(deduction ?? { id: adj.deductionId, description: adj.description || "", date: "", amount: Math.abs(adj.amount), outstanding: Math.abs(adj.amount) }, adj);
      return;
    }
    setEditingAdjId(adj.id);
    setAdjForm({ type: adj.type, description: adj.description || "", relatedTo: adj.relatedTo || "", amount: String(Math.abs(adj.amount)) });
    setAdjFile(null);
    setAdjModalOpen(true);
  };

  const deleteAdjustment = (id: string) => {
    setAdjustments((prev) => prev.filter((a) => a.id !== id));
  };

  const saveAdjustment = () => {
    if (!adjForm.amount) {
      toast({ title: "Enter an amount", variant: "destructive" });
      return;
    }
    const amount = -Math.abs(Number(adjForm.amount)); // adjustments are deductions from the contractual rent
    const entry: Adjustment = {
      id: editingAdjId || crypto.randomUUID(),
      type: adjForm.type,
      description: adjForm.description || undefined,
      relatedTo: adjForm.relatedTo || undefined,
      amount,
    };
    setAdjustments((prev) => (editingAdjId ? prev.map((a) => (a.id === editingAdjId ? entry : a)) : [...prev, entry]));
    setAdjModalOpen(false);
  };

  // Uploads the adjustment popup's supporting PDF/image to Woodland OCR and
  // pre-fills the form from whatever it found — the user still reviews and
  // confirms before it's added as a line item.
  const extractFromDocument = async () => {
    if (!adjFile) return;
    setExtracting(true);
    try {
      const { id: fileId } = await uploadFileOnce(adjFile, { category: "transaction-document", entityType: "transaction" });
      const { data, error } = await post<any>("transaction/extract-adjustments", { fileId });
      if (error) throw new Error(error.message);
      const first = data?.adjustments?.[0];
      if (first) {
        setAdjForm((f) => ({
          ...f,
          type: first.type || f.type,
          description: first.description || data.suggestedDescription || f.description,
          amount: String(Math.abs(first.amount)),
        }));
        toast({ title: "Extracted from document", description: `Found: ${first.type} — ${money(Math.abs(first.amount))}` });
      } else {
        toast({ title: "No adjustment found", description: "OCR couldn't find an adjustment amount on this document. Enter it manually.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Extraction failed", description: error.message || "Could not process this document.", variant: "destructive" });
    } finally {
      setExtracting(false);
    }
  };

  // ---- Supporting documents ----
  const addDocuments = (files: FileList | null) => {
    if (!files) return;
    setDocuments((prev) => [...prev, ...Array.from(files).map((file) => ({ name: file.name, file }))]);
  };
  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  // Step 1 -> Step 2: both landlord and property must be selected before
  // anything else unlocks — there is no path to create a payment without
  // a landlord attached.
  // Same fields as the Review & Confirm step, plus the adjustment lines.
  const downloadReviewPdf = () => {
    const reference = typedReference || referencePreview;
    exportPaymentReviewToPdf({
      details: [
        ["Landlord", selectedVendor ? `${selectedVendor.firstName} ${selectedVendor.lastName}` : "-"],
        ["Property", `${formatPropertyReference((selectedProperty as any)?.propertyNumber)} · ${selectedProperty?.addressLine1 || "-"}`],
        ["Payment date", new Date(payment.paymentDate).toLocaleDateString("en-GB")],
        ["Accounting period", payment.accountingPeriod],
        ["Payment method", payment.paymentMethod],
        ["Payment reference", reference || "Auto-generated on save"],
        ["Documents", `${documents.length} attached`],
      ],
      adjustments,
      contractualRent: Number(payment.contractualRent || 0),
      adjustmentTotal,
      netPayable,
    }, `landlord-payment-${reference || "review"}.pdf`);
  };

  const goToReview = () => {
    if (!vendorId) {
      toast({ title: "Select a landlord", description: "Choose a landlord before continuing.", variant: "destructive" });
      return;
    }
    if (!propertyId) {
      toast({ title: "Select a property", description: "Choose a property before continuing.", variant: "destructive" });
      return;
    }
    if (!periodKey) {
      toast({ title: "Select the accounting period", description: "Choose the month this rent covers.", variant: "destructive" });
      return;
    }
    if (periodTaken) {
      toast({ title: "Rent already recorded", description: `Rent for ${payment.accountingPeriod} is already recorded for this property.`, variant: "destructive" });
      return;
    }
    if (!payment.contractualRent) {
      toast({ title: "Enter the contractual rent", description: "Contractual rent is required to calculate the net payable amount.", variant: "destructive" });
      return;
    }
    setStep(1);
  };

  // Step 2 -> creates the transaction, then uploads any supporting
  // documents against it. helper/api.ts's post() attaches a fresh
  // Idempotency-Key per call, so double-submits don't create duplicates.
  const confirmAndCreate = async (status: "DRAFT" | "ACTIVE") => {
    setSaving(true);
    try {
      const { data, error } = await post<any>("transaction", {
        propertyId,
        status,
        accountingPeriod: periodKey || undefined,
        toLandlordDate: payment.paymentDate,
        toLandlordRentReceived: Number(payment.contractualRent) || 0,
        toLandlordNetPaid: netPayable,
        toLandLordMode: payment.paymentMethod,
        toLandlordChequeNo: payment.paymentReference || undefined,
        toLandlordExpenditureDescription: payment.description,
        toLandlordPaidBy: selectedVendor ? `${selectedVendor.firstName} ${selectedVendor.lastName}`.trim() : undefined,
        bankAccountLabel: payment.bankAccountLabel || defaultBankLabel || undefined,
        bankAccountId: selectedBankAccount?.id || undefined,
        setPropertyDefaultBank: selectedBankAccount && makePropertyDefault ? true : undefined,
        paymentReference: typedReference || undefined,
        expectedPaymentDate: payment.expectedPaymentDate || undefined,
        adjustments: adjustments.map(({ id, ...rest }) => rest),
        jobTypeIds: adjustments.map((a) => a.jobTypeId).filter(Boolean),
      });
      if (error) throw new Error(error.message);
      const transaction = data?.transaction || data;

      // The payment already exists at this point, so a failed upload is
      // reported rather than blocking — it can be re-attached from the
      // payment's Documents tab.
      if (documents.length && transaction?.id) {
        const results = await Promise.all(
          documents.map(async ({ file }) => {
            try {
              const { id: fileId } = await uploadFileOnce(file, { category: "transaction-document", entityType: "transaction", entityId: transaction.id });
              const { error: uploadError } = await post(`transaction/${transaction.id}/documents`, { fileId });
              return uploadError ? `${file.name}: ${uploadError.message}` : null;
            } catch (err: any) {
              return `${file.name}: ${err?.message || "upload failed"}`;
            }
          }),
        );
        const failed = results.filter(Boolean);
        if (failed.length) {
          toast({
            title: `${failed.length} of ${documents.length} document(s) failed to upload`,
            description: `${failed.join("\n")}\nOpen the payment's Documents tab to try again.`,
            variant: "destructive",
          });
        }
      }

      setCreatedTransaction(transaction);
      setStep(2);
    } catch (error: any) {
      // A 409 means the period was recorded elsewhere; re-check so the banner explains it.
      setPeriodRefresh((n) => n + 1);
      toast({ title: "Could not save payment", description: error.message || "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setStep(0);
    setCreatedTransaction(null);
    setVendorId("");
    setPropertyId("");
    setAdjustments([]);
    setDocuments([]);
    setPayment({
      paymentDate: new Date().toISOString().slice(0, 10),
      accountingPeriod: new Date().toLocaleString("en-GB", { month: "long", year: "numeric" }),
      description: "",
      contractualRent: "",
      paymentMethod: "Bank Transfer",
      bankAccountLabel: "",
      expectedPaymentDate: new Date().toISOString().slice(0, 10),
      paymentReference: "",
    });
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1500px] space-y-6">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-1 -ml-2">
            <Link to="/finance/landlord-payments"><ArrowLeft className="mr-1 h-4 w-4" />Back to Landlord Payments</Link>
          </Button>
          <p className="text-sm text-muted-foreground">Finance / Landlord Payments</p>
          <h1 className="text-2xl font-semibold">New Landlord Payment Transaction</h1>
          <p className="text-sm text-muted-foreground">Select a property, enter payment details, then review and confirm.</p>
        </div>

        <div className="flex items-center gap-3 text-sm">
          {STEPS.map((label, index) => (
            <div key={label} className="flex items-center gap-3">
              <div className={`flex items-center gap-2 ${index === step ? "text-primary font-medium" : index < step ? "text-emerald-600" : "text-muted-foreground"}`}>
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${index === step ? "bg-primary text-primary-foreground" : index < step ? "bg-emerald-600 text-white" : "border"}`}>
                  {index < step ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                {label}
              </div>
              {index < STEPS.length - 1 && <div className="h-px w-10 bg-border" />}
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            {step === 0 && (
              <section className="surface space-y-6 p-6">
                <h2 className="font-semibold">Property Payment Details</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <VendorSearchSelect
                    label="Landlord *"
                    value={vendorId}
                    onChange={(id) => { setVendorId(id); setPropertyId(""); }}
                  />
                  <PropertyPicker
                    label="Property *"
                    value={propertyId}
                    onChange={setPropertyId}
                    vendorId={vendorId}
                    disabled={!vendorId}
                    placeholder={vendorId ? "Search and select a property..." : "Select a landlord first"}
                  />
                </div>

                {propertyId && <>
                  {periodTaken && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                      <p className="font-medium">
                        Rent for {payment.accountingPeriod} has already been {periodTransaction?.status === "PAID" ? "paid" : periodTransaction?.status === "DRAFT" ? "recorded (Draft)" : "recorded"}
                        {periodTransaction?.reference ? ` (${periodTransaction.reference})` : ""}.
                      </p>
                      {periodTransaction?.id && (
                        <Link className="mt-1 inline-block font-medium underline" to={`/finance/landlord-payments?payment=${periodTransaction.id}`}>Open the existing payment</Link>
                      )}
                      <p className="mt-1 text-xs">Each rent period can only be paid once. Choose a different accounting period to record a payment.</p>
                    </div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2 border-t pt-5">
                    <div className="space-y-2"><Label>Payment date *</Label><Input type="date" value={payment.paymentDate} onChange={(event) => updatePayment("paymentDate", event.target.value)} /></div>
                    <div className="space-y-2">
                      <Label>Rent due date</Label>
                      <Input type="date" value={payment.expectedPaymentDate} disabled={!!lockedDueDate} onChange={(event) => updatePayment("expectedPaymentDate", event.target.value)} />
                      <p className="text-xs text-muted-foreground">
                        {lockedDueDate ? <>From the property's rent due date. Rent period {dmyIso(lockedDueDate)} – {dmyIso(rentPeriodEnd)}.</> : "No rent schedule for this period, so enter it."}
                      </p>
                    </div>
                    <div className="space-y-2"><Label>Accounting period *</Label><MonthYearPicker value={payment.accountingPeriod} onChange={(value) => updatePayment("accountingPeriod", value)} /></div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Description / notes</Label>
                      <Textarea value={payment.description} onChange={(event) => updatePayment("description", event.target.value)} placeholder="Monthly landlord payment, adjustments, or review notes" />
                    </div>
                  </div>

                  <div className="space-y-4 border-t pt-5">
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold">Payment Calculation</h2>
                    </div>
                    <div className="space-y-2 max-w-xs">
                      <Label>Contractual rent (£) *</Label>
                      <Input type="number" min="0" value={payment.contractualRent} onChange={(event) => updatePayment("contractualRent", event.target.value)} />
                      {propertyRent ? (
                        <p className="text-xs text-muted-foreground">
                          Property rent: <span className="font-medium text-foreground">{money(propertyRent)}</span> / month
                          {Number(payment.contractualRent) !== propertyRent && (
                            <> · <button type="button" className="text-primary underline" onClick={() => updatePayment("contractualRent", String(propertyRent))}>use property rent</button></>
                          )}
                        </p>
                      ) : selectedProperty ? (
                        <p className="text-xs text-amber-700">This property has no rent set. Add it in Edit Property → Management Agreement → Rent per month.</p>
                      ) : null}
                    </div>

                    <div className="rounded-lg border">
                      <div className="flex items-center justify-between border-b p-3">
                        <span className="text-sm font-medium">Adjustment Breakdown</span>
                        <Button size="sm" variant="outline" onClick={openAddAdjustment}><Plus className="mr-1.5 h-3.5 w-3.5" />Add Adjustment</Button>
                      </div>
                      {unaddedJobs.length > 0 && (
                        <div className="space-y-1.5 border-b bg-amber-50/60 p-3">
                          <p className="text-xs font-medium text-amber-800">Completed maintenance not yet charged to the landlord</p>
                          {unaddedJobs.map((job) => (
                            <div key={job.id} className="flex items-center justify-between gap-2 text-sm">
                              <span className="flex min-w-0 items-center gap-2">
                                <Wrench className="h-3.5 w-3.5 shrink-0 text-amber-700" />
                                <span className="truncate">{job.jobType}{job.description ? ` — ${job.description}` : ""}</span>
                                <Link to={`/maintenance/${job.id}`} target="_blank" className="shrink-0 font-mono text-xs text-primary underline">{jobRef(job.id)}</Link>
                              </span>
                              <span className="flex shrink-0 items-center gap-2">
                                <span className="text-right">
                                  <span className="font-medium">{money(job.amount)}</span>
                                  {job.charged > 0 && <span className="block text-xs text-muted-foreground">left of {money(job.total)}</span>}
                                </span>
                                <Button size="sm" variant="outline" className="h-7" onClick={() => openRecharge(job)}><Plus className="mr-1 h-3 w-3" />Add</Button>
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {unaddedDeductions.length > 0 && (
                        <div className="space-y-1.5 border-b bg-sky-50/60 p-3">
                          <p className="text-xs font-medium text-sky-800">Property deductions (Property › Finance › Deductions) outstanding up to {dmy(payment.expectedPaymentDate)}</p>
                          {unaddedDeductions.map((d) => (
                            <div key={d.id} className="flex items-center justify-between gap-2 text-sm">
                              <span className="min-w-0 truncate">
                                {d.description}
                                <span className="text-xs text-muted-foreground"> · {d.date ? dmy(d.date) : "-"}</span>
                              </span>
                              <span className="flex shrink-0 items-center gap-2">
                                <span className="text-right">
                                  <span className="font-medium">{money(d.outstanding)}</span>
                                  {d.amount !== d.outstanding && <span className="block text-xs text-muted-foreground">of {money(d.amount)}</span>}
                                </span>
                                <Button size="sm" variant="outline" className="h-7" onClick={() => openDeduction(d)}><Plus className="mr-1 h-3 w-3" />Add</Button>
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {!adjustments.length ? (
                        <p className="p-4 text-sm text-muted-foreground">No adjustments added.</p>
                      ) : (
                        <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] text-sm">
                          <thead className="bg-muted/40 text-left text-xs text-muted-foreground"><tr><th className="px-3 py-2 font-medium">Type<AutoHint for="Type" /></th><th className="px-3 py-2 font-medium">Description<AutoHint for="Description" /></th><th className="px-3 py-2 font-medium">Related To</th><th className="px-3 py-2 text-right font-medium">Total</th><th className="px-3 py-2 text-right font-medium">This payment (£)</th><th className="px-3 py-2 text-right font-medium">Remaining</th><th className="px-3 py-2 font-medium"></th></tr></thead>
                          <tbody>
                            {adjustments.map((a) => (
                              <tr key={a.id} className="border-t">
                                <td className="px-3 py-2">{a.type}</td>
                                <td className="px-3 py-2 text-muted-foreground">
                                  {a.description || "-"}
                                  {a.jobTypeId && <Link to={`/maintenance/${a.jobTypeId}`} target="_blank" className="ml-2 font-mono text-xs text-primary underline">{jobRef(a.jobTypeId)}</Link>}
                                </td>
                                <td className="px-3 py-2 text-muted-foreground">{a.relatedTo || "-"}</td>
                                <td className="px-3 py-2 text-right">{money(lineBalance(a).total)}</td>
                                <td className="px-3 py-2 text-right text-red-600">-{money(Math.abs(a.amount))}</td>
                                <td className={`px-3 py-2 text-right font-medium ${lineBalance(a).remaining > 0 ? "text-amber-700" : "text-emerald-700"}`}>{money(lineBalance(a).remaining)}</td>
                                <td className="px-3 py-2">
                                  <div className="flex justify-end gap-1">
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditAdjustment(a)}><FileText className="h-3.5 w-3.5" /></Button>
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteAdjustment(a.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t-2 bg-muted/30 font-semibold">
                              <td className="px-3 py-2" colSpan={3}>Total deductions</td>
                              <td className="px-3 py-2 text-right">{money(adjustments.reduce((s, a) => s + lineBalance(a).total, 0))}</td>
                              <td className="px-3 py-2 text-right text-red-600">{adjustmentTotal < 0 ? "-" : ""}{money(Math.abs(adjustmentTotal))}</td>
                              <td className="px-3 py-2 text-right text-amber-700">{money(adjustments.reduce((s, a) => s + lineBalance(a).remaining, 0))}</td>
                              <td />
                            </tr>
                          </tfoot>
                        </table>
                        </div>
                      )}
                    </div>

                    <div className="rounded-md bg-emerald-50 p-3 max-w-xs"><Label>Net payable</Label><p className="mt-1 text-lg font-semibold text-emerald-700">{money(netPayable)}</p></div>
                  </div>

                  <div className="space-y-4 border-t pt-5">
                    <h2 className="font-semibold">Payment Method</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2"><Label>Payment method</Label><Input value={payment.paymentMethod} onChange={(event) => updatePayment("paymentMethod", event.target.value)} /></div>
                      <div className="space-y-2">
                        <Label>Bank account</Label>
                        {bankAccounts.length > 0 ? (
                          <select
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            value={bankAccountId}
                            onChange={(event) => { setBankAccountId(event.target.value); updatePayment("bankAccountLabel", ""); }}
                          >
                            {bankAccounts.map((a) => (
                              <option key={a.id} value={a.id}>{bankAccountLabel(a)}{a.isDefault ? " — default" : ""}</option>
                            ))}
                          </select>
                        ) : (
                          <Input
                            placeholder="Landlord account"
                            value={payment.bankAccountLabel || defaultBankLabel}
                            onChange={(event) => updatePayment("bankAccountLabel", event.target.value)}
                          />
                        )}
                        {selectedBankAccount && selectedProperty?.landlordBankAccountId === selectedBankAccount.id ? (
                          <p className="text-xs text-emerald-700">Default bank for this property.</p>
                        ) : selectedBankAccount ? (
                          <label className="flex items-center gap-2 text-xs">
                            <input type="checkbox" checked={makePropertyDefault} onChange={(event) => setMakePropertyDefault(event.target.checked)} />
                            Make this the default bank for this property (used on every payment for it)
                          </label>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <Label>Payment reference</Label>
                        <Input
                          value={payment.paymentReference || referencePreview}
                          onChange={(event) => updatePayment("paymentReference", event.target.value === referencePreview ? "" : event.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">{typedReference ? "Custom reference" : "Auto-generated — edit to use your own"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 border-t pt-5">
                    <h2 className="font-semibold">Supporting Documents</h2>
                    <div className="rounded-lg border border-dashed p-4 text-center">
                      <input ref={docInputRef} type="file" multiple accept=".pdf,image/*" className="hidden" onChange={(event) => addDocuments(event.target.files)} />
                      <Button variant="outline" size="sm" onClick={() => docInputRef.current?.click()}><Upload className="mr-2 h-4 w-4" />Upload Document</Button>
                    </div>
                    {documents.length > 0 && (
                      <ul className="space-y-1">
                        {documents.map((doc, index) => (
                          <li key={`${doc.name}-${index}`} className="flex items-center justify-between rounded border px-3 py-1.5 text-sm">
                            <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" />{doc.name}</span>
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeDocument(index)}><X className="h-3.5 w-3.5" /></Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>}

                <div className="flex justify-end gap-2 border-t pt-5">
                  <Button onClick={goToReview} disabled={periodChecking || periodTaken}>Review &amp; Confirm <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </div>
              </section>
            )}

            {step === 1 && (
              <section className="surface space-y-6 p-6">
                <h2 className="font-semibold">Review &amp; Confirm</h2>
                <div className="grid gap-4 sm:grid-cols-2 text-sm">
                  <div><p className="text-muted-foreground">Landlord</p><p className="font-medium">{selectedVendor ? `${selectedVendor.firstName} ${selectedVendor.lastName}` : "-"}</p></div>
                  <div><p className="text-muted-foreground">Property</p><p className="font-medium">{formatPropertyReference((selectedProperty as any)?.propertyNumber)} · {selectedProperty?.addressLine1}</p></div>
                  <div><p className="text-muted-foreground">Payment date</p><p className="font-medium">{new Date(payment.paymentDate).toLocaleDateString("en-GB")}</p></div>
                  <div><p className="text-muted-foreground">Accounting period</p><p className="font-medium">{payment.accountingPeriod}</p></div>
                  <div><p className="text-muted-foreground">Contractual rent</p><p className="font-medium">{money(payment.contractualRent)}</p></div>
                  <div><p className="text-muted-foreground">Adjustments ({adjustments.length})</p><p className="font-medium text-red-600">{money(adjustmentTotal)}</p></div>
                  <div><p className="text-muted-foreground">Net payable</p><p className="font-semibold text-emerald-600">{money(netPayable)}</p></div>
                  <div><p className="text-muted-foreground">Payment method</p><p className="font-medium">{payment.paymentMethod}</p></div>
                  <div><p className="text-muted-foreground">Documents</p><p className="font-medium">{documents.length} attached</p></div>
                  <div><p className="text-muted-foreground">Payment reference</p><p className="font-mono font-medium">{typedReference || referencePreview || "Auto-generated on save"}</p></div>
                </div>
                <div className="flex justify-between gap-2 border-t pt-5">
                  <Button variant="outline" onClick={() => setStep(0)} disabled={saving}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button variant="outline" onClick={downloadReviewPdf} disabled={saving}><Download className="mr-2 h-4 w-4" />Download PDF</Button>
                    <Button variant="outline" onClick={() => void confirmAndCreate("DRAFT")} disabled={saveBlocked}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save as draft</Button>
                    <Button onClick={() => void confirmAndCreate("ACTIVE")} disabled={saveBlocked}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button>
                  </div>
                </div>
              </section>
            )}

            {step === 2 && (
              <section className="surface space-y-5 p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><Check className="h-6 w-6" /></div>
                <h2 className="text-lg font-semibold">Payment {createdTransaction?.status === "DRAFT" ? "saved as draft" : "saved"}</h2>
                <p className="text-sm text-muted-foreground">Reference No. <span className="font-medium text-foreground">{createdTransaction?.reference || createdTransaction?.tranid || "-"}</span></p>
                <p className="text-sm text-muted-foreground">Bank payment reference <span className="font-mono font-medium text-foreground">{createdTransaction?.paymentReference || createdTransaction?.reference || "-"}</span></p>
                <p className="text-sm text-muted-foreground">Net payable {money(netPayable)} to {selectedVendor ? `${selectedVendor.firstName} ${selectedVendor.lastName}` : "the landlord"}</p>
                <div className="flex justify-center gap-2 pt-3">
                  <Button variant="outline" onClick={resetForm}>Create another payment</Button>
                </div>
              </section>
            )}
          </div>

          {/* Right-side info panel */}
          <div className="space-y-5">
            <div className="surface p-4">
              <h3 className="mb-3 text-sm font-semibold">Property Information</h3>
              {selectedProperty ? (
                <div className="space-y-2 text-sm">
                  <p className="font-medium">{selectedProperty.addressLine1}</p>
                  <p className="text-muted-foreground">{[selectedProperty.addressLine2, selectedProperty.town, selectedProperty.postCode].filter(Boolean).join(", ")}</p>
                  <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                    <div><p className="text-muted-foreground">Property Ref</p><p className="font-medium">{formatPropertyReference(selectedProperty.propertyNumber)}</p></div>
                    <div><p className="text-muted-foreground">Property Type</p><p className="font-medium">{selectedProperty.propertyTypeCategory || selectedProperty.category || "-"}</p></div>
                    <div><p className="text-muted-foreground">Bedrooms</p><p className="font-medium">{selectedProperty.bedrooms ?? "-"}</p></div>
                    <div><p className="text-muted-foreground">Agreement Type</p><p className="font-medium">{selectedProperty.category || "-"}</p></div>
                  </div>
                </div>
              ) : <p className="text-sm text-muted-foreground">Select a property to see its details.</p>}
            </div>

            <div className="surface p-4">
              <h3 className="mb-3 text-sm font-semibold">Landlord Information</h3>
              {selectedVendor ? (
                <div className="space-y-2 text-sm">
                  <p className="font-medium">{selectedVendor.firstName} {selectedVendor.lastName}</p>
                  <p className="text-muted-foreground">{selectedVendor.phone}</p>
                  <p className="text-muted-foreground">{selectedVendor.email}</p>
                  <p className="text-muted-foreground">{[selectedVendor.addressLine1, selectedVendor.town, selectedVendor.postCode].filter(Boolean).join(", ")}</p>
                </div>
              ) : <p className="text-sm text-muted-foreground">Select a property to see the landlord.</p>}
            </div>

            <div className="surface p-4">
              <h3 className="mb-3 text-sm font-semibold">Payment Summary</h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Contractual Rent</span><span>{money(payment.contractualRent)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total Adjustments</span><span className="text-red-600">{money(adjustmentTotal)}</span></div>
                <div className="flex justify-between border-t pt-1.5 font-semibold text-emerald-700"><span>Net Payable</span><span>{money(netPayable)}</span></div>
              </div>
            </div>

            {(selectedBankAccount || selectedVendor?.bankName) && (
              <div className="surface p-4">
                <h3 className="mb-3 text-sm font-semibold">Bank Details</h3>
                <div className="space-y-1.5 text-sm">
                  {selectedBankAccount?.bankName && <div className="flex justify-between"><span className="text-muted-foreground">Bank</span><span>{selectedBankAccount.bankName}</span></div>}
                  <div className="flex justify-between"><span className="text-muted-foreground">Account Name</span><span>{selectedBankAccount?.accountName || `${selectedVendor?.firstName || ""} ${selectedVendor?.lastName || ""}`}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Sort Code</span><span>{selectedBankAccount?.sortCode || selectedVendor?.bankSortCode || "-"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Account Number</span><span>{selectedBankAccount?.accountNumber || selectedVendor?.bankAccountNo || "-"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Reference</span><span className="font-mono">{typedReference || referencePreview || "Auto-generated"}</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Adjustment popup */}
      <Dialog open={adjModalOpen} onOpenChange={setAdjModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingAdjId ? "Edit Adjustment" : "Add Adjustment"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border border-dashed p-3">
              <Label className="text-xs">Supporting document (optional)</Label>
              <input ref={adjFileInputRef} type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => setAdjFile(e.target.files?.[0] || null)} />
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => adjFileInputRef.current?.click()}>
                  <Upload className="mr-1.5 h-3.5 w-3.5" />Choose file
                </Button>
                {adjFile && <span className="max-w-[10rem] truncate text-xs text-muted-foreground" title={adjFile.name}>{adjFile.name}</span>}
                <Button size="sm" variant="outline" disabled={!adjFile || extracting} onClick={extractFromDocument}>
                  {extracting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Wand2 className="mr-1.5 h-3.5 w-3.5" />}
                  Extract via OCR
                </Button>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">Upload an invoice or receipt and Woodland OCR will suggest the type and amount.</p>
            </div>
            <div className="space-y-1">
              <Label>Type *</Label>
              <Select value={adjForm.type} onValueChange={(value) => setAdjForm((f) => ({ ...f, type: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ADJUSTMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Description</Label><Input value={adjForm.description} onChange={(e) => setAdjForm((f) => ({ ...f, description: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Related To</Label><Input placeholder="e.g. maintenance job reference" value={adjForm.relatedTo} onChange={(e) => setAdjForm((f) => ({ ...f, relatedTo: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Amount (£) *</Label><Input type="number" min="0" value={adjForm.amount} onChange={(e) => setAdjForm((f) => ({ ...f, amount: e.target.value }))} /></div>
            <Button className="w-full" onClick={saveAdjustment}>{editingAdjId ? "Save changes" : "Add adjustment"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Maintenance recharge popup — full, % of the job, or a fixed part */}
      <Dialog open={!!rechargeJob} onOpenChange={(open) => { if (!open) setRechargeJob(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Recharge Maintenance</DialogTitle></DialogHeader>
          {rechargeJob && (
            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <p className="font-medium">{rechargeJob.jobType}{rechargeJob.description ? ` — ${rechargeJob.description}` : ""}</p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <div><p className="text-xs text-muted-foreground">Job total</p><p className="font-medium">{money(rechargeJob.total)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Already charged</p><p className="font-medium">{money(rechargeJob.charged)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Remaining</p><p className="font-medium text-amber-700">{money(rechargeJob.amount)}</p></div>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Charge this payment</Label>
                <div className="grid grid-cols-3 gap-2">
                  {([["FULL", "Full remaining"], ["PERCENT", "% of job"], ["FIXED", "Fixed £"]] as const).map(([mode, label]) => (
                    <Button key={mode} type="button" size="sm" variant={rechargeMode === mode ? "default" : "outline"} onClick={() => { setRechargeMode(mode); setRechargeValue(""); }}>{label}</Button>
                  ))}
                </div>
              </div>
              {rechargeMode !== "FULL" && (
                <div className="space-y-1">
                  <Label>{rechargeMode === "PERCENT" ? "Percentage of job total (%)" : "Amount (£)"}</Label>
                  <Input type="number" min="0" max={rechargeMode === "PERCENT" ? "100" : undefined} value={rechargeValue} onChange={(e) => setRechargeValue(e.target.value)} autoFocus />
                </div>
              )}
              <div className="flex justify-between rounded-md bg-emerald-50 p-3 text-sm">
                <span>Charge now <span className="font-semibold">{money(rechargeAmount)}</span></span>
                <span className="text-muted-foreground">Left for next payment {money(Math.max(rechargeJob.amount - rechargeAmount, 0))}</span>
              </div>
              {rechargeError && rechargeMode !== "FULL" && rechargeValue && <p className="text-sm text-destructive">{rechargeError}</p>}
              <Button className="w-full" disabled={!!rechargeError} onClick={saveRecharge}>{rechargeAdjId ? "Save changes" : "Add recharge"}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Deduction popup: recover all of what is outstanding, or part of it */}
      <Dialog open={!!deductionDraft} onOpenChange={(open) => { if (!open) setDeductionDraft(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{deductionDraft?.adjId ? "Edit deduction" : "Add deduction"}</DialogTitle></DialogHeader>
          {deductionDraft && (
            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <p className="font-medium">{deductionDraft.deduction.description}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div><p className="text-xs text-muted-foreground">Deducted on</p><p className="font-medium">{deductionDraft.deduction.date ? dmy(deductionDraft.deduction.date) : "-"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Outstanding</p><p className="font-medium text-sky-700">{money(deductionDraft.deduction.outstanding)}</p></div>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Recover on this payment (£)</Label>
                <Input type="number" min="0" max={deductionDraft.deduction.outstanding} value={deductionDraft.value} onChange={(e) => setDeductionDraft((d) => (d ? { ...d, value: e.target.value } : d))} autoFocus />
                <p className="text-xs text-muted-foreground">Lower this to recover part now. The rest stays outstanding.</p>
              </div>
              <div className="flex justify-between rounded-md bg-emerald-50 p-3 text-sm">
                <span>Recover now <span className="font-semibold">{money(deductionAmount)}</span></span>
                <span className="text-muted-foreground">Left after {money(Math.max(deductionDraft.deduction.outstanding - deductionAmount, 0))}</span>
              </div>
              {deductionError && deductionDraft.value && <p className="text-sm text-destructive">{deductionError}</p>}
              <Button className="w-full" disabled={!!deductionError} onClick={saveDeduction}>{deductionDraft.adjId ? "Save changes" : "Add deduction"}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
