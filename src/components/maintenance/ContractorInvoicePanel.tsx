// Contractor cost, contractor invoice, Woodland markup and the landlord invoice
// for one maintenance job. Shared by the job page (Invoices tab) and the
// property's Contractor Invoices tab.
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { InfoHint } from "@/components/ui/hint";
import { Input } from "@/components/ui/input";
import { Download, Eye, FileText, Mail, Trash2 } from "lucide-react";
import { del, get, post } from "@/helper/api";
import { toast } from "sonner";
import StoredFilePreview from "@/components/StoredFilePreview";
import FileUploadField from "@/utils/FileUploadField";
import { fetchFileUrls, openStoredFile, uploadFile } from "@/helper/fileUpload";
import { buildMaintenanceInvoice, invoiceRef, invoiceToBlob } from "@/utils/maintenanceInvoice";
import { formatLondonDateTime } from "@/utils/maintenanceSla";
import type { JobType } from "@/redux/dataStore/jobTypeSlice";
import { emailLandlord, patchJob } from "@/pages/Maintenance/jobActions";

interface LandlordInvoice {
  id: string;
  fileId: string;
  reference?: string | null;
  amount?: number | null;
  createdByName?: string | null;
  createdAt: string;
}

export interface ContractorInvoicePanelProps {
  job: JobType;
  canManage: boolean;
  onChanged: () => void;
}

interface PanelForm {
  totalCost: string;
  otherCost: string;
  markupType: "percent" | "amount";
  markupValue: string;
  /** Only a freshly uploaded contractor invoice; the saved one is shown as a preview. */
  newInvoiceFileId: string;
  showOnLandlordPortal: boolean;
}

const toNumber = (value: string) => {
  const n = Number(value);
  return value === "" || isNaN(n) ? 0 : n;
};

const money = (n?: number | null) => `£${Number(n ?? 0).toFixed(2)}`;

const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

const defaultsFor = (job: JobType): PanelForm => ({
  totalCost: job.totalCost != null ? String(job.totalCost) : "",
  otherCost: job.otherCost != null ? String(job.otherCost) : "",
  markupType: job.marginAmount != null ? "amount" : "percent",
  markupValue: job.marginAmount != null ? String(job.marginAmount) : job.marginPercent != null ? String(job.marginPercent) : "",
  newInvoiceFileId: "",
  showOnLandlordPortal: job.showOnLandlordPortal === true,
});

export default function ContractorInvoicePanel({ job, canManage, onChanged }: ContractorInvoicePanelProps) {
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [invoices, setInvoices] = useState<LandlordInvoice[]>([]);
  const [invoicesLoaded, setInvoicesLoaded] = useState(false);
  const autoTried = useRef(false);
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

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isDirty },
  } = useForm<PanelForm>({ defaultValues: defaultsFor(job) });

  useEffect(() => {
    reset(defaultsFor(job));
    // Reset when the saved job changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job, reset]);

  const totalCost = watch("totalCost");
  const otherCost = watch("otherCost");
  const markupType = watch("markupType");
  const markupValue = watch("markupValue");
  const showOnPortal = watch("showOnLandlordPortal");

  const base = toNumber(totalCost) + toNumber(otherCost);
  const markup = markupType === "percent" ? base * (toNumber(markupValue) / 100) : toNumber(markupValue);
  const previewTotal = base + markup;
  const landlordEmail = job.property?.vendor?.email;
  const landlordName = [job.property?.vendor?.firstName, job.property?.vendor?.lastName].filter(Boolean).join(" ") || "Landlord";

  const save = handleSubmit(async (values) => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = { showOnLandlordPortal: values.showOnLandlordPortal };
      if (values.totalCost !== "") body.totalCost = Number(values.totalCost);
      if (values.newInvoiceFileId) body.invoiceFileId = values.newInvoiceFileId;
      if (values.markupValue !== "") {
        // One markup at a time: the server clears the other.
        if (values.markupType === "percent") body.marginPercent = Number(values.markupValue);
        else body.marginAmount = Number(values.markupValue);
      }
      await patchJob(job, body);
      toast.success("Invoice details saved");
      onChanged();
    } catch (error) {
      toast.error(error?.message || "Failed to save invoice details");
    } finally {
      setSaving(false);
    }
  });

  const generateInvoice = async (auto = false) => {
    if (isDirty) {
      if (!auto) toast.error("Save your changes first so the invoice matches them");
      return;
    }
    if (job.totalCharged == null) {
      if (!auto) toast.error("Add an invoice row below, or enter a contractor cost, first");
      return;
    }
    setGenerating(true);
    try {
      // Landlord-facing PDF: chargeable total only (no contractor cost, invoice or markup).
      const doc = buildMaintenanceInvoice(job);
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

  const disabled = !canManage;

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-5">
        <div className="font-semibold">Costs<InfoHint text="Contractor cost is optional. Jobs without a contractor are costed from the invoice rows below." /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground" htmlFor="contractorCost">
              Contractor cost (£)<InfoHint quiet text="What the contractor charges Woodland for the work." />
            </label>
            <Input id="contractorCost" type="number" step="0.01" min="0" disabled={disabled} {...register("totalCost")} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground" htmlFor="otherCost">
              Costs total (£)<InfoHint quiet text="The total of the invoice rows below (materials, labour, parts...). Add or remove them there." />
            </label>
            <Input id="otherCost" type="number" readOnly disabled {...register("otherCost")} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Contractor invoice</div>
          {job.invoiceFileId ? (
            <StoredFilePreview fileId={job.invoiceFileId} alt="Contractor invoice" className="w-full h-80 rounded-md border object-contain" />
          ) : (
            <p className="text-sm text-muted-foreground">No contractor invoice has been saved yet.</p>
          )}
          {canManage && (
            <FileUploadField
              label={job.invoiceFileId ? "Replace contractor invoice (PDF)" : "Upload contractor invoice (PDF)"}
              name="newInvoiceFileId"
              accept="image/*,.pdf"
              multiple={false}
              register={register}
              setValue={setValue}
              watch={watch}
              upload={{ category: "job-invoice", entityType: "jobType", entityId: job.id, propertyId: job.propertyId }}
            />
          )}
        </div>

        <div className="space-y-3 border-t pt-4">
          <div className="font-semibold">Woodland markup<InfoHint text="Woodland's margin on top of the costs. Enter a percentage or a flat amount; the other is cleared when you save." /></div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex gap-2">
              <Button type="button" size="sm" disabled={disabled} variant={markupType === "percent" ? "default" : "outline"} onClick={() => setValue("markupType", "percent", { shouldDirty: true })}>
                Percentage
              </Button>
              <Button type="button" size="sm" disabled={disabled} variant={markupType === "amount" ? "default" : "outline"} onClick={() => setValue("markupType", "amount", { shouldDirty: true })}>
                Flat amount
              </Button>
            </div>
            <Input
              type="number"
              step="0.01"
              min="0"
              className="max-w-[12rem]"
              disabled={disabled}
              placeholder={markupType === "percent" ? "e.g. 20 (%)" : "e.g. 15.00 (£)"}
              {...register("markupValue")}
            />
          </div>
        </div>

        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-sm text-muted-foreground">
                {isDirty ? "Total chargeable to landlord (preview)" : "Total chargeable to landlord"}
              </div>
              <div className="text-2xl font-semibold">
                {isDirty ? money(previewTotal) : job.totalCharged != null ? money(job.totalCharged) : "Not set yet"}
              </div>
              {!isDirty && (
                <div className="text-xs text-muted-foreground">
                  Contractor {money(job.totalCost)} + other {money(job.otherCost)}
                  {job.marginPercent != null && ` + ${job.marginPercent}% markup`}
                  {job.marginAmount != null && ` + ${money(job.marginAmount)} markup`}
                </div>
              )}
            </div>
          </div>
          <label className="flex items-start gap-3">
            <Checkbox
              checked={showOnPortal}
              disabled={disabled}
              onCheckedChange={(v) => setValue("showOnLandlordPortal", v === true, { shouldDirty: true })}
            />
            <span>
              <span className="font-semibold block">Show on landlord portal<InfoHint text="When ticked, the landlord can see this job and its invoice in their portal. Unticked by default." /></span>
              <span className="text-sm text-muted-foreground">
                {showOnPortal ? "The landlord can see this job in their portal." : "Hidden from the landlord portal."}
              </span>
            </span>
          </label>
          {canManage && (
            <div className="flex justify-end">
              <Button type="button" disabled={saving || !isDirty} onClick={save}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <div>
          <div className="font-semibold">Landlord invoice<InfoHint text="The invoice the landlord receives. It shows only the amount chargeable to them, not the contractor's cost, the contractor's invoice or the markup." /></div>
          <p className="text-sm text-muted-foreground">
            {job.totalCharged != null ? `Amount: ${money(job.totalCharged)}` : "Enter the contractor cost and save before generating."}
          </p>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={generating || job.totalCharged == null} onClick={() => generateInvoice()}>
              <FileText className="h-4 w-4 mr-2" /> {generating ? "Generating…" : "Generate invoice"}
            </Button>
          </div>
        )}

        <div className="border-t pt-4 space-y-3">
          <div className="font-semibold">Generated invoices</div>
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
              {landlordEmail
                ? `Email sends to ${landlordName} (${landlordEmail}). The landlord is never emailed automatically.`
                : "This property's landlord has no email on file."}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
