// Contractor cost, contractor invoice, Woodland markup and the landlord invoice
// for one maintenance job. Shared by the job page (Invoices tab) and the
// property's Contractor Invoices tab.
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { InfoHint } from "@/components/ui/hint";
import { Input } from "@/components/ui/input";
import { Download, Eye, FileText, Mail } from "lucide-react";
import { toast } from "sonner";
import StoredFilePreview from "@/components/StoredFilePreview";
import FileUploadField from "@/utils/FileUploadField";
import { fetchFileUrls, openStoredFile, uploadFile } from "@/helper/fileUpload";
import { buildMaintenanceInvoice, invoiceRef, invoiceToBlob } from "@/utils/maintenanceInvoice";
import { formatLondonDateTime } from "@/utils/maintenanceSla";
import type { JobType } from "@/redux/dataStore/jobTypeSlice";
import { emailLandlord, patchJob } from "@/pages/Maintenance/jobActions";

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

  const generateInvoice = async () => {
    if (isDirty) {
      toast.error("Save your changes first so the invoice matches them");
      return;
    }
    if (job.totalCharged == null) {
      toast.error("Add a payment on the Payments tab, or enter a contractor cost, first");
      return;
    }
    setGenerating(true);
    try {
      // Landlord-facing PDF: chargeable total only (no contractor cost, invoice or markup).
      const doc = buildMaintenanceInvoice(job);
      const file = new File([invoiceToBlob(doc)], `${invoiceRef(job)}.pdf`, { type: "application/pdf" });
      const stored = await uploadFile(file, {
        category: "job-invoice",
        entityType: "jobType",
        entityId: job.id,
        propertyId: job.propertyId,
      });
      await patchJob(job, { landlordInvoiceFileId: stored.id });
      toast.success("Landlord invoice generated");
      onChanged();
    } catch (error) {
      toast.error(error?.message || "Failed to generate the invoice");
    } finally {
      setGenerating(false);
    }
  };

  const emailInvoice = async () => {
    if (!job.id || !job.landlordInvoiceFileId) return;
    setEmailing(true);
    try {
      // Send the saved PDF itself, so the landlord gets exactly what was generated.
      const urls = await fetchFileUrls([job.landlordInvoiceFileId]);
      const signed = urls[job.landlordInvoiceFileId];
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

  const disabled = !canManage;

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-5">
        <div className="font-semibold">Costs<InfoHint text="Contractor cost is optional. Jobs without a contractor are costed from the Payments tab." /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground" htmlFor="contractorCost">
              Contractor cost (£)<InfoHint quiet text="What the contractor charges Woodland for the work." />
            </label>
            <Input id="contractorCost" type="number" step="0.01" min="0" disabled={disabled} {...register("totalCost")} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground" htmlFor="otherCost">
              Payments total (£)<InfoHint quiet text="The total of the lines on the Payments tab (materials, labour, parts...). Add or remove them there." />
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
            <Button type="button" disabled={generating || job.totalCharged == null} onClick={generateInvoice}>
              <FileText className="h-4 w-4 mr-2" /> {generating ? "Generating…" : "Generate invoice"}
            </Button>
          </div>
        )}

        <div className="border-t pt-4 space-y-3">
          <div className="font-semibold">Generated invoice</div>
          {job.landlordInvoiceFileId ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm">
                  <div className="font-medium">{invoiceRef(job)}.pdf</div>
                  <div className="text-muted-foreground">
                    Generated {formatLondonDateTime(job.landlordInvoiceGeneratedAt)}
                    {job.landlordInformedAt && ` · Emailed ${formatLondonDateTime(job.landlordInformedAt)}`}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => openStoredFile(job.landlordInvoiceFileId as string).catch((e) => toast.error(e.message))}>
                    <Eye className="h-4 w-4 mr-2" /> View
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => openStoredFile(job.landlordInvoiceFileId as string, { download: true }).catch((e) => toast.error(e.message))}>
                    <Download className="h-4 w-4 mr-2" /> Download
                  </Button>
                  {canManage && (
                    <Button type="button" size="sm" disabled={emailing || !landlordEmail} onClick={emailInvoice}>
                      <Mail className="h-4 w-4 mr-2" /> {emailing ? "Sending…" : "Email invoice to landlord"}
                    </Button>
                  )}
                </div>
              </div>
              {canManage && (
                <p className="text-xs text-muted-foreground">
                  {landlordEmail
                    ? `Sends to ${landlordName} (${landlordEmail}). The landlord is never emailed automatically.`
                    : "This property's landlord has no email on file."}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No landlord invoice has been generated yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
