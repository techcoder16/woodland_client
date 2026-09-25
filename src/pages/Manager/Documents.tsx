import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Flame, FileText, Loader2, Plus, ShieldCheck, Trash2, Upload, Wand2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { get, post, patch, del } from "@/helper/api";

const API_URL = import.meta.env.VITE_API_URL;

const DOC_TYPES = [
  { value: "GAS_SAFETY", label: "Gas Safety Certificate" },
  { value: "ELECTRICAL_SAFETY", label: "Electrical Installation Condition Report (EICR)" },
  { value: "EPC", label: "Energy Performance Certificate (EPC)" },
  { value: "PROPERTY_LICENSE", label: "Property License" },
  { value: "FIRE_RISK_ASSESSMENT", label: "Fire Risk Assessment" },
  { value: "INSURANCE", label: "Insurance Certificate" },
  { value: "OTHER", label: "Other" },
];

// The four certificates required on (almost) every property — shown as
// fixed rows with inline issue/expiry date editing, mirroring the
// "Compliance Information" step of the property wizard. Anything else
// (insurance, licences, ad-hoc certs) is added freely in the list below.
const MANDATORY_TYPES = [
  { value: "GAS_SAFETY", label: "Gas Safety Certificate", hint: "Required (gas present at property)", icon: Flame, iconClass: "bg-orange-100 text-orange-600" },
  { value: "ELECTRICAL_SAFETY", label: "Electrical Installation Condition Report (EICR)", hint: "Required", icon: Zap, iconClass: "bg-amber-100 text-amber-600" },
  { value: "EPC", label: "Energy Performance Certificate (EPC)", hint: "Required", icon: ShieldCheck, iconClass: "bg-blue-100 text-blue-600" },
  { value: "FIRE_RISK_ASSESSMENT", label: "Fire Risk Assessment", hint: "Required for this property type", icon: AlertTriangle, iconClass: "bg-red-100 text-red-600" },
] as const;

// Short badge for the fixed compliance rows / overview panel — a tighter
// three-state read than expiryStatus()'s longer "Expires in Nd" text.
function shortStatus(expiryDate?: string) {
  if (!expiryDate) return { label: "Not uploaded", className: "bg-slate-100 text-slate-600 border-transparent" };
  const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: "Expired", className: "bg-red-100 text-red-700 border-transparent" };
  if (days <= 30) return { label: "Expiring Soon", className: "bg-amber-100 text-amber-700 border-transparent" };
  return { label: "Valid", className: "bg-emerald-100 text-emerald-700 border-transparent" };
}

type ComplianceDoc = {
  id: string;
  docType: string;
  label?: string;
  startDate?: string;
  expiryDate?: string;
  fileUrl?: string;
  fileName?: string;
  notes?: string;
};

type PropertyDoc = {
  id: string;
  title: string;
  documentDate?: string;
  fileUrl?: string;
  fileName?: string;
  extractedByOcr?: boolean;
  ocrSummary?: string;
};

function expiryStatus(expiryDate?: string) {
  if (!expiryDate) return { label: "No expiry set", tone: "outline" as const };
  const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: "Expired", tone: "destructive" as const };
  if (days <= 30) return { label: `Expires in ${days}d`, tone: "destructive" as const };
  if (days <= 90) return { label: `Expires in ${days}d`, tone: "secondary" as const };
  return { label: `Valid until ${new Date(expiryDate).toLocaleDateString("en-GB")}`, tone: "outline" as const };
}

function fileHref(fileUrl: string) {
  return `${API_URL.replace(/\/api\/?$/, "")}${fileUrl}`;
}

type CertificateValidity = {
  status: "VALID" | "EXPIRING_SOON" | "EXPIRED" | "NOT_YET_VALID" | "UNKNOWN";
  isValid: boolean | null;
  daysRemaining: number | null;
  reason: string;
};

type ExtractedCertificate = {
  docType?: string;
  issueDate?: string;
  expiryDate?: string;
  certificateNumber?: string;
  issuedBy?: string;
  validity?: CertificateValidity;
};

/**
 * Runs a certificate through OCR (via the API server — the OCR service is
 * never called from the browser) and returns the dates it found.
 *
 * Shared by the fixed compliance rows and the "other certificates" modal so
 * both report validity the same way.
 */
async function runCertificateOcr(file: File): Promise<ExtractedCertificate | null> {
  const payload = new FormData();
  payload.append("file", file);
  const { data, error } = await post<any>("property-management/compliance/extract-dates", payload);
  if (error) throw new Error(error.message);
  return (data?.data as ExtractedCertificate) ?? null;
}

/** Reports the OCR verdict as a toast, colour-coded by how urgent it is. */
function reportValidity(name: string, found: ExtractedCertificate | null) {
  const validity = found?.validity;
  if (!validity || validity.status === "UNKNOWN") {
    toast.warning(`${name}: no expiry date could be read — please enter it manually.`);
    return;
  }
  if (validity.status === "EXPIRED" || validity.status === "NOT_YET_VALID") {
    toast.error(`${name}: ${validity.reason}`);
    return;
  }
  if (validity.status === "EXPIRING_SOON") {
    toast.warning(`${name}: ${validity.reason}`);
    return;
  }
  toast.success(`${name}: ${validity.reason}`);
}

// One fixed compliance row (Gas Safety / EICR / EPC / Fire Risk). Uploading
// a file both attaches it and creates the row if none exists yet for this
// docType; issue/expiry dates save inline as soon as they're edited.
function MandatoryCertRow({ config, doc, propertyId, onSaved }: {
  config: (typeof MANDATORY_TYPES)[number];
  doc?: ComplianceDoc;
  propertyId: string;
  onSaved: () => void;
}) {
  const [startDate, setStartDate] = useState(doc?.startDate ? doc.startDate.slice(0, 10) : "");
  const [expiryDate, setExpiryDate] = useState(doc?.expiryDate ? doc.expiryDate.slice(0, 10) : "");
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const Icon = config.icon;
  const status = shortStatus(expiryDate);

  useEffect(() => {
    setStartDate(doc?.startDate ? doc.startDate.slice(0, 10) : "");
    setExpiryDate(doc?.expiryDate ? doc.expiryDate.slice(0, 10) : "");
  }, [doc?.id, doc?.startDate, doc?.expiryDate]);

  const upsert = async (fields: { startDate?: string; expiryDate?: string; file?: File }) => {
    // Nothing to record yet — don't create an empty certificate row just
    // because a date input was focused and left blank.
    if (!doc && !fields.file && !fields.startDate && !fields.expiryDate) return;
    setBusy(true);
    try {
      const payload = new FormData();
      if (!doc) {
        payload.append("propertyId", propertyId);
        payload.append("docType", config.value);
      }
      // Only send dates that actually parse — the server validates these with
      // @IsDateString(), so a blank or half-typed date value would 422 the
      // whole upload and lose the file with it.
      const isoDate = (value?: string) => {
        if (!value) return null;
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
      };
      const startIso = isoDate(fields.startDate);
      const expiryIso = isoDate(fields.expiryDate);
      if (startIso) payload.append("startDate", startIso);
      if (expiryIso) payload.append("expiryDate", expiryIso);
      if (fields.file) payload.append("file", fields.file);

      const { error } = doc
        ? await patch(`property-management/compliance/${doc.id}`, payload)
        : await post("property-management/compliance", payload);
      if (error) throw new Error(error.message);
      onSaved();
    } catch (error: any) {
      toast.error(error.message || `Failed to save ${config.label}.`);
    } finally {
      setBusy(false);
    }
  };

  /**
   * Attaching a certificate reads its dates first, then saves the file and
   * those dates together. Previously the upload saved the file only, so the
   * row came back with no dates and no indication of whether it was valid.
   *
   * OCR failing must not lose the upload, so the file is still saved with
   * whatever dates are on screen.
   */
  const onFilePicked = async (file: File) => {
    setReading(true);
    let found: ExtractedCertificate | null = null;
    try {
      found = await runCertificateOcr(file);
    } catch (error: any) {
      toast.error(error?.message || `Couldn't read ${config.label} — saving the file, please enter the dates manually.`);
    } finally {
      setReading(false);
    }

    const nextStart = found?.issueDate ? found.issueDate.slice(0, 10) : startDate;
    const nextExpiry = found?.expiryDate ? found.expiryDate.slice(0, 10) : expiryDate;
    setStartDate(nextStart);
    setExpiryDate(nextExpiry);

    await upsert({ startDate: nextStart, expiryDate: nextExpiry, file });
    if (found) reportValidity(config.label, found);
  };

  return (
    <div className="flex flex-wrap items-center gap-4 border-b py-4 last:border-0">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.iconClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-[220px] flex-1">
        <p className="font-medium">{config.label}</p>
        <p className="text-xs text-muted-foreground">{config.hint}</p>
      </div>
      <div className="flex items-center gap-2">
        <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.gif" className="hidden" onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onFilePicked(f);
          e.target.value = "";
        }} />
        <Button type="button" size="sm" variant="outline" disabled={busy || reading} onClick={() => fileInputRef.current?.click()}>
          {busy || reading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
          {reading ? "Reading dates…" : busy ? "Saving…" : "Upload Certificate"}
        </Button>
        {doc?.fileUrl && <a href={fileHref(doc.fileUrl)} target="_blank" rel="noreferrer" className="text-xs text-primary underline">View</a>}
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Issue Date</Label>
        <Input type="date" className="h-8 w-36" value={startDate} onChange={(e) => setStartDate(e.target.value)} onBlur={() => void upsert({ startDate })} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Expiry Date</Label>
        <Input type="date" className="h-8 w-36" value={expiryDate} onChange={(e) => { setExpiryDate(e.target.value); void upsert({ expiryDate: e.target.value }); }} />
      </div>
      <Badge className={status.className}>{status.label}</Badge>
    </div>
  );
}

export function CertificatesSection({ propertyId }: { propertyId: string }) {
  const [docs, setDocs] = useState<ComplianceDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ docType: "INSURANCE", label: "", startDate: "", expiryDate: "", notes: "" });
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await get<{ data: ComplianceDoc[] }>(`property-management/compliance/${propertyId}`);
    setDocs(data?.data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (propertyId) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  const resetForm = () => {
    setForm({ docType: "INSURANCE", label: "", startDate: "", expiryDate: "", notes: "" });
    setFile(null);
  };

  // Runs the uploaded certificate through Woodland OCR to suggest issue/
  // expiry dates and a document type — the user still reviews and can
  // correct anything before saving.
  const extractDates = async (target?: File) => {
    const source = target ?? file;
    if (!source) return;
    setExtracting(true);
    try {
      const found = await runCertificateOcr(source);
      if (!found) {
        toast.error("OCR couldn't read this document. Enter the dates manually.");
        return;
      }
      setForm((f) => ({
        ...f,
        docType: DOC_TYPES.some((t) => t.value === found.docType) ? found.docType! : f.docType,
        startDate: found.issueDate ? found.issueDate.slice(0, 10) : f.startDate,
        expiryDate: found.expiryDate ? found.expiryDate.slice(0, 10) : f.expiryDate,
      }));
      reportValidity("Certificate", found);
    } catch (error: any) {
      toast.error(error.message || "Failed to extract dates from this document.");
    } finally {
      setExtracting(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = new FormData();
      payload.append("propertyId", propertyId);
      payload.append("docType", form.docType);
      if (form.label) payload.append("label", form.label);
      // A half-typed or invalid date must not 422 the save (see MandatoryCertRow).
      const isoDate = (value?: string) => {
        if (!value) return null;
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
      };
      const startIso = isoDate(form.startDate);
      const expiryIso = isoDate(form.expiryDate);
      if (startIso) payload.append("startDate", startIso);
      if (expiryIso) payload.append("expiryDate", expiryIso);
      if (form.notes) payload.append("notes", form.notes);
      if (file) payload.append("file", file);

      const { error } = await post("property-management/compliance", payload);
      if (error) throw new Error(error.message);

      toast.success("Compliance document saved.");
      setModalOpen(false);
      resetForm();
      void load();
    } catch (error: any) {
      toast.error(error.message || "Failed to save compliance document.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this compliance document? This can be restored by support if needed.")) return;
    const { error } = await del(`property-management/compliance/${id}`);
    if (error) {
      toast.error(error.message || "Failed to delete document.");
      return;
    }
    toast.success("Document deleted.");
    void load();
  };

  // Only the first row per mandatory docType is shown fixed; any extra rows
  // of that type (unlikely, but possible via re-upload flows) fall through
  // to the free-form "Other certificates" list below so nothing is hidden.
  const mandatoryDocs = new Map(MANDATORY_TYPES.map((m) => [m.value, docs.find((d) => d.docType === m.value)]));
  const otherDocs = docs.filter((d) => {
    const claimedByMandatory = mandatoryDocs.get(d.docType);
    return !(claimedByMandatory && claimedByMandatory.id === d.id);
  });
  const mandatoryCount = MANDATORY_TYPES.length;
  const mandatoryValidCount = MANDATORY_TYPES.filter((m) => {
    const d = mandatoryDocs.get(m.value);
    return d?.expiryDate && shortStatus(d.expiryDate).label === "Valid";
  }).length;
  const allMandatoryComplete = MANDATORY_TYPES.every((m) => mandatoryDocs.get(m.value)?.expiryDate);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Certificates &amp; Compliance</h3>
        <p className="text-sm text-muted-foreground">Upload certificates and track issue/expiry dates — status updates automatically.</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <div className="surface p-5">
            <h4 className="mb-1 text-sm font-semibold uppercase text-muted-foreground">Safety Certificates</h4>
            <div>
              {MANDATORY_TYPES.map((config) => (
                <MandatoryCertRow key={config.value} config={config} doc={mandatoryDocs.get(config.value)} propertyId={propertyId} onSaved={load} />
              ))}
            </div>
          </div>

          <div className="surface p-5 space-y-3 h-fit">
            <h4 className="font-semibold">Compliance Overview</h4>
            {MANDATORY_TYPES.map((config) => {
              const d = mandatoryDocs.get(config.value);
              const status = shortStatus(d?.expiryDate);
              return (
                <div key={config.value} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{config.label.replace(/ \(.*\)$/, "")}</span>
                  <Badge className={status.className}>{status.label}</Badge>
                </div>
              );
            })}
            <div className={`flex items-center gap-2 rounded-md border p-2.5 text-xs ${allMandatoryComplete ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
              {allMandatoryComplete ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
              {allMandatoryComplete ? "All mandatory items are complete." : `${mandatoryValidCount} of ${mandatoryCount} mandatory certificates are valid.`}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <div>
          <h4 className="font-semibold">Other Certificates</h4>
          <p className="text-xs text-muted-foreground">Insurance, licences, and any other compliance documents.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus className="mr-2 h-4 w-4" />Add certificate</Button>
      </div>

      {!loading && !otherDocs.length && (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No other certificates uploaded for this property yet.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {otherDocs.map((doc) => {
          const status = expiryStatus(doc.expiryDate);
          const typeLabel = DOC_TYPES.find((t) => t.value === doc.docType)?.label || doc.docType;
          return (
            <div key={doc.id} className="rounded-lg border p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />{doc.label || typeLabel}</p>
                  <p className="text-xs text-muted-foreground">{typeLabel}</p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => void remove(doc.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {status.tone === "destructive" && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                <Badge variant={status.tone}>{status.label}</Badge>
              </div>
              {doc.startDate && <p className="text-xs text-muted-foreground">Start: {new Date(doc.startDate).toLocaleDateString("en-GB")}</p>}
              {doc.notes && <p className="text-xs text-muted-foreground">{doc.notes}</p>}
              {doc.fileUrl && (
                <a href={fileHref(doc.fileUrl)} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
                  View {doc.fileName || "file"}
                </a>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={modalOpen} onOpenChange={(open) => { setModalOpen(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add certificate</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Document type *</Label>
              <Select value={form.docType} onValueChange={(value) => setForm((f) => ({ ...f, docType: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DOC_TYPES.filter((t) => !MANDATORY_TYPES.some((m) => m.value === t.value)).map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {form.docType === "OTHER" && (
              <div className="space-y-1"><Label>Label</Label><Input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="e.g. HMO License" /></div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Start date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Expiry date</Label><Input type="date" value={form.expiryDate} onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))} /></div>
            </div>
            <div className="space-y-1"><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional" /></div>
            <div className="space-y-1">
              <Label>Certificate file</Label>
              {/* Choosing a file reads it straight away — the wand is only
                  needed to run OCR again after a correction. */}
              <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.gif" className="hidden" onChange={(e) => {
                const picked = e.target.files?.[0] || null;
                setFile(picked);
                if (picked) void extractDates(picked);
              }} />
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" size="sm" variant="outline" disabled={extracting} onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-1.5 h-3.5 w-3.5" />Choose file
                </Button>
                {file && <span className="max-w-[10rem] truncate text-xs text-muted-foreground" title={file.name}>{file.name}</span>}
                <Button type="button" size="sm" variant="outline" disabled={!file || extracting} onClick={() => void extractDates()}>
                  {extracting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Wand2 className="mr-1.5 h-3.5 w-3.5" />}
                  Read again
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {extracting ? "Reading the document — this can take up to a minute…" : "Choosing a file reads its type and dates automatically."}
              </p>
            </div>
            <Button className="w-full" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Save document
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function GeneralDocumentsSection({ propertyId }: { propertyId: string }) {
  const [docs, setDocs] = useState<PropertyDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [form, setForm] = useState({ title: "", documentDate: "" });
  const [file, setFile] = useState<File | null>(null);
  const [ocrSummary, setOcrSummary] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await get<{ data: PropertyDoc[] }>(`property-management/documents/${propertyId}`);
    setDocs(data?.data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (propertyId) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  const resetForm = () => {
    setForm({ title: "", documentDate: "" });
    setFile(null);
    setOcrSummary(null);
  };

  // Runs the uploaded document through Woodland OCR to preview a summary
  // before it's saved — the user still confirms and can edit the title.
  const extractSummary = async () => {
    if (!file) return;
    setExtracting(true);
    try {
      const payload = new FormData();
      payload.append("file", file);
      const { data, error } = await post<any>("property-management/documents/extract-summary", payload);
      if (error) throw new Error(error.message);
      setOcrSummary(data?.data?.summary || null);
      if (!form.title) setForm((f) => ({ ...f, title: file.name.replace(/\.[^.]+$/, "") }));
      toast.success("Document read via OCR — review the summary below.");
    } catch (error: any) {
      toast.error(error.message || "Failed to read this document.");
    } finally {
      setExtracting(false);
    }
  };

  const save = async () => {
    if (!form.title.trim()) {
      toast.error("Enter a document title.");
      return;
    }
    setSaving(true);
    try {
      const payload = new FormData();
      payload.append("propertyId", propertyId);
      payload.append("title", form.title);
      if (form.documentDate) payload.append("documentDate", new Date(form.documentDate).toISOString());
      if (file) payload.append("file", file);
      if (ocrSummary) payload.append("ocrSummary", ocrSummary);

      const { error } = await post("property-management/documents", payload);
      if (error) throw new Error(error.message);

      toast.success("Document saved.");
      setModalOpen(false);
      resetForm();
      void load();
    } catch (error: any) {
      toast.error(error.message || "Failed to save document.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this document? This can be restored by support if needed.")) return;
    const { error } = await del(`property-management/documents/${id}`);
    if (error) {
      toast.error(error.message || "Failed to delete document.");
      return;
    }
    toast.success("Document deleted.");
    void load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">General Documents</h3>
          <p className="text-sm text-muted-foreground">Title deeds, tenancy agreements, and any other property paperwork — with OCR-assisted summaries.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus className="mr-2 h-4 w-4" />Add document</Button>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!loading && !docs.length && (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No documents uploaded for this property yet.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {docs.map((doc) => (
          <div key={doc.id} className="rounded-lg border p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />{doc.title}</p>
                {doc.documentDate && <p className="text-xs text-muted-foreground">{new Date(doc.documentDate).toLocaleDateString("en-GB")}</p>}
              </div>
              <Button size="icon" variant="ghost" onClick={() => void remove(doc.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
            {doc.extractedByOcr && <Badge variant="outline" className="text-[10px]">OCR summary available</Badge>}
            {doc.ocrSummary && <p className="text-xs text-muted-foreground line-clamp-3">{doc.ocrSummary}</p>}
            {doc.fileUrl && (
              <a href={fileHref(doc.fileUrl)} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
                View {doc.fileName || "file"}
              </a>
            )}
          </div>
        ))}
      </div>

      <Dialog open={modalOpen} onOpenChange={(open) => { setModalOpen(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add document</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>File</Label>
              <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.gif" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] || null); setOcrSummary(null); }} />
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-1.5 h-3.5 w-3.5" />Choose file
                </Button>
                {file && <span className="max-w-[10rem] truncate text-xs text-muted-foreground" title={file.name}>{file.name}</span>}
                <Button type="button" size="sm" variant="outline" disabled={!file || extracting} onClick={extractSummary}>
                  {extracting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Wand2 className="mr-1.5 h-3.5 w-3.5" />}
                  Read via OCR
                </Button>
              </div>
            </div>
            {ocrSummary && (
              <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground max-h-40 overflow-y-auto">{ocrSummary}</div>
            )}
            <div className="space-y-1"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Title Deed" /></div>
            <div className="space-y-1"><Label>Document date</Label><Input type="date" value={form.documentDate} onChange={(e) => setForm((f) => ({ ...f, documentDate: e.target.value }))} /></div>
            <Button className="w-full" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Save document
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Certificates live on their own Compliance tab, so this is general
// property paperwork only (title deeds, tenancy agreements, etc.).
export default function Documents({ propertyId }: { propertyId: string }) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold">Documents</h2>
        <p className="text-sm text-muted-foreground">Title deeds, agreements and other property paperwork. Certificates live on the Compliance tab.</p>
      </div>
      <GeneralDocumentsSection propertyId={propertyId} />
    </div>
  );
}
