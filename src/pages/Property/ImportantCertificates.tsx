import { useRef, useState } from "react";
import { CheckCircle2, FileText, Loader2, Upload, Wand2, X } from "lucide-react";
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
 */
const IMPORTANT_CERTIFICATES = [
  { docType: "EPC", label: "EPC" },
  { docType: "GAS_SAFETY", label: "Gas Safety Certificate" },
  { docType: "ELECTRICAL_SAFETY", label: "Electrical Safety Certificate" },
  { docType: "FIRE_RISK_ASSESSMENT", label: "Fire Risk Assessment" },
  { docType: "INSURANCE", label: "Insurance Certificate" },
  { docType: "PROPERTY_LICENSE", label: "Property Licence" },
];

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

  const upsert = (docType: string, patch: Partial<DraftComplianceDoc>) => {
    const existing = draftFor(docType);
    if (existing) {
      onDraftsChange(drafts.map((d) => (d.docType === docType ? { ...d, ...patch } : d)));
    } else {
      onDraftsChange([...drafts, { localId: crypto.randomUUID(), docType, ...patch }]);
    }
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
      toast.success(
        found.expiryDate
          ? `Found expiry date: ${new Date(found.expiryDate).toLocaleDateString("en-GB")}`
          : "Extraction complete — review the dates below.",
      );
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

  return (
    <div className="p-4 w-full">
      <div className="text-lg font-medium flex justify-start underline p-5">Important Certificates</div>
      <p className="px-5 pb-4 text-sm text-muted-foreground">
        Attach a certificate and its start and expiry dates are read automatically. Review them before saving.
      </p>

      <div className="space-y-3 px-3">
        {IMPORTANT_CERTIFICATES.map(({ docType, label }) => {
          const draft = draftFor(docType);
          const status = expiryStatus(draft?.expiryDate);
          const busy = extractingType === docType;

          return (
            <div key={docType} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{label}</span>
                  {draft?.file && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                  {status && <Badge variant={status.tone}>{status.label}</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={(element) => { fileInputs.current[docType] = element; }}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(event) => onFilePicked(docType, event.target.files?.[0])}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => fileInputs.current[docType]?.click()}
                  >
                    {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    {draft?.file ? "Replace" : "Attach"}
                  </Button>
                  {draft?.file && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => extractDates(docType, draft.file as File)}
                      title="Read the dates again"
                    >
                      <Wand2 className="h-4 w-4" />
                    </Button>
                  )}
                  {draft && (
                    <Button type="button" size="sm" variant="ghost" onClick={() => clear(docType)} title="Remove">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {draft?.file && (
                <p className="mt-2 truncate text-xs text-muted-foreground">{draft.file.name}</p>
              )}

              {draft && (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="mb-1 block text-xs">Start date</Label>
                    <Input
                      type="date"
                      value={draft.startDate || ""}
                      onChange={(event) => upsert(docType, { startDate: event.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs">Expiry date</Label>
                    <Input
                      type="date"
                      value={draft.expiryDate || ""}
                      onChange={(event) => upsert(docType, { expiryDate: event.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
