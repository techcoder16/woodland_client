import { useRef, useState } from "react";
import { Edit, FileText, Loader2, Plus, Trash2, Upload, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { post } from "@/helper/api";

export interface DraftPropertyDoc {
  localId: string;
  title: string;
  documentDate?: string;
  file?: File;
}

interface GeneralDocumentsDraftStepProps {
  drafts: DraftPropertyDoc[];
  onDraftsChange: (docs: DraftPropertyDoc[]) => void;
}

// Same buffer-until-property-exists pattern as ComplianceDraftStep — a
// PropertyDocument needs a real propertyId, which doesn't exist until the
// wizard's final submit, so documents are staged here and created for real
// once the property is saved.
export default function GeneralDocumentsDraftStep({ drafts, onDraftsChange }: GeneralDocumentsDraftStepProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLocalId, setEditingLocalId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", documentDate: "" });
  const [file, setFile] = useState<File | undefined>(undefined);
  const [extracting, setExtracting] = useState(false);
  const [ocrSummary, setOcrSummary] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setForm({ title: "", documentDate: "" });
    setFile(undefined);
    setOcrSummary(null);
    setEditingLocalId(null);
  };

  const openAdd = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (doc: DraftPropertyDoc) => {
    setEditingLocalId(doc.localId);
    setForm({ title: doc.title, documentDate: doc.documentDate || "" });
    setFile(doc.file);
    setModalOpen(true);
  };

  const remove = (localId: string) => {
    onDraftsChange(drafts.filter((d) => d.localId !== localId));
  };

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

  const save = () => {
    if (!form.title.trim()) {
      toast.error("Enter a document title.");
      return;
    }
    const entry: DraftPropertyDoc = {
      localId: editingLocalId || crypto.randomUUID(),
      title: form.title,
      documentDate: form.documentDate || undefined,
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
          <h3 className="text-lg font-semibold">General Documents</h3>
          <p className="text-sm text-muted-foreground">Title deeds, tenancy agreements, and any other property paperwork.</p>
        </div>
        <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" />Add document</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>File</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {drafts.length === 0 ? (
            <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No documents added yet. You can add or update these later from the property's Documents section.</TableCell></TableRow>
          ) : (
            drafts.map((doc) => (
              <TableRow key={doc.localId}>
                <TableCell>{doc.title}</TableCell>
                <TableCell>{doc.documentDate ? new Date(doc.documentDate).toLocaleDateString("en-GB") : "-"}</TableCell>
                <TableCell>{doc.file ? <span className="flex items-center gap-1 text-xs text-muted-foreground"><FileText className="h-3.5 w-3.5" />{doc.file.name}</span> : "-"}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(doc)}><Edit className="h-4 w-4" /></Button>
                    <Button size="sm" variant="outline" onClick={() => remove(doc.localId)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={modalOpen} onOpenChange={(open) => { setModalOpen(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingLocalId ? "Edit document" : "Add document"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>File</Label>
              <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.gif" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] || undefined); setOcrSummary(null); }} />
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
            <Button className="w-full" onClick={save}>{editingLocalId ? "Save changes" : "Add document"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
