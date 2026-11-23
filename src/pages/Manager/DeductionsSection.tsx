import { Fragment, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Download, Plus, Trash2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InfoHint } from "@/components/ui/hint";
import { useToast } from "@/components/ui/use-toast";
import { del, get, post } from "@/helper/api";

type DeductionRecord = {
  id: string;
  date: string;
  amount: number;
  note?: string | null;
  transactionId?: string | null;
  transactionReference?: string | null;
  createdByName?: string | null;
  createdAt?: string;
};

type Deduction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  recovered: number;
  outstanding: number;
  createdByName?: string | null;
  createdAt?: string;
  records: DeductionRecord[];
};

const money = (value: unknown) => `£${Number(value || 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const today = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

const dateLabel = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};

// Dates are handled in UTC so no timezone can shift a day.
const daysIn = (year: number, monthIndex: number) => new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
const fmt = (date: Date) => date.toLocaleDateString("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });

// Rent period a deduction falls into. A period runs from the day after one due
// day to the next due day: due day 15 gives 16th to 15th. A deduction dated after
// the due day falls into the following month's period.
function rentPeriodOf(iso: string, dueDay: number) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const end0 = new Date(Date.UTC(y, d > dueDay ? m : m - 1, 1));
  const ey = end0.getUTCFullYear();
  const em = end0.getUTCMonth();
  const end = new Date(Date.UTC(ey, em, Math.min(dueDay, daysIn(ey, em))));
  const prev = new Date(Date.UTC(ey, em - 1, 1));
  const py = prev.getUTCFullYear();
  const pm = prev.getUTCMonth();
  const start = new Date(Date.UTC(py, pm, Math.min(dueDay, daysIn(py, pm)) + 1));
  return `${fmt(start)} – ${fmt(end)}`;
}

export default function DeductionsSection({ propertyId }: { propertyId: string }) {
  const { toast } = useToast();
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [dueDay, setDueDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState({ date: today(), description: "", amount: "" });

  const [recording, setRecording] = useState<{ deduction: Deduction; date: string; amount: string; note: string } | null>(null);

  useEffect(() => {
    if (!propertyId) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      get<Deduction[]>(`transaction/deductions?propertyId=${propertyId}`),
      get<{ dueDay: number | null }>(`transaction/rent-schedule?propertyId=${propertyId}`),
    ]).then(([list, schedule]) => {
      if (cancelled) return;
      setDeductions(Array.isArray(list.data) ? list.data : []);
      setDueDay(schedule.data?.dueDay ?? null);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [propertyId, version]);

  const reload = () => setVersion((v) => v + 1);

  const run = async (request: () => Promise<{ error: { message: string } | null }>, success: string) => {
    setBusy(true);
    const { error } = await request();
    setBusy(false);
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: success });
    reload();
    return true;
  };

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addDeduction = async () => {
    const amount = Number(draft.amount);
    if (!draft.description.trim()) {
      toast({ title: "Add a description", variant: "destructive" });
      return;
    }
    if (!(amount > 0)) {
      toast({ title: "Enter an amount above £0", variant: "destructive" });
      return;
    }
    const ok = await run(() => post("transaction/deductions", { propertyId, date: draft.date, description: draft.description.trim(), amount }), "Deduction added");
    if (ok) {
      setAddOpen(false);
      setDraft({ date: today(), description: "", amount: "" });
    }
  };

  const recordError = !recording ? ""
    : !(Number(recording.amount) > 0) ? "Enter an amount above £0"
    : Number(recording.amount) > recording.deduction.outstanding + 0.005 ? `Only ${money(recording.deduction.outstanding)} is outstanding`
    : "";

  const recordRecovery = async () => {
    if (!recording || recordError) return;
    const ok = await run(
      () => post(`transaction/deductions/${recording.deduction.id}/records`, { date: recording.date, amount: Number(recording.amount), note: recording.note.trim() || undefined }),
      "Recovery recorded",
    );
    if (ok) setRecording(null);
  };

  const deleteRecord = (recordId: string) => run(() => del(`transaction/deductions/records/${recordId}`), "Recovery removed");
  const deleteDeduction = (id: string) => run(() => del(`transaction/deductions/${id}`), "Deduction deleted");

  // Paid once nothing is outstanding; part paid once anything is recovered.
  const paidStatus = (d: Deduction) => (d.outstanding <= 0.005 ? "Paid" : d.recovered > 0 ? "Part paid" : "Not paid");

  const downloadPdf = () => {
    const doc = new jsPDF();
    doc.addImage(logo, "PNG", 14, 10, 40, 16);
    doc.setFontSize(14);
    doc.text("Deductions", 60, 18);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Generated ${new Date().toLocaleString("en-GB")}`, 60, 24);
    doc.setTextColor(0);
    autoTable(doc, {
      startY: 32,
      head: [["Date", "Period", "Description", "Amount", "Recovered", "Outstanding", "Status"]],
      body: deductions.map((d) => [
        dateLabel(d.date),
        dueDay ? rentPeriodOf(d.date, dueDay) : "-",
        d.description,
        money(d.amount),
        money(d.recovered),
        money(d.outstanding),
        paidStatus(d),
      ]),
      foot: [["Total", "", "", money(totals.amount), money(totals.recovered), money(totals.outstanding), ""]],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [17, 24, 39] },
      footStyles: { fillColor: [241, 245, 249], textColor: 20, fontStyle: "bold" },
      columnStyles: { 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" } },
    });
    doc.save(`deductions-${propertyId}.pdf`);
  };

  const totals = deductions.reduce(
    (acc, d) => ({ amount: acc.amount + Number(d.amount || 0), recovered: acc.recovered + Number(d.recovered || 0), outstanding: acc.outstanding + Number(d.outstanding || 0) }),
    { amount: 0, recovered: 0, outstanding: 0 },
  );

  return (
    <div className="space-y-5">
      <div className="surface flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-start gap-3">
        <Button size="icon" title="Add deduction" aria-label="Add deduction" disabled={addOpen} onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /></Button>
        <div>
          <h2 className="flex items-center gap-1.5 font-semibold">Deductions <InfoHint text="A cost charged against the landlord (for example a repair or a fee). It is recovered from later landlord payments, in full or in part, until nothing is outstanding." /></h2>
          <p className="text-sm text-muted-foreground">
            {dueDay ? `Each deduction falls in the rent period that ends on the due day (${dueDay}).` : "Rent periods show once the Management Agreement sets a due day."}
          </p>
        </div>
        </div>
        <div className="flex gap-2">
        <Button variant="outline" disabled={!deductions.length} onClick={downloadPdf}><Download className="mr-1.5 h-4 w-4" />PDF</Button>
        </div>
      </div>

      {loading && !deductions.length ? (
        <p className="p-6 text-sm text-muted-foreground">Loading deductions…</p>
      ) : !deductions.length && !addOpen ? (
        <div className="surface p-8 text-center text-sm text-muted-foreground">No deductions recorded for this property.</div>
      ) : (
        <div className="surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="w-8 px-3 py-3" />
                  <th className="px-4 py-3 font-medium">Date / Period</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 text-right font-medium">Recovered</th>
                  <th className="px-4 py-3 text-right font-medium">Outstanding</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {addOpen && (
                  <tr className="border-t bg-primary/5 align-top">
                    <td />
                    <td className="px-4 py-2">
                      <Input type="date" aria-label="Date" value={draft.date} onChange={(e) => setDraft((f) => ({ ...f, date: e.target.value }))} />
                      {dueDay && draft.date && <div className="mt-1 text-xs text-muted-foreground">Period {rentPeriodOf(draft.date, dueDay)}</div>}
                    </td>
                    <td className="px-4 py-2">
                      <Input autoFocus aria-label="Description" value={draft.description} onChange={(e) => setDraft((f) => ({ ...f, description: e.target.value }))} placeholder="e.g. Boiler repair, unpaid fee"
                        onKeyDown={(e) => { if (e.key === "Enter") void addDeduction(); if (e.key === "Escape") setAddOpen(false); }} />
                    </td>
                    <td className="px-4 py-2">
                      <Input type="number" min="0" step="0.01" aria-label="Amount" placeholder="£0.00" className="text-right" value={draft.amount} onChange={(e) => setDraft((f) => ({ ...f, amount: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter") void addDeduction(); if (e.key === "Escape") setAddOpen(false); }} />
                    </td>
                    <td className="px-4 py-2 text-right" colSpan={3}>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => { setAddOpen(false); setDraft({ date: today(), description: "", amount: "" }); }}>Cancel</Button>
                        <Button size="sm" disabled={busy} onClick={() => void addDeduction()}>Save</Button>
                      </div>
                    </td>
                  </tr>
                )}
                {deductions.map((d) => {
                  const isOpen = expanded.has(d.id);
                  return (
                    <Fragment key={d.id}>
                      <tr className="cursor-pointer border-t hover:bg-muted/30" onClick={() => toggle(d.id)}>
                        <td className="px-3 py-3 text-muted-foreground">{isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {dateLabel(d.date)}
                          {dueDay && <div className="text-xs text-muted-foreground">Period {rentPeriodOf(d.date, dueDay)}</div>}
                        </td>
                        <td className="px-4 py-3">{d.description}</td>
                        <td className="px-4 py-3 text-right">{money(d.amount)}</td>
                        <td className="px-4 py-3 text-right text-emerald-700">{d.recovered ? `−${money(d.recovered)}` : money(0)}</td>
                        <td className="px-4 py-3 text-right font-semibold">{money(d.outstanding)}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${paidStatus(d) === "Paid" ? "bg-emerald-100 text-emerald-700" : paidStatus(d) === "Part paid" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-700"}`}>{paidStatus(d)}</span>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="border-t bg-muted/20">
                          <td colSpan={7} className="px-6 py-4">
                            {!d.records.length ? (
                              <p className="text-sm text-muted-foreground">Nothing recovered yet.</p>
                            ) : (
                              <table className="w-full text-sm">
                                <thead className="text-left text-xs text-muted-foreground">
                                  <tr>
                                    <th className="py-2 font-medium">Date</th>
                                    <th className="py-2 text-right font-medium">Recovered</th>
                                    <th className="py-2 font-medium">Note</th>
                                    <th className="py-2 font-medium">Payment</th>
                                    <th className="py-2 font-medium">Recorded by</th>
                                    <th className="py-2" />
                                  </tr>
                                </thead>
                                <tbody>
                                  {d.records.map((r) => (
                                    <tr key={r.id} className="border-t">
                                      <td className="py-2 whitespace-nowrap">{dateLabel(r.date)}</td>
                                      <td className="py-2 text-right text-emerald-700">−{money(r.amount)}</td>
                                      <td className="py-2">{r.note || "-"}</td>
                                      <td className="py-2">{r.transactionId ? <span className="font-mono text-xs">{r.transactionReference || "Landlord payment"}</span> : <span className="text-muted-foreground">Manual</span>}</td>
                                      <td className="py-2">{r.createdByName || "-"}</td>
                                      <td className="py-2 text-right">
                                        {!r.transactionId && (
                                          <Button size="icon" variant="ghost" className="h-7 w-7" title="Remove this recovery" disabled={busy} onClick={() => void deleteRecord(r.id)}>
                                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                          </Button>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                            {recording?.deduction.id === d.id && (
                              <div className="mt-3 flex flex-wrap items-end gap-2 border-t pt-3">
                                <div className="space-y-1"><Label className="text-xs">Date</Label><Input type="date" className="w-40" value={recording.date} onChange={(e) => setRecording((r) => (r ? { ...r, date: e.target.value } : r))} /></div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Amount recovered (£) · {money(d.outstanding)} outstanding</Label>
                                  <Input type="number" min="0" step="0.01" className="w-40" max={d.outstanding} value={recording.amount} onChange={(e) => setRecording((r) => (r ? { ...r, amount: e.target.value } : r))} />
                                </div>
                                <div className="space-y-1 flex-1 min-w-[10rem]"><Label className="text-xs">Note</Label><Input value={recording.note} onChange={(e) => setRecording((r) => (r ? { ...r, note: e.target.value } : r))} placeholder="Optional" /></div>
                                <Button size="sm" variant="outline" disabled={busy} onClick={() => setRecording(null)}>Cancel</Button>
                                <Button size="sm" disabled={busy || !!recordError} onClick={() => void recordRecovery()}>Save</Button>
                                {recordError && <p className="w-full text-sm text-destructive">{recordError}</p>}
                              </div>
                            )}
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                              {recording?.deduction.id !== d.id ? (
                                <Button size="sm" variant="outline" disabled={d.outstanding <= 0} onClick={(e) => { e.stopPropagation(); setRecording({ deduction: d, date: today(), amount: String(d.outstanding), note: "" }); }}>
                                  <Plus className="mr-1.5 h-3.5 w-3.5" />Record recovery
                                </Button>
                              ) : <span />}
                              {!d.records.length && (
                                <Button size="sm" variant="ghost" className="text-destructive" disabled={busy} onClick={() => void deleteDeduction(d.id)}>Delete deduction</Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
              <tfoot className="border-t bg-muted/40 text-sm font-semibold">
                <tr>
                  <td />
                  <td className="px-4 py-3" colSpan={2}>Total</td>
                  <td className="px-4 py-3 text-right">{money(totals.amount)}</td>
                  <td className="px-4 py-3 text-right text-emerald-700">{totals.recovered ? `−${money(totals.recovered)}` : money(0)}</td>
                  <td className="px-4 py-3 text-right">{money(totals.outstanding)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
