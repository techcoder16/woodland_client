import { useEffect, useState } from "react";
import { Download, FileText, ImageIcon, Loader2 } from "lucide-react";
import { fetchFileUrls, openStoredFile, SignedFile } from "@/helper/fileUpload";
import { toast } from "sonner";

type Props = { property: any };

const uniq = (ids: (string | null | undefined)[]) => [...new Set(ids.filter(Boolean) as string[])];

/**
 * Everything uploaded on the property form: photographs, floor plans, the fire risk
 * assessment and the other attachments (management agreement, ID, ...). These used to be
 * saved but never shown anywhere on the property page.
 */
export default function PropertyFiles({ property }: Props) {
  const photos = uniq([property.photographFileId, ...(property.photographFileIds ?? [])]);
  const plans = uniq([property.floorPlanFileId, ...(property.floorPlanFileIds ?? [])]);
  const fire = uniq([property.fireRiskAssessmentFileId]);
  const others = uniq(property.attachmentFileIds ?? []).filter((id) => !photos.includes(id) && !plans.includes(id) && !fire.includes(id));
  const all = [...photos, ...plans, ...fire, ...others];
  const key = all.join(",");

  const [files, setFiles] = useState<Record<string, SignedFile>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      try {
        const res = await fetchFileUrls(key.split(","));
        if (cancelled) return;
        setFiles(res);
        setError(null);
        timer = setTimeout(load, 4 * 60 * 1000);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Could not load the files");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    setLoading(true);
    load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [key]);

  const open = (id: string, download: boolean) =>
    openStoredFile(id, { download }).catch(() => toast.error("This file is no longer available. Please upload it again."));

  const Tile = ({ id, label }: { id: string; label: string }) => {
    const f = files[id];
    const isImage = !!f?.contentType?.startsWith("image/");
    return (
      <div className="surface flex flex-col overflow-hidden">
        <button type="button" onClick={() => void open(id, false)} className="flex h-36 items-center justify-center bg-muted" aria-label={`View ${f?.name || label}`}>
          {isImage ? <img src={f.url} alt={f?.name || label} className="h-full w-full object-cover" /> : f ? <FileText className="h-10 w-10 text-muted-foreground" /> : <ImageIcon className="h-10 w-10 text-muted-foreground/50" />}
        </button>
        <div className="flex items-center justify-between gap-2 p-2 text-xs">
          <span className="truncate" title={f?.name}>{f?.name || (loading ? "Loading…" : "Unavailable")}</span>
          {f && (
            <button type="button" className="inline-flex shrink-0 items-center gap-1 text-primary underline" onClick={() => void open(id, true)}>
              <Download className="h-3 w-3" />Download
            </button>
          )}
        </div>
      </div>
    );
  };

  const Group = ({ title, ids, hint }: { title: string; ids: string[]; hint: string }) =>
    ids.length === 0 ? null : (
      <section className="space-y-2">
        <div>
          <h4 className="text-sm font-semibold">{title} <span className="font-normal text-muted-foreground">({ids.length})</span></h4>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {ids.map((id) => <Tile key={id} id={id} label={title} />)}
        </div>
      </section>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Photos &amp; attachments</h3>
          <p className="text-sm text-muted-foreground">Everything uploaded when the property was created or edited.</p>
        </div>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {all.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No photos or attachments yet. Add them from Edit Property, then press Save.
        </div>
      ) : (
        <>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
              The files could not be opened: {error}. They are saved, but the file service did not answer. Reload, or tell an admin if it keeps happening.
            </div>
          )}
          <Group title="Photographs" ids={photos} hint="The first photograph is the cover image shown in the page header." />
          <Group title="Floor plans" ids={plans} hint="Plans of the property layout." />
          <Group title="Fire risk assessment" ids={fire} hint="Only needed for communal properties." />
          <Group title="Other attachments" ids={others} hint="Management agreement, landlord ID and other uploaded files." />
        </>
      )}
    </div>
  );
}
