// Emails sent to the landlord about one maintenance job, newest first.
// Every subject starts with the job ID ("Job 1A2B3C4D: ...").
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mail } from "lucide-react";
import { emailLandlord } from "@/pages/Maintenance/jobActions";
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

const JobLandlordEmails = ({ jobId, reloadKey, canManage = false, onSent }: { jobId: string; reloadKey?: unknown; canManage?: boolean; onSent?: () => void }) => {
  const [items, setItems] = useState<LandlordCommunication[] | null>(null);
  const [composing, setComposing] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [localKey, setLocalKey] = useState(0);

  const send = async () => {
    setSending(true);
    try {
      const result = await emailLandlord(jobId, undefined, message.trim() || undefined);
      toast.success(result?.message || "Email sent to the landlord");
      setMessage("");
      setComposing(false);
      setLocalKey((k) => k + 1);
      onSent?.();
    } catch (error) {
      toast.error(error?.message || "Failed to email the landlord");
    } finally {
      setSending(false);
    }
  };

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
  }, [jobId, reloadKey, localKey]);

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="font-semibold">Landlord communications</div>
        {canManage && (
          <Button size="sm" onClick={() => setComposing((c) => !c)}>
            <Mail className="h-4 w-4 mr-1.5" />{composing ? "Close" : "Email landlord"}
          </Button>
        )}
      </div>
      {composing && (
        <div className="space-y-2 rounded-md border bg-muted/30 p-3">
          <p className="text-sm text-muted-foreground">Sends the landlord an update on this job. Add a message if you want it recorded with the email.</p>
          <Textarea rows={3} placeholder="Optional message" value={message} onChange={(e) => setMessage(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" disabled={sending} onClick={() => setComposing(false)}>Cancel</Button>
            <Button size="sm" disabled={sending} onClick={() => void send()}>{sending ? "Sending…" : "Send email"}</Button>
          </div>
        </div>
      )}
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
