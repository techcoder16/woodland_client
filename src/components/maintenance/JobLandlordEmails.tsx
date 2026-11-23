// Emails sent to the landlord about one maintenance job, newest first.
// Every subject starts with the job ID ("Job 1A2B3C4D: ...").
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { get } from "@/helper/api";
import { formatLondonDateTime } from "@/utils/maintenanceSla";

interface LandlordCommunication {
  id: string;
  createdAt: string;
  subject?: string | null;
  body?: string | null;
  toEmails?: string[] | string | null;
  actorName?: string | null;
}

interface CommunicationsResponse {
  items: LandlordCommunication[];
}

const JobLandlordEmails = ({ jobId, reloadKey }: { jobId: string; reloadKey?: unknown }) => {
  const [items, setItems] = useState<LandlordCommunication[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const query = new URLSearchParams({ jobTypeId: jobId, page: "1", limit: "100" });
      const { data, error } = await get<CommunicationsResponse>(`property-management/landlord-communications?${query.toString()}`);
      if (cancelled) return;
      if (error) {
        toast.error(error.message || "Failed to load landlord emails");
        setItems([]);
        return;
      }
      setItems(data?.items ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [jobId, reloadKey]);

  return (
    <Card className="p-4 space-y-4">
      <div className="font-semibold">Landlord communications</div>
      {items === null ? (
        <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No emails sent to the landlord about this job yet.</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="border-l-2 border-border pl-3 py-0.5 space-y-1">
              <div className="text-sm font-medium">{item.subject || "(no subject)"}</div>
              <div className="text-xs text-muted-foreground">
                {formatLondonDateTime(item.createdAt)} · {item.actorName ? `Sent by ${item.actorName}` : "Sent by Woodland"}
                {item.toEmails && ` · To ${Array.isArray(item.toEmails) ? item.toEmails.join(", ") : item.toEmails}`}
              </div>
              {item.body && <div className="whitespace-pre-wrap text-sm">{item.body}</div>}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default JobLandlordEmails;
