// Money spent on a maintenance job — materials, labour, parts, call-out or a
// contractor's bill — added line by line, with or without a contractor. The
// lines add up to the job's "other cost"; with the contractor cost and markup
// that gives what the landlord is charged.
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Eye, Mail, Paperclip, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InfoHint } from "@/components/ui/hint";
import { del, get, post } from "@/helper/api";
import { fetchFileUrls, openStoredFile, uploadFile } from "@/helper/fileUpload";
import { emailLandlord } from "@/pages/Maintenance/jobActions";
import type { JobType } from "@/redux/dataStore/jobTypeSlice";

interface JobPayment {
  id: string;
  date: string;
  description: string;
  amount: number;
  markupPercent?: number | null;
  markupAmount?: number | null;
  fileId?: string | null;
  createdByName?: string | null;
}

const money = (n?: number | null) => `£${Number(n ?? 0).toFixed(2)}`;
const toLandlord = (p: Pick<JobPayment, "amount" | "markupPercent" | "markupAmount">) =>
  p.markupAmount != null ? p.amount + p.markupAmount : p.amount * (1 + (p.markupPercent ?? 0) / 100);
const markupText = (p: Pick<JobPayment, "markupPercent" | "markupAmount">) =>
  p.markupAmount != null ? `+ ${money(p.markupAmount)}` : p.markupPercent ? `${p.markupPercent}%` : "-";
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Europe/London" });
const dateLabel = (iso: string) => {
  const d = new Date(`${iso}T12:00:00`);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

interface Props {
  job: JobType;
  canManage: boolean;
  onChanged: () => void;
}

export default function JobPaymentsPanel({ job, canManage, onChanged }: Props) {
  const [payments, setPayments] = useState<JobPayment[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ date: today(), description: "", amount: "", markup: "", markupType: "percent" as "percent" | "amount" });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data, error } = await get<{ payments: JobPayment[] }>(`property-management/job-type/${job.id}/payments`);
    if (error) {
      toast.error(error.message || "Failed to load payments");
      setPayments([]);
      return;
    }
    setPayments(data?.payments ?? []);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.id]);

  const reset = () => {
    setDraft({ date: today(), description: "", amount: "", markup: "", markupType: "percent" });
    setFile(null);
    setAdding(false);
  };

  const save = async () => {
    const amount = Number(draft.amount);
    if (!draft.description.trim()) return toast.error("Add a description, e.g. Boiler repair");
    if (!(amount > 0)) return toast.error("Enter an amount above £0");
    setBusy(true);
    try {
      let fileId: string | undefined;
      if (file) {
        const stored = await uploadFile(file, { category: "job-invoice", entityType: "jobType", entityId: job.id, propertyId: job.propertyId });
        fileId = stored.id;
      }
      const { error } = await post(`property-management/job-type/${job.id}/payments`, {
        date: draft.date,
        description: draft.description.trim(),
        amount,
        ...(draft.markup === "" ? {} : draft.markupType === "percent" ? { markupPercent: Number(draft.markup) } : { markupAmount: Number(draft.markup) }),
        fileId,
      });
      if (error) throw new Error(error.message);
      toast.success("Invoice added");
      reset();
      await load();
      onChanged();
    } catch (error) {
      toast.error(error?.message || "Failed to add the payment");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p: JobPayment) => {
    setBusy(true);
    const { error } = await del(`property-management/job-type/${job.id}/payments/${p.id}`);
    setBusy(false);
    if (error) return toast.error(error.message || "Failed to remove the payment");
    toast.success("Invoice removed");
    await load();
    onChanged();
  };

  const blobToBase64 = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });

  // Emails the PDF attached to one row to the landlord. Do it again for each invoice.
  const emailRow = async (p: JobPayment) => {
    if (!p.fileId) return;
    setBusy(true);
    try {
      const urls = await fetchFileUrls([p.fileId]);
      const signed = urls[p.fileId];
      if (!signed) throw new Error("The PDF could not be loaded");
      const res = await fetch(signed.url);
      if (!res.ok) throw new Error("The PDF could not be loaded");
      const result = await emailLandlord(job.id as string, await blobToBase64(await res.blob()), `Invoice: ${p.description}`);
      toast.success(result?.message || "Invoice emailed to the landlord");
      onChanged();
    } catch (error) {
      toast.error(error?.message || "Failed to email the invoice");
    } finally {
      setBusy(false);
    }
  };

  const linesTotal = (payments ?? []).reduce((s, p) => s + Number(p.amount || 0), 0);
  const closed = job.status === "CANCELLED";

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="font-semibold">
          Invoices and costs
          <InfoHint text="One row per invoice: a description (e.g. Boiler repair), the amount, an optional markup (% or flat £) and the invoice PDF. The rows plus the job markup below are what the landlord is charged." />
        </div>
        {canManage && !closed && (
          <Button size="icon" title="Add invoice" aria-label="Add invoice" disabled={adding} onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr className="border-b">
              <th className="py-2 pr-3 font-medium">Date</th>
              <th className="py-2 pr-3 font-medium">Description</th>
              <th className="py-2 pr-3 text-right font-medium">Amount</th>
              <th className="py-2 pr-3 text-right font-medium">Markup</th>
              <th className="py-2 pr-3 text-right font-medium">To landlord</th>
              <th className="py-2 pr-3 font-medium">PDF</th>
              <th className="py-2 pr-3 font-medium">Added by</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {adding && (
              <tr className="border-b bg-primary/5 align-top">
                <td className="py-2 pr-2"><Input type="date" aria-label="Date" className="w-40" value={draft.date} onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))} /></td>
                <td className="py-2 pr-2">
                  <Input
                    autoFocus
                    aria-label="Description"
                    placeholder="e.g. Replacement tap, Labour 2 hours"
                    value={draft.description}
                    onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") void save(); if (e.key === "Escape") reset(); }}
                  />
                </td>
                <td className="py-2 pr-2">
                  <Input
                    type="number" min="0" step="0.01" aria-label="Amount" placeholder="£0.00" className="w-28 text-right"
                    value={draft.amount}
                    onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") void save(); if (e.key === "Escape") reset(); }}
                  />
                </td>
                <td className="py-2 pr-2">
                  <div className="flex items-center justify-end gap-1">
                    <div className="inline-flex rounded-md border p-0.5">
                      <button type="button" className={`rounded px-1.5 text-xs ${draft.markupType === "percent" ? "bg-primary text-primary-foreground" : ""}`} onClick={() => setDraft((d) => ({ ...d, markupType: "percent" }))}>%</button>
                      <button type="button" className={`rounded px-1.5 text-xs ${draft.markupType === "amount" ? "bg-primary text-primary-foreground" : ""}`} onClick={() => setDraft((d) => ({ ...d, markupType: "amount" }))}>£</button>
                    </div>
                    <Input type="number" min="0" step="0.01" aria-label="Markup" placeholder="0" className="w-20 text-right" value={draft.markup} onChange={(e) => setDraft((d) => ({ ...d, markup: e.target.value }))} />
                  </div>
                </td>
                <td className="py-2 pr-2 text-right text-muted-foreground">
                  {money(toLandlord({ amount: Number(draft.amount || 0), ...(draft.markupType === "percent" ? { markupPercent: Number(draft.markup || 0) } : { markupAmount: Number(draft.markup || 0) }) }))}
                </td>
                <td className="py-2 pr-2">
                  <input ref={fileRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                  <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()} title={file?.name}>
                    <Paperclip className="h-3.5 w-3.5 mr-1" />{file ? "Attached" : "Attach"}
                  </Button>
                </td>
                <td colSpan={2} className="py-2 text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" disabled={busy} onClick={reset}>Cancel</Button>
                    <Button size="sm" disabled={busy} onClick={() => void save()}>{busy ? "Saving…" : "Save"}</Button>
                  </div>
                </td>
              </tr>
            )}
            {payments === null ? (
              <tr><td colSpan={8} className="py-6 text-center text-muted-foreground">Loading...</td></tr>
            ) : payments.length === 0 && !adding ? (
              <tr><td colSpan={8} className="py-6 text-center text-muted-foreground">No invoices yet. Press + to add one.</td></tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="py-2 pr-3 whitespace-nowrap">{dateLabel(p.date)}</td>
                  <td className="py-2 pr-3">{p.description}</td>
                  <td className="py-2 pr-3 text-right font-medium">{money(p.amount)}</td>
                  <td className="py-2 pr-3 text-right">{markupText(p)}</td>
                  <td className="py-2 pr-3 text-right font-medium">{money(toLandlord(p))}</td>
                  <td className="py-2 pr-3">
                    {p.fileId ? (
                      <span className="inline-flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" title="View the uploaded PDF" onClick={() => openStoredFile(p.fileId as string).catch(() => toast.error("This file is no longer available"))}><Eye className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" title="Download the uploaded PDF" onClick={() => openStoredFile(p.fileId as string, { download: true }).catch(() => toast.error("This file is no longer available"))}><Download className="h-3.5 w-3.5" /></Button>
                        {canManage && <Button size="icon" variant="ghost" className="h-7 w-7" title="Email this invoice to the landlord" disabled={busy} onClick={() => void emailRow(p)}><Mail className="h-3.5 w-3.5" /></Button>}
                      </span>
                    ) : <span className="text-muted-foreground">-</span>}
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground">{p.createdByName || "-"}</td>
                  <td className="py-2 text-right">
                    {canManage && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="Remove this payment" disabled={busy} onClick={() => void remove(p)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t pt-3 text-sm space-y-1">
        <div className="flex justify-between"><span className="text-muted-foreground">Costs total</span><span className="font-medium">{money(linesTotal)}</span></div>
        {job.totalCost != null && (
          <div className="flex justify-between"><span className="text-muted-foreground">Contractor cost</span><span className="font-medium">{money(job.totalCost)}</span></div>
        )}
        {job.marginPercent != null && (
          <div className="flex justify-between"><span className="text-muted-foreground">Markup</span><span className="font-medium">{job.marginPercent}%</span></div>
        )}
        {job.marginAmount != null && (
          <div className="flex justify-between"><span className="text-muted-foreground">Markup (flat)</span><span className="font-medium">+ {money(job.marginAmount)}</span></div>
        )}
        <div className="flex justify-between font-semibold">
          <span>{job.deductible !== false ? "Charged to landlord" : "Total (not charged to landlord)"}</span>
          <span>{job.totalCharged != null ? money(job.totalCharged) : money(linesTotal + Number(job.totalCost ?? 0))}</span>
        </div>
      </div>
    </Card>
  );
}
