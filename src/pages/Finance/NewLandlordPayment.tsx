import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, FileText, Loader2, Plus, Trash2, Upload, Wand2, Wrench, X } from "lucide-react";
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

const API_URL = import.meta.env.VITE_API_URL;
const money = (value: unknown) =>
  `£${Number(value || 0).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const STEPS = ["Payment Details", "Review & Confirm", "Complete"] as const;

// jobTypeId is set when the line came from a completed maintenance job, so
// the transaction records which jobs it billed and they aren't offered again.
type Adjustment = { id: string; type: string; description?: string; relatedTo?: string; amount: number; jobTypeId?: string };
type BillableJob = { id: string; jobType: string; description?: string; dateDone?: string; amount: number };

const ADJUSTMENT_TYPES = ["Maintenance Recharge", "Management Fee", "VAT", "Other"];

export default function NewLandlordPayment() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { properties } = useAppSelector((state) => state.properties);
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
  const addJobAdjustment = (job: BillableJob) => {
    setAdjustments((prev) => [...prev, {
      id: crypto.randomUUID(),
      type: "Maintenance Recharge",
      description: job.description ? `${job.jobType} — ${job.description}` : job.jobType,
      relatedTo: job.dateDone ? `Job completed ${job.dateDone}` : "Maintenance job",
      amount: -Math.abs(job.amount),
      jobTypeId: job.id,
    }]);
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

  // What the bank account box shows by default; saved unless the user types their own.
  const defaultBankLabel = selectedVendor?.bankName
    ? `${selectedVendor.bankName} (${selectedVendor.bankSortCode || ""} | ${selectedVendor.bankAccountNo || ""})`
    : "";

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
      const formData = new FormData();
      formData.append("file", adjFile);
      const { data, error } = await post<any>("transaction/extract-adjustments", formData);
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
  const goToReview = () => {
    if (!vendorId) {
      toast({ title: "Select a landlord", description: "Choose a landlord before continuing.", variant: "destructive" });
      return;
    }
    if (!propertyId) {
      toast({ title: "Select a property", description: "Choose a property before continuing.", variant: "destructive" });
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
  const confirmAndCreate = async (status: "DRAFT" | "ACTIVE" | "APPROVAL_REQUIRED") => {
    setSaving(true);
    try {
      const { data, error } = await post<any>("transaction", {
        propertyId,
        status,
        toLandlordDate: payment.paymentDate,
        toLandlordRentReceived: Number(payment.contractualRent) || 0,
        toLandlordNetPaid: netPayable,
        toLandLordMode: payment.paymentMethod,
        toLandlordChequeNo: payment.paymentReference || undefined,
        toLandlordExpenditureDescription: payment.description,
        toLandlordPaidBy: selectedVendor ? `${selectedVendor.firstName} ${selectedVendor.lastName}`.trim() : undefined,
        bankAccountLabel: payment.bankAccountLabel || defaultBankLabel || undefined,
        paymentReference: typedReference || undefined,
        expectedPaymentDate: payment.expectedPaymentDate || undefined,
        adjustments: adjustments.map(({ id, jobTypeId, ...rest }) => rest),
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
            const docForm = new FormData();
            docForm.append("file", file);
            const { error: uploadError } = await post(`transaction/${transaction.id}/documents`, docForm);
            return uploadError ? `${file.name}: ${uploadError.message}` : null;
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
                  <div className="grid gap-4 sm:grid-cols-2 border-t pt-5">
                    <div className="space-y-2"><Label>Payment date *</Label><Input type="date" value={payment.paymentDate} onChange={(event) => updatePayment("paymentDate", event.target.value)} /></div>
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
                              </span>
                              <span className="flex shrink-0 items-center gap-2">
                                <span className="font-medium">{money(job.amount)}</span>
                                <Button size="sm" variant="outline" className="h-7" onClick={() => addJobAdjustment(job)}><Plus className="mr-1 h-3 w-3" />Add</Button>
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {!adjustments.length ? (
                        <p className="p-4 text-sm text-muted-foreground">No adjustments added.</p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead className="bg-muted/40 text-left text-xs text-muted-foreground"><tr><th className="px-3 py-2 font-medium">Type</th><th className="px-3 py-2 font-medium">Description</th><th className="px-3 py-2 font-medium">Related To</th><th className="px-3 py-2 text-right font-medium">Amount (£)</th><th className="px-3 py-2 font-medium"></th></tr></thead>
                          <tbody>
                            {adjustments.map((a) => (
                              <tr key={a.id} className="border-t">
                                <td className="px-3 py-2">{a.type}</td>
                                <td className="px-3 py-2 text-muted-foreground">{a.description || "-"}</td>
                                <td className="px-3 py-2 text-muted-foreground">{a.relatedTo || "-"}</td>
                                <td className="px-3 py-2 text-right text-red-600">-{money(Math.abs(a.amount))}</td>
                                <td className="px-3 py-2">
                                  <div className="flex justify-end gap-1">
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditAdjustment(a)}><FileText className="h-3.5 w-3.5" /></Button>
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteAdjustment(a.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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
                        <Input
                          placeholder="Landlord account"
                          value={payment.bankAccountLabel || defaultBankLabel}
                          onChange={(event) => updatePayment("bankAccountLabel", event.target.value)}
                        />
                      </div>
                      <div className="space-y-2"><Label>Expected payment date</Label><Input type="date" value={payment.expectedPaymentDate} onChange={(event) => updatePayment("expectedPaymentDate", event.target.value)} /></div>
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
                  <Button onClick={goToReview}>Review &amp; Confirm <ArrowRight className="ml-2 h-4 w-4" /></Button>
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
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => void confirmAndCreate("DRAFT")} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save as draft</Button>
                    <Button onClick={() => void confirmAndCreate("APPROVAL_REQUIRED")} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit for approval</Button>
                  </div>
                </div>
              </section>
            )}

            {step === 2 && (
              <section className="surface space-y-5 p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><Check className="h-6 w-6" /></div>
                <h2 className="text-lg font-semibold">Payment {createdTransaction?.status === "DRAFT" ? "saved as draft" : "submitted"}</h2>
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

            {selectedVendor?.bankName && (
              <div className="surface p-4">
                <h3 className="mb-3 text-sm font-semibold">Bank Details</h3>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Account Name</span><span>{selectedVendor.firstName} {selectedVendor.lastName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Sort Code</span><span>{selectedVendor.bankSortCode || "-"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Account Number</span><span>{selectedVendor.bankAccountNo || "-"}</span></div>
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
    </DashboardLayout>
  );
}
