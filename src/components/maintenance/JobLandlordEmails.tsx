// Emails sent to the landlord about one maintenance job, newest first.
// Every subject starts with the job ID ("Job 1A2B3C4D: ...").
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Reply } from "lucide-react";
import { emailLandlord, logLandlordReply } from "@/pages/Maintenance/jobActions";
import { get } from "@/helper/api";
import { formatLondonDateTime } from "@/utils/maintenanceSla";

interface LandlordCommunication {
  id: string;
  createdAt: string;
  direction?: "IN" | "OUT" | string;
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
  const [loggingReply, setLoggingReply] = useState(false);
  const [reply, setReply] = useState("");
  const [savingReply, setSavingReply] = useState(false);

  const saveReply = async () => {
    setSavingReply(true);
    try {
      await logLandlordReply(jobId, reply.trim());
      toast.success("Landlord reply logged");
      setReply("");
      setLoggingReply(false);
      setLocalKey((k) => k + 1);
      onSent?.();
    } catch (error) {
      toast.error(error?.message || "Failed to log the reply");
    } finally {
      setSavingReply(false);
    }
  };

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
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setLoggingReply((c) => !c)}>
              <Reply className="h-4 w-4 mr-1.5" />{loggingReply ? "Close" : "Log landlord reply"}
            </Button>
            <Button size="sm" onClick={() => setComposing((c) => !c)}>
              <Mail className="h-4 w-4 mr-1.5" />{composing ? "Close" : "Email landlord"}
            </Button>
          </div>
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
      {loggingReply && (
        <div className="space-y-2 rounded-md border border-red-200 bg-red-50/40 p-3">
          <p className="text-sm text-muted-foreground">Paste or type what the landlord replied. The job is marked red on the Jobs list until someone opens this tab.</p>
          <Textarea rows={4} placeholder="Landlord's reply" value={reply} onChange={(e) => setReply(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" disabled={savingReply} onClick={() => setLoggingReply(false)}>Cancel</Button>
            <Button size="sm" disabled={savingReply || !reply.trim()} onClick={() => void saveReply()}>{savingReply ? "Saving…" : "Save reply"}</Button>
          </div>
        </div>
      )}
      {items === null ? (
        <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No emails to or from the landlord about this job yet.</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className={`border-l-2 pl-3 py-0.5 space-y-1 ${item.direction === "IN" ? "border-red-400" : "border-border"}`}>
              <div className="text-sm font-medium">
                {item.direction === "IN" && <span className="mr-2 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">Landlord reply</span>}
                {item.subject || "(no subject)"}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatLondonDateTime(item.createdAt)} · {item.direction === "IN" ? `Logged by ${item.actorName || "staff"}` : item.actorName ? `Sent by ${item.actorName}` : "Sent by Woodland"}
                {item.direction !== "IN" && item.toEmails && ` · To ${Array.isArray(item.toEmails) ? item.toEmails.join(", ") : item.toEmails}`}
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
