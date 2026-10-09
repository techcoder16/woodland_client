import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Download, Eye, Loader2, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { exportIncomingPaymentToPdf } from "@/utils/incomingPaymentExport";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { del, get } from "@/helper/api";
import { formatPropertyReference } from "@/utils/propertyReference";
import { formatPeriod, IncomingPayment, money, PAYER_TABS } from "./incomingPaymentShared";

type ListResponse = { items: IncomingPayment[]; total: number; page: number; totalPages: number };

const PAGE_SIZE = 10;

export default function IncomingPayments() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const [payerKind, setPayerKind] = useState("");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResponse>({ items: [], total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [viewing, setViewing] = useState<IncomingPayment | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (payerKind) params.set("payerKind", payerKind);
    if (search.trim()) params.set("search", search.trim());
    if (from) params.set("from", from);
    if (to) params.set("to", `${to}T23:59:59`);
    const { data: result, error } = await get<ListResponse>(`incoming-payments?${params}`);
    setLoading(false);
    if (error) {
      toast({ title: "Could not load payments", description: error.message, variant: "destructive" });
      return;
    }
    if (result) setData(result);
  }, [page, payerKind, search, from, to, toast]);

  // Debounced so typing in the search box doesn't fire a request per key.
  useEffect(() => {
    const timer = setTimeout(() => void load(), 250);
    return () => clearTimeout(timer);
  }, [load]);

  // Any filter change goes back to the first page.
  useEffect(() => setPage(1), [payerKind, search, from, to]);

  const remove = async (payment: IncomingPayment) => {
    const { error } = await del(`incoming-payments/${payment.id}`);
    if (error) {
      toast({ title: "Could not delete payment", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `Payment ${payment.reference} deleted`, description: "Its allocations no longer count towards the occupancies." });
    setViewing(null);
    void load();
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1400px] space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Finance / Incoming Payments</p>
            <h1 className="text-2xl font-semibold tracking-tight">Incoming Payments</h1>
            <p className="text-sm text-muted-foreground">Record and manage rent received from tenants, companies and councils.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
            <Button onClick={() => navigate("/finance/incoming-payments/new")}><Plus className="mr-2 h-4 w-4" />New Payment</Button>
          </div>
        </div>

        <div className="surface overflow-hidden">
          <div className="flex flex-wrap gap-1 border-b px-4 pt-3">
            {PAYER_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setPayerKind(tab.value)}
                className={`-mb-px border-b-2 px-3 pb-2.5 text-sm transition ${payerKind === tab.value ? "border-primary font-medium text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-end gap-3 border-b p-4">
            <div className="relative min-w-[16rem] flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Search by payer, property, reference…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div><Label className="text-xs">From date</Label><Input className="w-40" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
            <div><Label className="text-xs">To date</Label><Input className="w-40" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
            <Button variant="ghost" onClick={() => { setSearch(""); setFrom(""); setTo(""); }}>Clear</Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">#</th>
                  <th className="px-4 py-2.5 font-medium">Reference</th>
                  <th className="px-4 py-2.5 font-medium">Date</th>
                  <th className="px-4 py-2.5 font-medium">Payer</th>
                  <th className="px-4 py-2.5 font-medium">Property</th>
                  <th className="px-4 py-2.5 font-medium">Occupancy Ref</th>
                  <th className="px-4 py-2.5 font-medium">Period</th>
                  <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                  <th className="px-4 py-2.5 font-medium">Method</th>
                  <th className="px-4 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((payment, index) => {
                  const single = payment.allocations.length === 1 ? payment.allocations[0] : null;
                  const periods = [...new Set(payment.allocations.map((a) => a.period))];
                  return (
                    <tr key={payment.id} className="border-t hover:bg-muted/30">
                      <td className="px-4 py-2.5 text-muted-foreground">{(data.page - 1) * PAGE_SIZE + index + 1}</td>
                      <td className="px-4 py-2.5 font-mono text-xs">{payment.reference}</td>
                      <td className="px-4 py-2.5">{new Date(payment.paymentDate).toLocaleDateString("en-GB")}</td>
                      <td className="px-4 py-2.5">
                        <span className="font-medium">{payment.payerName}</span>
                        {payment.payerKind !== "INDIVIDUAL" && <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">Bulk</span>}
                      </td>
                      <td className="px-4 py-2.5">{single ? single.property?.addressLine1 || "-" : `Multiple (${payment.allocations.length})`}</td>
                      <td className="px-4 py-2.5 font-mono text-xs">{single ? single.occupancy?.reference : "-"}</td>
                      <td className="px-4 py-2.5">{periods.length === 1 ? formatPeriod(periods[0]) : `${periods.length} periods`}</td>
                      <td className="px-4 py-2.5 text-right font-medium">{money(payment.amount)}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{payment.paymentMethod}</td>
                      <td className="px-4 py-2.5 text-right">
                        <Button size="sm" variant="ghost" className="h-7" onClick={() => setViewing(payment)}><Eye className="mr-1 h-3.5 w-3.5" />View</Button>
                      </td>
                    </tr>
                  );
                })}
                {!data.items.length && (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">
                      {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "No payments found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4 text-sm text-muted-foreground">
            <span>
              {data.total ? `Showing ${(data.page - 1) * PAGE_SIZE + 1} to ${Math.min(data.page * PAGE_SIZE, data.total)} of ${data.total} payments` : "No payments"}
            </span>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              <span>Page {data.page} of {data.totalPages}</span>
              <Button size="icon" variant="outline" className="h-8 w-8" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!viewing} onOpenChange={(open) => { if (!open) setViewing(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Payment {viewing?.reference}</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-3">
                <div><p className="text-xs text-muted-foreground">Payer</p><p className="font-medium">{viewing.payerName}</p></div>
                <div><p className="text-xs text-muted-foreground">Payment date</p><p className="font-medium">{new Date(viewing.paymentDate).toLocaleDateString("en-GB")}</p></div>
                <div><p className="text-xs text-muted-foreground">Amount received</p><p className="font-semibold text-emerald-700">{money(viewing.amount)}</p></div>
                <div><p className="text-xs text-muted-foreground">Method</p><p className="font-medium">{viewing.paymentMethod}</p></div>
                <div><p className="text-xs text-muted-foreground">Payment reference</p><p className="font-mono font-medium">{viewing.paymentReference || "-"}</p></div>
                <div><p className="text-xs text-muted-foreground">Recorded by</p><p className="font-medium">{viewing.createdByName || "-"}</p></div>
              </div>
              {viewing.notes && <p className="rounded-md bg-muted/40 p-3 text-muted-foreground">{viewing.notes}</p>}
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                    <tr><th className="px-3 py-2 font-medium">Property</th><th className="px-3 py-2 font-medium">Occupancy</th><th className="px-3 py-2 font-medium">Period</th><th className="px-3 py-2 text-right font-medium">Amount</th></tr>
                  </thead>
                  <tbody>
                    {viewing.allocations.map((a) => (
                      <tr key={a.id} className="border-t">
                        <td className="px-3 py-2">{formatPropertyReference(a.property?.propertyNumber)} · {a.property?.addressLine1}</td>
                        <td className="px-3 py-2 font-mono text-xs">
                          <button type="button" className="text-primary hover:underline" onClick={() => navigate(`/occupancy/${a.occupancyId}`)}>{a.occupancy?.reference}</button>
                        </td>
                        <td className="px-3 py-2">{formatPeriod(a.period)}</td>
                        <td className="px-3 py-2 text-right font-medium">{money(a.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-2 border-t pt-3">
                {isAdmin && <Button variant="outline" className="text-destructive" onClick={() => void remove(viewing)}><Trash2 className="mr-2 h-4 w-4" />Delete payment</Button>}
                <Button onClick={() => exportIncomingPaymentToPdf(viewing)}><Download className="mr-2 h-4 w-4" />Download PDF</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
