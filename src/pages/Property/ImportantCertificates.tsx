import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileText, Flame, Loader2, ShieldCheck, Upload, Wand2, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { post } from "@/helper/api";
import { DraftComplianceDoc } from "./ComplianceDraftStep";

/**
 * The certificates every property is expected to hold. Each maps to a
 * ComplianceDocType so the upload becomes a real ComplianceDocument row with
 * its own start/expiry dates — rather than the old base64-blob-per-type fields
 * on `property`, which had no expiry tracking.
 *
 * Labels, icons and order mirror MANDATORY_TYPES in Manager/Documents.tsx so
 * the Add wizard and the Edit page's certificates section read identically;
 * the only difference is that these stage until the property is saved.
 */
const IMPORTANT_CERTIFICATES = [
  { docType: "GAS_SAFETY", label: "Gas Safety Certificate", hint: "Required (gas present at property)", icon: Flame, iconClass: "bg-orange-100 text-orange-600" },
  { docType: "ELECTRICAL_SAFETY", label: "Electrical Installation Condition Report (EICR)", hint: "Required", icon: Zap, iconClass: "bg-amber-100 text-amber-600" },
  { docType: "EPC", label: "Energy Performance Certificate (EPC)", hint: "Required", icon: ShieldCheck, iconClass: "bg-blue-100 text-blue-600" },
  { docType: "FIRE_RISK_ASSESSMENT", label: "Fire Risk Assessment", hint: "Required for this property type", icon: AlertTriangle, iconClass: "bg-red-100 text-red-600" },
  { docType: "INSURANCE", label: "Insurance Certificate", hint: "Recommended", icon: FileText, iconClass: "bg-violet-100 text-violet-600" },
  { docType: "PROPERTY_LICENSE", label: "Property Licence", hint: "Recommended", icon: FileText, iconClass: "bg-slate-100 text-slate-600" },
];

/** Matches the Edit page's three-state badge. */
function shortStatus(expiryDate?: string) {
  if (!expiryDate) return { label: "Not uploaded", className: "bg-slate-100 text-slate-600 border-transparent" };
  const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: "Expired", className: "bg-red-100 text-red-700 border-transparent" };
  if (days <= 30) return { label: "Expiring Soon", className: "bg-amber-100 text-amber-700 border-transparent" };
  return { label: "Valid", className: "bg-emerald-100 text-emerald-700 border-transparent" };
}

const label = (docType: string) =>
  IMPORTANT_CERTIFICATES.find((c) => c.docType === docType)?.label ?? docType;

function expiryStatus(expiryDate?: string) {
  if (!expiryDate) return null;
  const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: "Expired", tone: "destructive" as const };
  if (days <= 30) return { label: `Expires in ${days}d`, tone: "destructive" as const };
  if (days <= 90) return { label: `Expires in ${days}d`, tone: "secondary" as const };
  return { label: `Valid to ${new Date(expiryDate).toLocaleDateString("en-GB")}`, tone: "outline" as const };
}

interface ImportantCertificatesProps {
  drafts: DraftComplianceDoc[];
  onDraftsChange: (docs: DraftComplianceDoc[]) => void;
}

export default function ImportantCertificates({ drafts, onDraftsChange }: ImportantCertificatesProps) {
  const [extractingType, setExtractingType] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const draftFor = (docType: string) => drafts.find((d) => d.docType === docType);

  /**
   * Updates the draft for a certificate type. A draft is only ever created by
   * attaching a file — a dates-only row would be saved with no document and
   * rejected by the compliance endpoint.
   */
  const upsert = (docType: string, patch: Partial<DraftComplianceDoc>) => {
    const existing = draftFor(docType);
    if (existing) {
      onDraftsChange(drafts.map((d) => (d.docType === docType ? { ...d, ...patch } : d)));
      return;
    }
    if (!patch.file) return;
    onDraftsChange([...drafts, { localId: crypto.randomUUID(), docType, ...patch }]);
  };

  const clear = (docType: string) => {
    onDraftsChange(drafts.filter((d) => d.docType !== docType));
    const input = fileInputs.current[docType];
    if (input) input.value = "";
  };

  /**
   * Sends the certificate through Woodland OCR and pre-fills the dates. The
   * user reviews and can correct anything before the property is saved.
   */
  const extractDates = async (docType: string, file: File) => {
    setExtractingType(docType);
    try {
      const payload = new FormData();
      payload.append("file", file);
      const { data, error } = await post<any>("property-management/compliance/extract-dates", payload);
      if (error) throw new Error(error.message);
      const found = data?.data;
      if (!found) {
        toast.error("OCR couldn't read this certificate. Enter the dates manually.");
        return;
      }
      upsert(docType, {
        startDate: found.issueDate ? found.issueDate.slice(0, 10) : undefined,
        expiryDate: found.expiryDate ? found.expiryDate.slice(0, 10) : undefined,
      });

      // The OCR service decides validity, so the same verdict is shown here and
      // stored later rather than being re-derived differently in each place.
      const validity = found.validity;
      if (validity?.status === "EXPIRED" || validity?.status === "NOT_YET_VALID") {
        toast.error(`${label(docType)}: ${validity.reason}`);
      } else if (validity?.status === "EXPIRING_SOON") {
        toast.warning(`${label(docType)}: ${validity.reason}`);
      } else if (validity?.status === "VALID") {
        toast.success(`${label(docType)}: ${validity.reason}`);
      } else {
        toast.info("Extraction complete — no expiry date found, please review the dates below.");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to read dates from this certificate.");
    } finally {
      setExtractingType(null);
    }
  };

  // Attaching a file immediately runs OCR, so the common path is one click.
  const onFilePicked = async (docType: string, file: File | undefined) => {
    if (!file) return;
    upsert(docType, { file });
    await extractDates(docType, file);
  };

  const uploadedCount = IMPORTANT_CERTIFICATES.filter((c) => draftFor(c.docType)?.file).length;

  return (
    <div className="w-full p-4">
      <div className="mb-1 px-1">
        <h3 className="text-lg font-semibold">Certificates &amp; Compliance</h3>
        <p className="text-sm text-muted-foreground">
          Attach a certificate and its issue/expiry dates are read automatically. They are saved with the property.
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="surface p-5">
          <h4 className="mb-1 text-sm font-semibold uppercase text-muted-foreground">Safety Certificates</h4>
          <div>
            {IMPORTANT_CERTIFICATES.map(({ docType, label, hint, icon: Icon, iconClass }) => {
              const draft = draftFor(docType);
              const status = shortStatus(draft?.expiryDate);
              const busy = extractingType === docType;

              return (
                <div key={docType} className="flex flex-wrap items-center gap-4 border-b py-4 last:border-0">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-[220px] flex-1">
                    <p className="font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">
                      {busy ? "Reading the document — this can take up to a minute…" : draft?.file?.name || hint}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      ref={(element) => { fileInputs.current[docType] = element; }}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      disabled={busy}
                      onChange={(event) => onFilePicked(docType, event.target.files?.[0])}
                    />
                    <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => fileInputs.current[docType]?.click()}>
                      {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
                      {busy ? "Reading dates…" : draft?.file ? "Replace" : "Upload Certificate"}
                    </Button>
                    {draft?.file && (
                      <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => extractDates(docType, draft.file as File)} title="Read the dates again">
                        <Wand2 className="h-4 w-4" />
                      </Button>
                    )}
                    {draft && (
                      <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => clear(docType)} title="Remove">
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Issue Date</Label>
                    <Input
                      type="date"
                      className="h-8 w-36"
                      value={draft?.startDate || ""}
                      disabled={!draft}
                      onChange={(event) => upsert(docType, { startDate: event.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Expiry Date</Label>
                    <Input
                      type="date"
                      className="h-8 w-36"
                      value={draft?.expiryDate || ""}
                      disabled={!draft}
                      onChange={(event) => upsert(docType, { expiryDate: event.target.value })}
                    />
                  </div>

                  <Badge className={status.className}>{status.label}</Badge>
                </div>
              );
            })}
          </div>
        </div>

        <div className="surface h-fit space-y-3 p-5">
          <h4 className="font-semibold">Compliance Overview</h4>
          {IMPORTANT_CERTIFICATES.map(({ docType, label }) => {
            const status = shortStatus(draftFor(docType)?.expiryDate);
            return (
              <div key={docType} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{label.replace(/ \(.*\)$/, "")}</span>
                <Badge className={status.className}>{status.label}</Badge>
              </div>
            );
          })}
          <div className={`flex items-center gap-2 rounded-md border p-2.5 text-xs ${uploadedCount === IMPORTANT_CERTIFICATES.length ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
            {uploadedCount === IMPORTANT_CERTIFICATES.length ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <FileText className="h-4 w-4 shrink-0" />}
            {uploadedCount} of {IMPORTANT_CERTIFICATES.length} certificates attached.
          </div>
        </div>
      </div>
    </div>
  );
}
