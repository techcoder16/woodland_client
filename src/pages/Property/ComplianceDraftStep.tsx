import { useRef, useState } from "react";
import { AlertTriangle, Edit, FileText, Loader2, Plus, Trash2, Upload, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { post } from "@/helper/api";

const DOC_TYPES = [
  { value: "GAS_SAFETY", label: "Gas Safety Certificate" },
  { value: "ELECTRICAL_SAFETY", label: "Electrical Safety Certificate" },
  { value: "EPC", label: "EPC" },
  { value: "PROPERTY_LICENSE", label: "Property License" },
  { value: "FIRE_RISK_ASSESSMENT", label: "Fire Risk Assessment" },
  { value: "INSURANCE", label: "Insurance Certificate" },
  { value: "OTHER", label: "Other" },
];

export interface DraftComplianceDoc {
  localId: string;
  docType: string;
  label?: string;
  startDate?: string;
  expiryDate?: string;
  notes?: string;
  file?: File;
}

function expiryStatus(expiryDate?: string) {
  if (!expiryDate) return { label: "No expiry set", tone: "outline" as const };
  const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: "Expired", tone: "destructive" as const };
  if (days <= 30) return { label: `Expires in ${days}d`, tone: "destructive" as const };
  if (days <= 90) return { label: `Expires in ${days}d`, tone: "secondary" as const };
  return { label: `Valid until ${new Date(expiryDate).toLocaleDateString("en-GB")}`, tone: "outline" as const };
}

interface ComplianceDraftStepProps {
  drafts: DraftComplianceDoc[];
  onDraftsChange: (docs: DraftComplianceDoc[]) => void;
}

// Same buffer-until-property-exists pattern as NotesStep's draft mode — a
// ComplianceDocument needs a real propertyId, which doesn't exist until the
// wizard's final submit, so certificates are staged here (with OCR-assisted
// date extraction) and created for real once the property is saved.
export default function ComplianceDraftStep({ drafts, onDraftsChange }: ComplianceDraftStepProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLocalId, setEditingLocalId] = useState<string | null>(null);
  const [form, setForm] = useState({ docType: "GAS_SAFETY", label: "", startDate: "", expiryDate: "", notes: "" });
  const [file, setFile] = useState<File | undefined>(undefined);
  const [extracting, setExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setForm({ docType: "GAS_SAFETY", label: "", startDate: "", expiryDate: "", notes: "" });
    setFile(undefined);
    setEditingLocalId(null);
  };

  const openAdd = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (doc: DraftComplianceDoc) => {
    setEditingLocalId(doc.localId);
    setForm({ docType: doc.docType, label: doc.label || "", startDate: doc.startDate || "", expiryDate: doc.expiryDate || "", notes: doc.notes || "" });
    setFile(doc.file);
    setModalOpen(true);
  };

  const remove = (localId: string) => {
    onDraftsChange(drafts.filter((d) => d.localId !== localId));
  };

  const extractDates = async () => {
    if (!file) return;
    setExtracting(true);
    try {
      const payload = new FormData();
      payload.append("file", file);
      const { data, error } = await post<any>("property-management/compliance/extract-dates", payload);
      if (error) throw new Error(error.message);
      const found = data?.data;
      if (!found) {
        toast.error("OCR couldn't read this document. Enter the dates manually.");
        return;
      }
      setForm((f) => ({
        ...f,
        docType: DOC_TYPES.some((t) => t.value === found.docType) ? found.docType : f.docType,
        startDate: found.issueDate ? found.issueDate.slice(0, 10) : f.startDate,
        expiryDate: found.expiryDate ? found.expiryDate.slice(0, 10) : f.expiryDate,
      }));
      const validity = found.validity;
      if (validity?.status === "EXPIRED" || validity?.status === "NOT_YET_VALID") {
        toast.error(validity.reason);
      } else if (validity?.status === "EXPIRING_SOON") {
        toast.warning(validity.reason);
      } else if (validity?.status === "VALID") {
        toast.success(validity.reason);
      } else {
        toast.info("Extraction complete — no expiry date found, please review the fields below.");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to extract dates from this document.");
    } finally {
      setExtracting(false);
    }
  };

  const save = () => {
    const entry: DraftComplianceDoc = {
      localId: editingLocalId || crypto.randomUUID(),
      docType: form.docType,
      label: form.label || undefined,
      startDate: form.startDate || undefined,
      expiryDate: form.expiryDate || undefined,
      notes: form.notes || undefined,
      file,
    };
    onDraftsChange(editingLocalId ? drafts.map((d) => (d.localId === editingLocalId ? entry : d)) : [...drafts, entry]);
    setModalOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Compliance Information</h3>
          <p className="text-sm text-muted-foreground">Upload certificates, licences and inspection details — issue/expiry dates can be auto-filled via OCR.</p>
        </div>
        <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" />Add certificate</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Issue Date</TableHead>
            <TableHead>Expiry Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>File</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {drafts.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No certificates added yet. You can add or update these later from the property's Compliance section.</TableCell></TableRow>
          ) : (
            drafts.map((doc) => {
              const status = expiryStatus(doc.expiryDate);
              const typeLabel = DOC_TYPES.find((t) => t.value === doc.docType)?.label || doc.docType;
              return (
                <TableRow key={doc.localId}>
                  <TableCell>{doc.label || typeLabel}</TableCell>
                  <TableCell>{doc.startDate ? new Date(doc.startDate).toLocaleDateString("en-GB") : "-"}</TableCell>
                  <TableCell>{doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString("en-GB") : "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {status.tone === "destructive" && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                      <Badge variant={status.tone}>{status.label}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>{doc.file ? <span className="flex items-center gap-1 text-xs text-muted-foreground"><FileText className="h-3.5 w-3.5" />{doc.file.name}</span> : "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(doc)}><Edit className="h-4 w-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => remove(doc.localId)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <Dialog open={modalOpen} onOpenChange={(open) => { setModalOpen(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingLocalId ? "Edit certificate" : "Add certificate"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Document type *</Label>
              <Select value={form.docType} onValueChange={(value) => setForm((f) => ({ ...f, docType: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DOC_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {form.docType === "OTHER" && (
              <div className="space-y-1"><Label>Label</Label><Input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="e.g. HMO License" /></div>
            )}
            <div className="space-y-1">
              <Label>Certificate file</Label>
              <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.gif" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || undefined)} />
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-1.5 h-3.5 w-3.5" />Choose file
                </Button>
                {file && <span className="max-w-[10rem] truncate text-xs text-muted-foreground" title={file.name}>{file.name}</span>}
                <Button type="button" size="sm" variant="outline" disabled={!file || extracting} onClick={extractDates}>
                  {extracting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Wand2 className="mr-1.5 h-3.5 w-3.5" />}
                  Extract dates via OCR
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Issue date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Expiry date</Label><Input type="date" value={form.expiryDate} onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))} /></div>
            </div>
            <div className="space-y-1"><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional" /></div>
            <Button className="w-full" onClick={save}>{editingLocalId ? "Save changes" : "Add certificate"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
