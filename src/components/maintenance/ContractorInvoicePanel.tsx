// Landlord settings, total charged to the landlord (with Woodland markup) and the
// landlord invoices generated for one maintenance job. The costs themselves are
// the invoice rows (JobPaymentsPanel). Shared by the job page (Invoices tab) and
// the property's Contractor Invoices tab.
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { InfoHint } from "@/components/ui/hint";
import { Input } from "@/components/ui/input";
import { Download, Eye, FileText, Mail, Trash2 } from "lucide-react";
import { del, get, post } from "@/helper/api";
import { toast } from "sonner";
import { fetchFileUrls, openStoredFile, uploadFile } from "@/helper/fileUpload";
import { buildMaintenanceInvoice, invoiceRef, invoiceToBlob, type InvoiceLine } from "@/utils/maintenanceInvoice";
import { formatLondonDateTime } from "@/utils/maintenanceSla";
import type { JobType } from "@/redux/dataStore/jobTypeSlice";
import { emailLandlord, patchJob } from "@/pages/Maintenance/jobActions";
import JobPaymentsPanel from "./JobPaymentsPanel";

interface LandlordInvoice {
  id: string;
  fileId: string;
  reference?: string | null;
  amount?: number | null;
  createdByName?: string | null;
  createdAt: string;
}

interface PaymentLine {
  description: string;
  amount: number;
  markupPercent?: number | null;
  markupAmount?: number | null;
}

export interface ContractorInvoicePanelProps {
  job: JobType;
  canManage: boolean;
  onChanged: () => void;
}

const money = (n?: number | null) => `£${Number(n ?? 0).toFixed(2)}`;

const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

export const lineToLandlord = (l: PaymentLine) =>
  l.markupAmount != null ? l.amount + l.markupAmount : l.amount * (1 + (l.markupPercent ?? 0) / 100);

function useInvoicePanel({ job, canManage, onChanged }: ContractorInvoicePanelProps) {
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [invoices, setInvoices] = useState<LandlordInvoice[]>([]);
  const [invoicesLoaded, setInvoicesLoaded] = useState(false);
  const autoTried = useRef(false);

  const savedType: "percent" | "amount" = job.marginAmount != null ? "amount" : "percent";
  const savedValue = job.marginAmount != null ? String(job.marginAmount) : job.marginPercent != null ? String(job.marginPercent) : "";
  const [markupType, setMarkupType] = useState<"percent" | "amount">(savedType);
  const [markupValue, setMarkupValue] = useState(savedValue);
  useEffect(() => {
    setMarkupType(savedType);
    setMarkupValue(savedValue);
  }, [savedType, savedValue]);
  const isDirty = markupType !== savedType || markupValue !== savedValue;

  const loadInvoices = async () => {
    if (!job.id) return;
    const { data } = await get<{ invoices?: LandlordInvoice[] }>(`property-management/job-type/${job.id}/landlord-invoices`);
    setInvoices(data?.invoices ?? []);
    setInvoicesLoaded(true);
  };
  useEffect(() => {
    void loadInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.id]);

  const landlordEmail = job.property?.vendor?.email;
  const landlordName = [job.property?.vendor?.firstName, job.property?.vendor?.lastName].filter(Boolean).join(" ") || "Landlord";
  // A completed or cancelled job is read only: costs, markup and the deduct flag are locked.
  const isClosed = job.status === "COMPLETED" || job.status === "CANCELLED";
  const disabled = !canManage || isClosed;

  // Without the job markup, what the landlord pays = totalCharged minus the job-level markup.
  const base = Number(job.totalCost ?? 0) + Number(job.otherCost ?? 0);
  const savedJobMarkup = job.marginAmount != null ? job.marginAmount : job.marginPercent != null ? (base * job.marginPercent) / 100 : 0;
  const withoutJobMarkup = (job.totalCharged ?? base) - savedJobMarkup;
  const n = Number(markupValue);
  const previewMarkup = markupValue === "" || isNaN(n) ? 0 : markupType === "percent" ? (base * n) / 100 : n;
  const previewTotal = withoutJobMarkup + previewMarkup;

  const toggle = async (body: Record<string, unknown>, message: string) => {
    try {
      await patchJob(job, body);
      toast.success(message);
      onChanged();
    } catch (error) {
      toast.error(error?.message || "Failed to save");
    }
  };

  const saveMarkup = async () => {
    setSaving(true);
    try {
      const value = markupValue === "" ? 0 : Number(markupValue);
      // One markup at a time: the server clears the other.
      await patchJob(job, markupType === "percent" ? { marginPercent: value } : { marginAmount: value });
      toast.success("Markup saved");
      onChanged();
    } catch (error) {
      toast.error(error?.message || "Failed to save the markup");
    } finally {
      setSaving(false);
    }
  };

  const loadLines = async (): Promise<InvoiceLine[]> => {
    const { data } = await get<{ payments: PaymentLine[] }>(`property-management/job-type/${job.id}/payments`);
    const lines: InvoiceLine[] = (data?.payments ?? []).map((p) => ({ description: p.description, amount: lineToLandlord(p) }));
    if (job.totalCost) lines.unshift({ description: "Contractor's work", amount: job.totalCost });
    return lines;
  };

  const generateInvoice = async (auto = false) => {
    if (isDirty) {
      if (!auto) toast.error("Save the markup first so the invoice matches it");
      return;
    }
    if (job.totalCharged == null) {
      if (!auto) toast.error("Add an invoice row first");
      return;
    }
    setGenerating(true);
    try {
      // Landlord-facing PDF: one line per invoice row (description and amount to the landlord).
      const doc = buildMaintenanceInvoice(job, await loadLines());
      const reference = invoices.length ? `${invoiceRef(job)}-${invoices.length + 1}` : invoiceRef(job);
      const file = new File([invoiceToBlob(doc)], `${reference}.pdf`, { type: "application/pdf" });
      const stored = await uploadFile(file, {
        category: "job-invoice",
        entityType: "jobType",
        entityId: job.id,
        propertyId: job.propertyId,
      });
      const { error } = await post(`property-management/job-type/${job.id}/landlord-invoices`, { fileId: stored.id, reference, amount: job.totalCharged ?? undefined });
      if (error) throw new Error(error.message);
      toast.success("Landlord invoice generated and saved");
      await loadInvoices();
      onChanged();
    } catch (error) {
      toast.error(error?.message || "Failed to generate the invoice");
    } finally {
      setGenerating(false);
    }
  };

  const emailInvoice = async (fileId: string) => {
    if (!job.id || !fileId) return;
    setEmailing(true);
    try {
      // Send the saved PDF itself, so the landlord gets exactly what was generated.
      const urls = await fetchFileUrls([fileId]);
      const signed = urls[fileId];
      if (!signed) throw new Error("The saved invoice could not be loaded. Generate a new one and try again.");
      const res = await fetch(signed.url);
      if (!res.ok) throw new Error("The saved invoice could not be loaded. Generate a new one and try again.");
      const base64 = await blobToBase64(await res.blob());
      const result = await emailLandlord(job.id, base64);
      toast.success(result?.message || "Invoice emailed to landlord");
      onChanged();
    } catch (error) {
      toast.error(error?.message || "Failed to email the invoice");
    } finally {
      setEmailing(false);
    }
  };

  // First invoice is made automatically once the job has an amount to charge.
  useEffect(() => {
    if (autoTried.current || !canManage || !invoicesLoaded || generating || isDirty) return;
    if (invoices.length === 0 && (job.totalCharged ?? 0) > 0) {
      autoTried.current = true;
      void generateInvoice(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoicesLoaded, invoices.length, job.totalCharged, canManage, isDirty]);

  const removeInvoice = async (inv: LandlordInvoice) => {
    if (!window.confirm(`Delete invoice ${inv.reference || ""}?`)) return;
    const { error } = await del(`property-management/job-type/${job.id}/landlord-invoices/${inv.id}`);
    if (error) return toast.error(error.message || "Failed to delete the invoice");
    toast.success("Invoice deleted");
    await loadInvoices();
    onChanged();
  };

  return {
    settings: (
      <Card className="p-4 space-y-3">
        <label className="flex items-start gap-3">
          <Checkbox
            checked={job.deductible !== false}
            disabled={disabled}
            onCheckedChange={(v) => void toggle({ deductible: v === true }, v === true ? "Marked as deductible from landlord" : "Not deductible: hidden from landlord transactions")}
          />
          <span>
            <span className="font-semibold block">Deduct from landlord<InfoHint text="Ticked: once the job is completed, its total is offered on the landlord's next payment and taken off their rent. Unticked: Woodland absorbs the cost." /></span>
            <span className="text-sm text-muted-foreground">
              {job.deductible !== false ? "The total is deducted from the landlord's rent once the job is completed." : "Not deductible: Woodland absorbs this cost."}
            </span>
          </span>
        </label>
        <label className="flex items-start gap-3">
          <Checkbox
            checked={job.showOnLandlordPortal === true}
            disabled={!canManage || job.status === "CANCELLED"}
            onCheckedChange={(v) => void toggle({ showOnLandlordPortal: v === true }, v === true ? "Shown on the landlord portal" : "Hidden from the landlord portal")}
          />
          <span>
            <span className="font-semibold block">Show on landlord portal<InfoHint text="When ticked, the landlord can see this job and its invoice in their portal." /></span>
            <span className="text-sm text-muted-foreground">
              {job.showOnLandlordPortal ? "The landlord can see this job in their portal." : "Hidden from the landlord portal."}
            </span>
          </span>
        </label>
      </Card>
    ),
    total: (
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-sm text-muted-foreground">{isDirty ? "Total charge to landlord (preview)" : "Total charge to landlord"}</div>
            <div className="text-2xl font-semibold">{isDirty ? money(previewTotal) : job.totalCharged != null ? money(job.totalCharged) : "Not set yet"}</div>
            {!isDirty && job.totalCharged != null && (
              <div className="text-xs text-muted-foreground">
                Invoice rows {money(withoutJobMarkup)}
                {job.marginPercent != null && job.marginPercent > 0 && ` + ${job.marginPercent}% markup`}
                {job.marginAmount != null && job.marginAmount > 0 && ` + ${money(job.marginAmount)} markup`}
              </div>
            )}
          </div>
          {job.invoiceFileId && (
            <Button type="button" variant="outline" size="sm" onClick={() => openStoredFile(job.invoiceFileId as string).catch((e) => toast.error(e.message))}>
              <Eye className="h-4 w-4 mr-2" /> Contractor's uploaded invoice
            </Button>
          )}
        </div>
        <div className="space-y-2 border-t pt-4">
          <div className="font-semibold">Woodland markup<InfoHint text="Markup on the whole job, on top of the invoice rows. Percentage (e.g. 5% on £60 = £63) or a flat charge in pounds." /></div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="inline-flex rounded-md border p-0.5">
              <Button type="button" size="sm" disabled={disabled} variant={markupType === "percent" ? "default" : "ghost"} onClick={() => setMarkupType("percent")}>Percentage %</Button>
              <Button type="button" size="sm" disabled={disabled} variant={markupType === "amount" ? "default" : "ghost"} onClick={() => setMarkupType("amount")}>Flat charge £</Button>
            </div>
            <Input
              type="number"
              step="0.01"
              min="0"
              className="max-w-[12rem]"
              disabled={disabled}
              placeholder={markupType === "percent" ? "e.g. 5 (%)" : "e.g. 15.00 (£)"}
              value={markupValue}
              onChange={(e) => setMarkupValue(e.target.value)}
            />
            {!disabled && (
              <Button type="button" disabled={saving || !isDirty} onClick={() => void saveMarkup()}>
                {saving ? "Saving…" : "Save"}
              </Button>
            )}
          </div>
        </div>
      </Card>
    ),
    invoices: (
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="font-semibold">Landlord invoices<InfoHint text="Generate puts every invoice row into one landlord invoice. It shows each row's description and the amount to the landlord, never the contractor's cost or the markup." /></div>
            <p className="text-sm text-muted-foreground">{job.totalCharged != null ? `Amount: ${money(job.totalCharged)}` : "Add an invoice row before generating."}</p>
          </div>
          {canManage && (
            <Button type="button" disabled={generating || job.totalCharged == null} onClick={() => generateInvoice()}>
              <FileText className="h-4 w-4 mr-2" /> {generating ? "Generating…" : "Generate invoice"}
            </Button>
          )}
        </div>
        {invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">No landlord invoice has been generated yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Invoice</th>
                  <th className="py-2 pr-3 font-medium">Generated</th>
                  <th className="py-2 pr-3 text-right font-medium">Amount</th>
                  <th className="py-2 pr-3 font-medium">By</th>
                  <th className="py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-medium">{inv.reference || "Invoice"}.pdf</td>
                    <td className="py-2 pr-3">{formatLondonDateTime(inv.createdAt)}</td>
                    <td className="py-2 pr-3 text-right">{inv.amount != null ? money(inv.amount) : "-"}</td>
                    <td className="py-2 pr-3">{inv.createdByName || "-"}</td>
                    <td className="py-2">
                      <div className="flex justify-end gap-1">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="View" onClick={() => openStoredFile(inv.fileId).catch((e) => toast.error(e.message))}><Eye className="h-4 w-4" /></Button>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Download" onClick={() => openStoredFile(inv.fileId, { download: true }).catch((e) => toast.error(e.message))}><Download className="h-4 w-4" /></Button>
                        {canManage && <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title={landlordEmail ? "Email to landlord" : "Landlord has no email on file"} disabled={emailing || !landlordEmail} onClick={() => emailInvoice(inv.fileId)}><Mail className="h-4 w-4" /></Button>}
                        {canManage && <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Delete" onClick={() => removeInvoice(inv)}><Trash2 className="h-4 w-4" /></Button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {canManage && invoices.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {landlordEmail ? `Email sends to ${landlordName} (${landlordEmail}). The landlord is never emailed automatically.` : "This property's landlord has no email on file."}
          </p>
        )}
      </Card>
    ),
  };
}

// Order on the Invoices tab: landlord settings, the invoice rows (costs), the total
// charged to the landlord with the markup, then the generated landlord invoices at the bottom.
export default function ContractorInvoicePanel(props: ContractorInvoicePanelProps) {
  const parts = useInvoicePanel(props);
  return (
    <div className="space-y-4">
      {parts.settings}
      <JobPaymentsPanel job={props.job} canManage={props.canManage && props.job.status !== "COMPLETED" && props.job.status !== "CANCELLED"} onChanged={props.onChanged} />
      {parts.total}
      {parts.invoices}
    </div>
  );
}
