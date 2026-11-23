// Photos and PDFs attached to a job: pick or drag several files at once, view
// them, and remove any of them. Changes are saved straight away.
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Trash2, UploadCloud } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StoredFilePreview from "@/components/StoredFilePreview";
import { uploadFiles } from "@/helper/fileUpload";
import { useAppDispatch } from "@/redux/reduxHooks";
import { fetchJobTypeById, updateJobType, type JobType } from "@/redux/dataStore/jobTypeSlice";

const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";

export default function JobMediaPanel({ job, canManage }: { job: JobType; canManage: boolean }) {
  const dispatch = useAppDispatch();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const ids = job.mediaFileIds ?? [];

  const save = async (next: string[]) => {
    await dispatch(updateJobType({ id: job.id as string, jobTypeData: { propertyId: job.propertyId, mediaFileIds: next } })).unwrap();
    await dispatch(fetchJobTypeById(job.id as string));
  };

  const add = async (list: FileList | File[] | null) => {
    const files = Array.from(list ?? []).filter((f) => ACCEPT.split(",").includes(f.type));
    if (!files.length) return toast.error("Choose photos (JPG, PNG, WebP) or PDFs");
    setBusy(true);
    try {
      const stored = await uploadFiles(files, { category: "job-media", entityType: "jobType", entityId: job.id as string, propertyId: job.propertyId });
      await save([...ids, ...stored.map((f) => f.id)]);
      toast.success(`${stored.length} file${stored.length === 1 ? "" : "s"} attached`);
    } catch (error) {
      toast.error(typeof error === "string" ? error : error?.message || "Failed to attach media");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async (fileId: string) => {
    setBusy(true);
    try {
      await save(ids.filter((id) => id !== fileId));
      toast.success("Media removed");
    } catch (error) {
      toast.error(typeof error === "string" ? error : error?.message || "Failed to remove the file");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Attached media</div>
          {canManage && (
            <>
              <input ref={inputRef} type="file" multiple accept={ACCEPT} className="hidden" onChange={(e) => void add(e.target.files)} />
              <Button size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>{busy ? "Working…" : "Attach media"}</Button>
            </>
          )}
        </div>

        {canManage && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); if (!busy) void add(e.dataTransfer.files); }}
            className={`flex items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-5 text-sm text-muted-foreground ${dragging ? "border-primary bg-primary/5" : ""}`}
          >
            <UploadCloud className="h-4 w-4" /> Drag and drop photos or PDFs here, or press Attach media
          </div>
        )}

        {ids.length === 0 ? (
          <p className="text-sm text-muted-foreground">No media attached.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {ids.map((fileId, index) => (
              <div key={fileId} className="relative group">
                <StoredFilePreview fileId={fileId} alt={`Attachment ${index + 1}`} className="object-cover rounded-md shadow-sm w-full h-32" clickToOpen />
                {canManage && (
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute right-1 top-1 h-7 w-7"
                    title="Remove this file"
                    disabled={busy}
                    onClick={() => void remove(fileId)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
