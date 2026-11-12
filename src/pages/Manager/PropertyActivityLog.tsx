import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { get } from "@/helper/api";

type ActivityRow = { id: string; type: string; title: string; description: string; createdAt: string; userName: string | null };

const TYPE_LABEL: Record<string, string> = {
  property: "Property",
  vendor: "Landlord",
  document: "Document",
  payment: "Payment",
  transaction: "Transaction",
  maintenance: "Maintenance",
  occupancy: "Occupancy",
};

/** Everything that has been done on this property, newest first. */
export default function PropertyActivityLog({ propertyId }: { propertyId: string }) {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    get<{ data: ActivityRow[] }>(`property-management/activity/${propertyId}`).then(({ data }) => {
      if (cancelled) return;
      setRows(data?.data || []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [propertyId]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Activity Log</h3>
        <p className="text-sm text-muted-foreground">What has been done on this property, newest first.</p>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No activity recorded for this property yet.</div>
      ) : (
        <ol className="surface divide-y">
          {rows.map((a) => (
            <li key={a.id} className="flex items-start gap-4 p-4">
              <Badge variant="outline" className="mt-0.5 w-24 shrink-0 justify-center">{TYPE_LABEL[a.type] ?? a.type}</Badge>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{a.title}</p>
                {a.description && <p className="text-sm text-muted-foreground">{a.description}</p>}
              </div>
              <div className="shrink-0 text-right text-xs text-muted-foreground">
                <p>{new Date(a.createdAt).toLocaleDateString("en-GB")} {new Date(a.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</p>
                {a.userName && <p>{a.userName}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
