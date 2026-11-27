// Property > Inspections: works like Licences — type, date and the uploaded report.
import { useCallback, useEffect, useState } from "react";
import { Download, Eye, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FileDropZone from "@/components/FileDropZone";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { del, get, post } from "@/helper/api";
import { openStoredFile, uploadFileOnce } from "@/helper/fileUpload";

const INSPECTION_TYPES = [
  { value: "ROUTINE", label: "Routine", className: "bg-slate-100 text-slate-700" },
  { value: "COMPLIANCE", label: "Compliance", className: "bg-blue-100 text-blue-700" },
  { value: "COUNCIL_WARNING", label: "Council warning", className: "bg-red-100 text-red-700" },
];
const typeOf = (v: string) => INSPECTION_TYPES.find((t) => t.value === v);

type Inspection = {
  id: string;
  inspectionType: string;
  inspectionDate: string;
  fileId?: string | null;
  fileName?: string | null;
  notes?: string | null;
  createdByName?: string | null;
};

const EMPTY = { inspectionType: "", inspectionDate: "", notes: "" };

export default function PropertyInspections({ propertyId }: { propertyId: string }) {
  const [rows, setRows] = useState<Inspection[] | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    get<Inspection[]>(`property-records/${propertyId}/inspections`).then(({ data, error }) => {
      if (error) toast.error(error.message || "Could not load the inspections");
      setRows(Array.isArray(data) ? data : []);
    });
  }, [propertyId]);
  useEffect(() => {
    if (propertyId) load();
  }, [propertyId, load]);

  const save = async () => {
    if (!form.inspectionType) return toast.error("Choose the inspection type.");
    if (!form.inspectionDate) return toast.error("Enter the inspection date.");
    setSaving(true);
    try {
      const fileId = file ? (await uploadFileOnce(file, { category: "compliance", entityType: "property", propertyId })).id : undefined;
      const { error } = await post(`property-records/${propertyId}/inspections`, {
        inspectionType: form.inspectionType,
        inspectionDate: new Date(`${form.inspectionDate}T00:00:00Z`).toISOString(),
        fileId,
        notes: form.notes.trim() || undefined,
      });
      if (error) throw new Error(error.message);
      toast.success("Inspection saved.");
      setOpen(false);
      setForm(EMPTY);
      setFile(null);
      load();
    } catch (e: any) {
      toast.error(e.message || "Could not save the inspection.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this inspection?")) return;
    const { error } = await del(`property-records/inspections/${id}`);
    if (error) return toast.error(error.message || "Could not delete the inspection.");
    toast.success("Inspection deleted.");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Inspections</h3>
          <p className="text-sm text-muted-foreground">Routine, compliance and council-warning inspections, with the inspection report.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Upload inspection report</Button>
      </div>

      {rows === null ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No inspections recorded for this property yet.</div>
      ) : (
        <div className="surface overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Inspection type</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Report</th>
                <th className="px-4 py-3 font-medium">Notes</th>
                <th className="px-4 py-3 font-medium">Added by</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const t = typeOf(r.inspectionType);
                return (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="px-4 py-3"><Badge className={t?.className}>{t?.label ?? r.inspectionType}</Badge></td>
                    <td className="px-4 py-3 whitespace-nowrap">{new Date(r.inspectionDate).toLocaleDateString("en-GB", { timeZone: "UTC" })}</td>
                    <td className="px-4 py-3">
                      {r.fileId ? (
                        <div className="flex items-center gap-1">
                          <span className="max-w-[12rem] truncate" title={r.fileName || undefined}>{r.fileName || "Report"}</span>
                          <Button size="icon" variant="ghost" className="h-7 w-7" title="View" onClick={() => openStoredFile(r.fileId as string).catch((e) => toast.error(e.message))}><Eye className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" title="Download" onClick={() => openStoredFile(r.fileId as string, { download: true }).catch((e) => toast.error(e.message))}><Download className="h-4 w-4" /></Button>
                        </div>
                      ) : "-"}
                    </td>
                    <td className="px-4 py-3 max-w-xs whitespace-pre-wrap">{r.notes || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.createdByName || "-"}</td>
                    <td className="px-4 py-3 text-right"><Button size="icon" variant="ghost" aria-label="Delete inspection" onClick={() => void remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setForm(EMPTY); setFile(null); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload inspection report</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Inspection type *</Label>
              <Select value={form.inspectionType || undefined} onValueChange={(v) => setForm((f) => ({ ...f, inspectionType: v }))}>
                <SelectTrigger><SelectValue placeholder="Routine, Compliance or Council warning" /></SelectTrigger>
                <SelectContent>{INSPECTION_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Date *</Label><Input type="date" value={form.inspectionDate} onChange={(e) => setForm((f) => ({ ...f, inspectionDate: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional" /></div>
            <div className="space-y-1"><Label>Inspection report</Label><FileDropZone file={file} onFile={setFile} /></div>
            <Button className="w-full" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Save inspection
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
