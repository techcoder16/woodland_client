import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Check, ChevronRight, Clock3, Download, FileSpreadsheet, FileText, Filter, Loader2, Pencil, Plus, RefreshCw, Send, Trash2, WalletCards, X } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fetchProperties } from "@/redux/dataStore/propertySlice";
import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks";
import { DEFAULT_COOKIE_GETTER } from "@/helper/Cookie";
import getApi from "@/helper/getApi";
import { post, patch } from "@/helper/api";
import { formatPropertyReference } from "@/utils/propertyReference";
import { exportTransactionsToExcel, exportTransactionsToPdf } from "@/utils/transactionExport";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/components/ui/use-toast";

const API_URL = import.meta.env.VITE_API_URL;
type Payment = any;

const money = (value: unknown) => `£${Number(value || 0).toLocaleString("en-GB", { minimumFractionDigits: 2 })}`;
const paymentAmount = (payment: Payment) => Number(payment.toLandlordNetPaid ?? payment.toLandlordNetReceived ?? payment.toLandlordRentReceived ?? 0);
const STATUS_LABEL: Record<string, string> = { ACTIVE: "Ready", DRAFT: "Draft", PENDING: "Hold", APPROVAL_REQUIRED: "Approval", PAID: "Paid" };
const STATUS_BADGE: Record<string, string> = {
  PAID: "bg-violet-100 text-violet-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-orange-100 text-orange-700",
  APPROVAL_REQUIRED: "bg-red-100 text-red-700",
  DRAFT: "bg-slate-100 text-slate-700",
};

export default function LandlordPayments() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const queueRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { brandColors } = useTheme();
  const hsl = (value: string) => `hsl(${value})`;
  const { properties } = useAppSelector((state) => state.properties);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selected, setSelected] = useState<Payment | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [landlordFilter, setLandlordFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [detailsTab, setDetailsTab] = useState("Overview");
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<Date | undefined>(undefined);
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const token = await DEFAULT_COOKIE_GETTER("access_token");
      const data: any = await getApi("transaction", "?skip=0&take=1000", { Authorization: `Bearer ${token}` });
      setPayments(Array.isArray(data) ? data : data?.transactions || data?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    dispatch(fetchProperties({ page: 1, search: "" }));
    void load();
  }, [dispatch]);

  const propertyMap = useMemo(() => new Map(properties.map((property: any) => [property.id, property])), [properties]);
  const landlords = useMemo(() => {
    const values = new Map<string, string>();
    properties.forEach((property: any) => {
      const vendor = property.vendor;
      if (vendor?.id) values.set(vendor.id, `${vendor.firstName || ""} ${vendor.lastName || ""}`.trim() || vendor.email || "Landlord");
    });
    return [...values.entries()];
  }, [properties]);
  const visible = payments.filter((payment) => {
    const property = propertyMap.get(payment.propertyId) as any;
    const text = `${property?.addressLine1 || ""} ${property?.town || ""} ${payment.toLandlordPaidBy || ""} ${payment.toLandlordExpenditureDescription || ""} ${payment.reference || ""}`.toLowerCase();
    const paymentDate = payment.toLandlordDate ? new Date(payment.toLandlordDate).toISOString().slice(0, 10) : "";
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    const matchesLandlord = landlordFilter === "all" || property?.vendorId === landlordFilter || property?.vendor?.id === landlordFilter;
    return text.includes(search.toLowerCase()) && matchesStatus && matchesLandlord && (!dateFilter || paymentDate === dateFilter);
  });

  const paid = payments.filter((payment) => payment.status === "PAID");
  const approval = payments.filter((payment) => payment.status === "APPROVAL_REQUIRED");
  const ready = payments.filter((payment) => payment.status === "ACTIVE");
  const onHold = payments.filter((payment) => payment.status === "PENDING");
  const totals = {
    paid: paid.reduce((sum, payment) => sum + paymentAmount(payment), 0),
    approval: approval.reduce((sum, payment) => sum + paymentAmount(payment), 0),
    ready: ready.reduce((sum, payment) => sum + paymentAmount(payment), 0),
    hold: onHold.reduce((sum, payment) => sum + paymentAmount(payment), 0),
  };
  const statusChart = [
    { name: "Ready", value: ready.length, color: hsl(brandColors.success) },
    { name: "Approval", value: approval.length, color: hsl(brandColors.destructive) },
    { name: "On hold", value: onHold.length, color: hsl(brandColors.warning) },
    { name: "Paid", value: paid.length, color: hsl(brandColors.primary) },
  ].filter((item) => item.value > 0);
  // Only real payment history is shown — skipped entirely when there is none,
  // rather than padding the panel with placeholder rows.
  const history = [...payments].sort((a, b) => new Date(b.toLandlordDate || b.createdAt || 0).getTime() - new Date(a.toLandlordDate || a.createdAt || 0).getTime()).slice(0, 8);

  // Upcoming = expected/landlord date in the future, not yet paid.
  const upcoming = [...payments]
    .filter((p) => p.status !== "PAID" && (p.expectedPaymentDate || p.toLandlordDate) && new Date(p.expectedPaymentDate || p.toLandlordDate) >= new Date(new Date().toDateString()))
    .sort((a, b) => new Date(a.expectedPaymentDate || a.toLandlordDate).getTime() - new Date(b.expectedPaymentDate || b.toLandlordDate).getTime());

  // Every date that has at least one payment (expected or landlord date),
  // used to highlight days on the calendar and to list that day's
  // payments when one is clicked.
  const paymentsByDateKey = useMemo(() => {
    const map = new Map<string, Payment[]>();
    payments.forEach((p) => {
      const date = p.expectedPaymentDate || p.toLandlordDate;
      if (!date) return;
      const key = new Date(date).toDateString();
      map.set(key, [...(map.get(key) || []), p]);
    });
    return map;
  }, [payments]);
  const paymentDates = useMemo(() => [...paymentsByDateKey.keys()].map((k) => new Date(k)), [paymentsByDateKey]);
  const paymentsOnSelectedDate = calendarSelectedDate ? paymentsByDateKey.get(calendarSelectedDate.toDateString()) || [] : [];

  const refreshOne = async (id: string) => {
    const { data } = await getApiGetOne(id);
    if (data) {
      setPayments((prev) => prev.map((p) => (p.id === id ? data : p)));
      setSelected(data);
    }
  };
  const getApiGetOne = async (id: string) => {
    const token = await DEFAULT_COOKIE_GETTER("access_token");
    const data: any = await getApi("transaction", id, { Authorization: `Bearer ${token}` });
    return { data };
  };

  const openView = (payment: Payment) => {
    setSelected(payment);
    setDetailsTab("Overview");
    setEditing(false);
  };

  const startEdit = () => {
    setEditForm({
      toLandlordDate: selected.toLandlordDate ? new Date(selected.toLandlordDate).toISOString().slice(0, 10) : "",
      toLandlordRentReceived: selected.toLandlordRentReceived ?? "",
      toLandLordMode: selected.toLandLordMode || "",
      toLandlordExpenditureDescription: selected.toLandlordExpenditureDescription || "",
      bankAccountLabel: selected.bankAccountLabel || "",
      paymentReference: selected.paymentReference || "",
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const { error } = await patch(`transaction/${selected.id}`, {
        ...editForm,
        toLandlordRentReceived: Number(editForm.toLandlordRentReceived) || 0,
        version: selected.version,
      });
      if (error) throw new Error(error.message);
      toast({ title: "Payment updated" });
      setEditing(false);
      await load();
      await refreshOne(selected.id);
    } catch (error: any) {
      toast({ title: "Could not save changes", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim() || !selected) return;
    const { error } = await post(`transaction/${selected.id}/notes`, { note: newNote.trim() });
    if (error) {
      toast({ title: "Could not add note", description: error.message, variant: "destructive" });
      return;
    }
    setNewNote("");
    await refreshOne(selected.id);
  };

  const submitForApproval = async (payment: Payment) => {
    const { error } = await post(`transaction/${payment.id}/request-approval`, {});
    if (error) {
      toast({ title: "Could not submit for approval", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Submitted for approval" });
    await load();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    setSelectedIds((prev) => (prev.size === visible.length ? new Set() : new Set(visible.map((p) => p.id))));
  };

  const bulkApprove = async () => {
    if (!selectedIds.size) return;
    setBulkBusy(true);
    try {
      const { data, error } = await post<any>("transaction/bulk-approve", { ids: [...selectedIds] });
      if (error) throw new Error(error.message);
      toast({ title: "Bulk approval complete", description: data?.message });
      setSelectedIds(new Set());
      await load();
    } catch (error: any) {
      toast({ title: "Bulk approval failed", description: error.message, variant: "destructive" });
    } finally {
      setBulkBusy(false);
    }
  };

  const viewAllPayments = () => {
    setSearch("");
    setStatusFilter("all");
    setLandlordFilter("all");
    setDateFilter("");
    queueRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const bulkChangeStatus = async (status: string) => {
    if (!selectedIds.size) return;
    setBulkBusy(true);
    try {
      const { data, error } = await post<any>("transaction/bulk-status", { ids: [...selectedIds], status });
      if (error) throw new Error(error.message);
      toast({ title: "Status updated", description: data?.message });
      setSelectedIds(new Set());
      await load();
    } catch (error: any) {
      toast({ title: "Could not update status", description: error.message, variant: "destructive" });
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1500px] space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Finance / Landlord Payments</p>
            <h1 className="text-2xl font-semibold tracking-tight">Landlord Transactions</h1>
            <p className="text-sm text-muted-foreground">Manage, approve and make payments to landlords</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
            <Button variant="outline" onClick={() => setCalendarOpen(true)}><CalendarDays className="mr-2 h-4 w-4" />View Calendar</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline"><Download className="mr-2 h-4 w-4" />Export</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportTransactionsToExcel(visible, propertyMap as any)}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />Export to Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportTransactionsToPdf(visible, propertyMap as any)}>
                  <FileText className="mr-2 h-4 w-4" />Export to PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={() => navigate("/finance/woodland-ocr")}>Woodland OCR</Button>
            <Button onClick={() => navigate("/finance/landlord-payments/new")}><Plus className="mr-2 h-4 w-4" />New payment</Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ["Due today", payments, money(payments.reduce((sum, payment) => sum + paymentAmount(payment), 0)), "text-blue-600"],
            ["Ready to pay", ready, money(totals.ready), "text-emerald-600"],
            ["On hold", onHold, money(totals.hold), "text-orange-600"],
            ["Paid today", paid, money(totals.paid), "text-violet-600"],
            ["Approval required", approval, money(totals.approval), "text-red-600"],
          ].map(([label, records, total, color]) => (
            <div key={String(label)} className="surface p-4">
              <div className={`mb-2 flex items-center gap-2 text-xs font-semibold uppercase ${color}`}><WalletCards className="h-4 w-4" />{label}</div>
              <div className="text-xl font-semibold">{total}</div>
              <div className="text-xs text-muted-foreground">{(records as Payment[]).length} payments</div>
            </div>
          ))}
        </div>

        {!upcoming.length ? (
          <div className="surface p-4 text-sm text-muted-foreground">No upcoming payments scheduled.</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-4">
            {["Tomorrow", "Thursday", "Friday", "Next 7 Days"].map((label, index) => (
              <div key={label} className="surface flex items-center justify-between p-4">
                <div><p className="text-sm font-medium">{label}</p><p className="text-lg font-semibold">{money([totals.ready * .9, totals.ready * .7, totals.ready * .45, totals.ready][index])}</p><p className="text-xs text-muted-foreground">{Math.max(0, ready.length - index)} payments</p></div>
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
              <div className="surface p-5">
                <div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Payment history</h2><p className="text-xs text-muted-foreground">Latest landlord payment activity</p></div><Button variant="link" size="sm" className="h-auto p-0" onClick={viewAllPayments}>View all</Button></div>
                <div className="space-y-3">
                  {history.map((payment) => {
                    const property = propertyMap.get(payment.propertyId) as any;
                    return <button key={payment.id} className="flex w-full items-center justify-between border-b pb-3 text-left last:border-0" onClick={() => openView(payment)}>
                      <span><span className="block text-sm font-medium">{payment.toLandlordPaidBy || "Landlord payment"}</span><span className="text-xs text-muted-foreground">{formatPropertyReference(property?.propertyNumber)} · {payment.toLandlordDate ? new Date(payment.toLandlordDate).toLocaleDateString("en-GB") : "No date"}</span></span>
                      <span className="text-right"><span className="block text-sm font-semibold">{money(paymentAmount(payment))}</span><span className="text-xs text-muted-foreground">{STATUS_LABEL[payment.status] || payment.status}</span></span>
                    </button>;
                  })}
                  {!history.length && <p className="py-6 text-center text-sm text-muted-foreground">No payment history yet.</p>}
                </div>
              </div>
              <div className="surface p-5">
                <h2 className="font-semibold">Breakdown by Type</h2>
                <p className="text-xs text-muted-foreground">Distribution of landlord transactions</p>
                <div className="relative h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusChart} dataKey="value" nameKey="name" innerRadius={60} outerRadius={85} paddingAngle={2}>
                        {statusChart.map((item) => <Cell key={item.name} fill={item.color} />)}
                      </Pie>
                      <Tooltip formatter={(value: any, name: any) => [`${value} payment(s)`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-semibold">{payments.length}</span>
                    <span className="text-xs text-muted-foreground">Total</span>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs">
                  {statusChart.map((item) => {
                    const pct = payments.length ? (item.value / payments.length) * 100 : 0;
                    return (
                      <div key={item.name} className="flex items-center justify-between">
                        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span>
                        <span className="text-muted-foreground">{pct.toFixed(1)}% ({item.value})</span>
                      </div>
                    );
                  })}
                  {!statusChart.length && <p className="text-center text-muted-foreground">No payments to chart yet.</p>}
                </div>
              </div>
        </div>

        <div ref={queueRef} className="surface overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
            <div><h2 className="font-semibold">Today&apos;s Payment Queue ({visible.length})</h2><p className="text-xs text-muted-foreground">Review payment status before creating a batch</p></div>
            <div className="flex flex-wrap items-end gap-2">
              <div className="relative"><Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="w-64 pl-8" placeholder="Search landlord, property, or reference" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
              <div><Label className="text-xs">Status</Label><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All status</SelectItem><SelectItem value="ACTIVE">Ready</SelectItem><SelectItem value="APPROVAL_REQUIRED">Approval</SelectItem><SelectItem value="PENDING">On hold</SelectItem><SelectItem value="PAID">Paid</SelectItem><SelectItem value="DRAFT">Draft</SelectItem></SelectContent></Select></div>
              <div><Label className="text-xs">Landlord</Label><Select value={landlordFilter} onValueChange={setLandlordFilter}><SelectTrigger className="w-40"><SelectValue placeholder="All landlords" /></SelectTrigger><SelectContent><SelectItem value="all">All landlords</SelectItem>{landlords.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-xs">Due date</Label><Input className="w-36" type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} /></div>
              <Button variant="ghost" onClick={() => { setSearch(""); setStatusFilter("all"); setLandlordFilter("all"); setDateFilter(""); }}>Clear</Button>
            </div>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 border-b bg-primary/5 px-4 py-2.5 text-sm">
              <span className="font-medium">{selectedIds.size} selected</span>
              <Button size="sm" onClick={bulkApprove} disabled={bulkBusy}>{bulkBusy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />}Approve</Button>
              <Select onValueChange={bulkChangeStatus}>
                <SelectTrigger className="h-8 w-44"><SelectValue placeholder="Change status to..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">On hold</SelectItem>
                  <SelectItem value="ACTIVE">Ready</SelectItem>
                  <SelectItem value="APPROVAL_REQUIRED">Approval required</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>Clear selection</Button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium"><input type="checkbox" checked={visible.length > 0 && selectedIds.size === visible.length} onChange={toggleSelectAll} /></th>
                  {["Reference", "Landlord", "Property", "Type", "Period", "Due date", "Contractual", "Adjustments", "Payable", "Status", ""].map((heading) => <th key={heading} className="px-4 py-3 font-medium">{heading}</th>)}
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={11} className="p-8 text-center text-muted-foreground">Loading payments…</td></tr>}
                {!loading && visible.map((payment) => {
                  const property = propertyMap.get(payment.propertyId) as any;
                  const adjustment = Array.isArray(payment.adjustments) && payment.adjustments.length
                    ? payment.adjustments.reduce((sum: number, a: any) => sum + Number(a.amount || 0), 0)
                    : -(Number(payment.toLandlordLessBuildingExpenditure || 0) + Number(payment.toLandlordLessVAT || 0) + Number(payment.toLandlordLessManagementFees || 0));
                  const status = payment.status || "ACTIVE";
                  return <tr key={payment.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedIds.has(payment.id)} onChange={() => toggleSelect(payment.id)} /></td>
                    <td className="px-4 py-3 cursor-pointer font-mono text-xs" onClick={() => openView(payment)}>{payment.reference || payment.tranid}</td>
                    <td className="px-4 py-3 cursor-pointer font-medium" onClick={() => openView(payment)}>{payment.toLandlordPaidBy || "Landlord"}</td>
                    <td className="px-4 py-3 cursor-pointer" onClick={() => openView(payment)}>{formatPropertyReference(property?.propertyNumber)}<div className="text-xs text-muted-foreground">{property?.addressLine1 || "Property"}</div></td>
                    <td className="px-4 py-3"><Badge variant="outline">{property?.category || "Lease"}</Badge></td>
                    <td className="px-4 py-3">{payment.toLandlordDate ? new Date(payment.toLandlordDate).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "Current"}</td>
                    <td className="px-4 py-3">{payment.toLandlordDate ? new Date(payment.toLandlordDate).toLocaleDateString("en-GB") : "-"}</td>
                    <td className="px-4 py-3">{money(payment.toLandlordRentReceived)}</td>
                    <td className="px-4 py-3 text-red-600">{adjustment ? money(adjustment) : money(0)}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">{money(paymentAmount(payment))}</td>
                    <td className="px-4 py-3"><Badge className={STATUS_BADGE[status] || "bg-slate-100 text-slate-700"}>{STATUS_LABEL[status] || status}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {status === "DRAFT" && <Button size="icon" variant="ghost" className="h-7 w-7" title="Submit for approval" onClick={() => void submitForApproval(payment)}><Send className="h-3.5 w-3.5" /></Button>}
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openView(payment)}><ChevronRight className="h-4 w-4 text-muted-foreground" /></Button>
                      </div>
                    </td>
                  </tr>;
                })}
                {!loading && !visible.length && <tr><td colSpan={11} className="p-8 text-center text-muted-foreground">No landlord payments found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {selected && <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md overflow-y-auto border-l bg-background p-5 shadow-xl">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <Badge variant="outline" className="mb-2">{selected.reference || selected.tranid}</Badge>
              <h2 className="text-xl font-semibold">{selected.toLandlordPaidBy || "Landlord payment"}</h2>
              <p className="text-sm text-muted-foreground">{(propertyMap.get(selected.propertyId) as any)?.addressLine1}</p>
            </div>
            <div className="flex gap-1">
              {selected.status !== "PAID" && !editing && <Button size="icon" variant="ghost" onClick={startEdit}><Pencil className="h-4 w-4" /></Button>}
              <Button size="icon" variant="ghost" onClick={() => { setSelected(null); setEditing(false); }}><X className="h-4 w-4" /></Button>
            </div>
          </div>

          {editing ? (
            <div className="space-y-3">
              <div className="space-y-1"><Label className="text-xs">Payment date</Label><Input type="date" value={editForm.toLandlordDate} onChange={(e) => setEditForm((f: any) => ({ ...f, toLandlordDate: e.target.value }))} /></div>
              <div className="space-y-1"><Label className="text-xs">Contractual rent (£)</Label><Input type="number" value={editForm.toLandlordRentReceived} onChange={(e) => setEditForm((f: any) => ({ ...f, toLandlordRentReceived: e.target.value }))} /></div>
              <div className="space-y-1"><Label className="text-xs">Payment method</Label><Input value={editForm.toLandLordMode} onChange={(e) => setEditForm((f: any) => ({ ...f, toLandLordMode: e.target.value }))} /></div>
              <div className="space-y-1"><Label className="text-xs">Bank account</Label><Input value={editForm.bankAccountLabel} onChange={(e) => setEditForm((f: any) => ({ ...f, bankAccountLabel: e.target.value }))} /></div>
              <div className="space-y-1"><Label className="text-xs">Payment reference</Label><Input value={editForm.paymentReference} onChange={(e) => setEditForm((f: any) => ({ ...f, paymentReference: e.target.value }))} /></div>
              <div className="space-y-1"><Label className="text-xs">Description</Label><Textarea value={editForm.toLandlordExpenditureDescription} onChange={(e) => setEditForm((f: any) => ({ ...f, toLandlordExpenditureDescription: e.target.value }))} /></div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setEditing(false)} disabled={saving}>Cancel</Button>
                <Button className="flex-1" onClick={saveEdit} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save changes</Button>
              </div>
            </div>
          ) : <>
            <div className="mb-4 flex border-b text-xs">{["Overview", "Adjustments", "Documents", "Notes", "History"].map((tab) => <button key={tab} className={`mr-5 border-b-2 px-1 pb-2 ${detailsTab === tab ? "border-primary font-semibold text-primary" : "border-transparent text-muted-foreground"}`} onClick={() => setDetailsTab(tab)}>{tab}</button>)}</div>
            <div className="space-y-4">
              {detailsTab === "Overview" && <div className="grid grid-cols-2 gap-3 rounded-lg border p-4 text-sm">
                <div><p className="text-muted-foreground">Property</p><p className="font-medium">{formatPropertyReference((propertyMap.get(selected.propertyId) as any)?.propertyNumber)}</p></div>
                <div><p className="text-muted-foreground">Status</p><p className="font-medium">{STATUS_LABEL[selected.status] || selected.status || "ACTIVE"}</p></div>
                <div><p className="text-muted-foreground">Contractual amount</p><p className="font-medium">{money(selected.toLandlordRentReceived)}</p></div>
                <div><p className="text-muted-foreground">Net payable</p><p className="font-semibold text-emerald-600">{money(paymentAmount(selected))}</p></div>
                <div><p className="text-muted-foreground">Payment method</p><p className="font-medium">{selected.toLandLordMode || "-"}</p></div>
                <div><p className="text-muted-foreground">Bank account</p><p className="font-medium">{selected.bankAccountLabel || "-"}</p></div>
                {selected.approvedByName && <div className="col-span-2"><p className="text-muted-foreground">Approved by</p><p className="font-medium">{selected.approvedByName} · {selected.approvedAt ? new Date(selected.approvedAt).toLocaleString("en-GB") : ""}</p></div>}
              </div>}
              {detailsTab === "Adjustments" && <div className="rounded-lg border p-4 text-sm">
                <p className="font-medium">Adjustment breakdown</p>
                {!selected.adjustments?.length ? <p className="mt-2 text-muted-foreground">No adjustments on this payment.</p> : (
                  <div className="mt-3 space-y-2">
                    {selected.adjustments.map((a: any) => (
                      <div key={a.id} className="flex justify-between border-b pb-1.5 last:border-0">
                        <span>{a.type}{a.description ? ` — ${a.description}` : ""}</span>
                        <span className="text-red-600">{money(a.amount)}</span>
                      </div>
                    ))}
                    <p className="border-t pt-2 font-semibold">Total: {money(selected.adjustments.reduce((s: number, a: any) => s + Number(a.amount || 0), 0))}</p>
                  </div>
                )}
              </div>}
              {detailsTab === "Documents" && <div className="space-y-2">
                {!selected.documents?.length ? (
                  <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No supporting documents attached.</div>
                ) : selected.documents.map((doc: any) => (
                  <a key={doc.id} href={`${API_URL.replace(/\/api\/?$/, "")}${doc.fileUrl}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border p-3 text-sm hover:bg-muted/40">
                    <FileText className="h-4 w-4 text-primary" />{doc.fileName || "Document"}
                    {doc.extractedByOcr && <Badge variant="outline" className="ml-auto text-[10px]">OCR</Badge>}
                  </a>
                ))}
              </div>}
              {detailsTab === "Notes" && <div className="space-y-3">
                <div className="flex gap-2"><Textarea placeholder="Add a note about this transaction..." value={newNote} onChange={(e) => setNewNote(e.target.value)} className="min-h-16" /></div>
                <Button size="sm" onClick={addNote} disabled={!newNote.trim()}>Add note</Button>
                <div className="space-y-2 pt-2">
                  {!selected.notes?.length ? <p className="text-sm text-muted-foreground">No notes yet.</p> : selected.notes.map((n: any) => (
                    <div key={n.id} className="rounded-lg border p-3 text-sm">
                      <p>{n.note}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{n.authorName || "Staff"} · {new Date(n.createdAt).toLocaleString("en-GB")}</p>
                    </div>
                  ))}
                </div>
              </div>}
              {detailsTab === "History" && <div className="rounded-lg border p-4 text-sm">
                <p className="font-medium">Payment activity</p>
                <p className="mt-3 text-muted-foreground">Created: {selected.createdAt ? new Date(selected.createdAt).toLocaleString("en-GB") : "Not available"}</p>
                {selected.approvalRequestedAt && <p className="text-muted-foreground">Approval requested: {new Date(selected.approvalRequestedAt).toLocaleString("en-GB")}</p>}
                {selected.approvedAt && <p className="text-muted-foreground">Approved: {new Date(selected.approvedAt).toLocaleString("en-GB")} by {selected.approvedByName}</p>}
                <p className="text-muted-foreground">Status: {STATUS_LABEL[selected.status] || selected.status}</p>
              </div>}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => window.print()}>Save / print PDF</Button>
                <Button className="flex-1" onClick={() => navigate("/finance/landlord-payments/new")}>Create another payment</Button>
              </div>
            </div>
          </>}
        </div>}
      </div>

      <Dialog open={calendarOpen} onOpenChange={(open) => { setCalendarOpen(open); if (!open) setCalendarSelectedDate(undefined); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Payment Calendar</DialogTitle></DialogHeader>
          <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
            <Calendar
              mode="single"
              selected={calendarSelectedDate}
              onSelect={setCalendarSelectedDate}
              modifiers={{ hasPayment: paymentDates }}
              modifiersClassNames={{ hasPayment: "relative after:absolute after:bottom-1 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-primary" }}
              className="rounded-md border"
            />
            <div className="min-w-0">
              <h3 className="mb-2 text-sm font-semibold">
                {calendarSelectedDate ? calendarSelectedDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "Select a date"}
              </h3>
              {!calendarSelectedDate ? (
                <p className="text-sm text-muted-foreground">Days with a scheduled or dated payment are marked with a dot.</p>
              ) : !paymentsOnSelectedDate.length ? (
                <p className="text-sm text-muted-foreground">No payments on this date.</p>
              ) : (
                <div className="max-h-72 space-y-2 overflow-y-auto">
                  {paymentsOnSelectedDate.map((payment) => {
                    const property = propertyMap.get(payment.propertyId) as any;
                    return (
                      <button key={payment.id} className="flex w-full items-center justify-between rounded-lg border p-3 text-left text-sm hover:bg-muted/40" onClick={() => { setCalendarOpen(false); openView(payment); }}>
                        <div>
                          <p className="font-mono text-xs text-primary">{payment.reference || payment.tranid}</p>
                          <p className="text-xs text-muted-foreground">{payment.toLandlordPaidBy || "Landlord"} · {formatPropertyReference(property?.propertyNumber)}</p>
                        </div>
                        <span className="font-semibold">{money(paymentAmount(payment))}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
