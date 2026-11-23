import { useEffect, useMemo, useRef, useState } from "react";
import { openStoredFile, uploadFile } from "@/helper/fileUpload";
import { CalendarDays, CheckCircle2, ChevronRight, Download, FileSpreadsheet, FileText, Filter, Loader2, Mail, Paperclip, Pencil, Plus, RefreshCw, StickyNote, Upload, WalletCards, X } from "lucide-react";
import type { DayContentProps } from "react-day-picker";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { exportPaymentReviewToPdf, exportTransactionsToExcel, exportTransactionsToPdf } from "@/utils/transactionExport";
import { useToast } from "@/components/ui/use-toast";
import { InfoHint } from "@/components/ui/hint";

const API_URL = import.meta.env.VITE_API_URL;
type Payment = any;

const money = (value: unknown) => `£${Number(value || 0).toLocaleString("en-GB", { minimumFractionDigits: 2 })}`;
const paymentAmount = (payment: Payment) => Number(payment.toLandlordNetPaid ?? payment.toLandlordNetReceived ?? payment.toLandlordRentReceived ?? 0);
const HEADING_HINTS: Record<string, string> = {"Reference": "Unique payment number, e.g. LLP-1126-001 (month/year + counter).", "Landlord": "Who is being paid.", "Property": "The property this payment is for.", "Type": "What kind of payment this is.", "Period": "The rental month this payment covers.", "Due date": "The date the landlord should be paid by.", "Contractual": "Rent due to the landlord under the agreement, before deductions.", "Adjustments": "Deductions or additions: management fee, VAT, maintenance recharges.", "Payable": "Final amount to pay the landlord after adjustments.", "Docs": "Attached files, e.g. statements and invoices.", "Status": "Paid, Overdue (due date has passed), Due, or Draft."};
const CARD_HINTS: Record<string, string> = {"All payments": "Every landlord payment, whatever its status.", "Overdue": "Unpaid payments whose due date has passed.", "Due": "Unpaid payments whose due date has not passed yet.", "Paid": "Completed payments. These are locked and cannot be changed."};

// What the list shows. Paid and Draft are fixed; any other unpaid payment is
// Overdue once its due date has passed, and Due until then.
type DisplayStatus = "OVERDUE" | "DUE" | "PAID" | "DRAFT";
const STATUS_LABEL: Record<DisplayStatus, string> = { OVERDUE: "Overdue", DUE: "Due", PAID: "Paid", DRAFT: "Draft" };
const STATUS_BADGE: Record<DisplayStatus, string> = {
  OVERDUE: "bg-red-100 text-red-700",
  DUE: "bg-amber-100 text-amber-800",
  PAID: "bg-violet-100 text-violet-700",
  DRAFT: "bg-slate-100 text-slate-700",
};
// Solid colour per status for the calendar bars — same hues as the badges.
const STATUS_BAR: Record<DisplayStatus, string> = {
  OVERDUE: "bg-red-500",
  DUE: "bg-amber-500",
  PAID: "bg-violet-500",
  DRAFT: "bg-slate-400",
};
const STATUS_ORDER: DisplayStatus[] = ["OVERDUE", "DUE", "PAID", "DRAFT"];

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
// Accounting period comes back as "2026-11"; show it as "November 2026".
const periodLabel = (value?: string) => {
  const match = /^(\d{4})-(\d{2})$/.exec(value || "");
  return match ? `${MONTH_NAMES[Number(match[2]) - 1]} ${match[1]}` : value || "";
};

const startOfToday = () => new Date(new Date().toDateString());
const dueDateOf = (payment: Payment) => payment.expectedPaymentDate || payment.toLandlordDate;
const displayStatus = (payment: Payment): DisplayStatus => {
  if (payment.status === "PAID") return "PAID";
  if (payment.status === "DRAFT") return "DRAFT";
  const due = dueDateOf(payment);
  return due && new Date(due) < startOfToday() ? "OVERDUE" : "DUE";
};

// Clickable due-date windows over unpaid payments (Due / Overdue; Paid and Draft excluded).
type DueWindow = "all" | "overdue" | "today" | "7" | "14" | "28";
const DUE_WINDOWS: { key: DueWindow; label: string }[] = [
  { key: "overdue", label: "Overdue" },
  { key: "today", label: "Due today" },
  { key: "7", label: "Next 7 days" },
  { key: "14", label: "Next 14 days" },
  { key: "28", label: "Next 28 days" },
];
const daysUntilDue = (payment: Payment) => {
  const due = dueDateOf(payment);
  if (!due) return null;
  return Math.round((new Date(new Date(due).toDateString()).getTime() - startOfToday().getTime()) / 86400000);
};
const inDueWindow = (payment: Payment, window: DueWindow) => {
  if (window === "all") return true;
  const status = displayStatus(payment);
  if (status !== "DUE" && status !== "OVERDUE") return false;
  const days = daysUntilDue(payment);
  if (days == null) return false;
  if (window === "overdue") return days < 0;
  if (window === "today") return days === 0;
  return days >= 0 && days <= Number(window);
};

export default function LandlordPayments() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const docUploadRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [emailing, setEmailing] = useState(false);
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
  const [dueWindow, setDueWindow] = useState<DueWindow>("all");
  const [detailsTab, setDetailsTab] = useState("Overview");
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<Date | undefined>(undefined);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

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

  // ?payment=<id> opens that payment's drawer (used by the property Rent Due rows).
  useEffect(() => {
    const id = searchParams.get("payment");
    if (!id || loading) return;
    const found = payments.find((p) => p.id === id);
    if (found) {
      setSelected(found);
      setDetailsTab("Overview");
      setEditing(false);
    }
    setSearchParams({}, { replace: true });
  }, [searchParams, payments, loading, setSearchParams]);

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
    const matchesStatus = statusFilter === "all" || displayStatus(payment) === statusFilter;
    const matchesLandlord = landlordFilter === "all" || property?.vendorId === landlordFilter || property?.vendor?.id === landlordFilter;
    return text.includes(search.toLowerCase()) && matchesStatus && matchesLandlord && (!dateFilter || paymentDate === dateFilter) && inDueWindow(payment, dueWindow);
  });

  const byStatus = (key: DisplayStatus) => payments.filter((payment) => displayStatus(payment) === key);
  const overdue = byStatus("OVERDUE");
  const due = byStatus("DUE");
  const paid = byStatus("PAID");
  const drafts = byStatus("DRAFT");
  const totalOf = (list: Payment[]) => list.reduce((sum, payment) => sum + paymentAmount(payment), 0);

  // Upcoming = expected/landlord date in the future, not yet paid.
  const upcoming = [...payments]
    .filter((p) => p.status !== "PAID" && (p.expectedPaymentDate || p.toLandlordDate) && new Date(p.expectedPaymentDate || p.toLandlordDate) >= new Date(new Date().toDateString()))
    .sort((a, b) => new Date(a.expectedPaymentDate || a.toLandlordDate).getTime() - new Date(b.expectedPaymentDate || b.toLandlordDate).getTime());
  const dayOffset = (p: Payment) => Math.round((new Date(new Date(p.expectedPaymentDate || p.toLandlordDate).toDateString()).getTime() - new Date(new Date().toDateString()).getTime()) / 86400000);
  const upcomingBuckets = [
    { label: "Today", items: upcoming.filter((p) => dayOffset(p) === 0) },
    { label: "Tomorrow", items: upcoming.filter((p) => dayOffset(p) === 1) },
    { label: "Next 7 days", items: upcoming.filter((p) => dayOffset(p) >= 2 && dayOffset(p) <= 7) },
    { label: "Later", items: upcoming.filter((p) => dayOffset(p) > 7) },
  ].filter((b) => b.items.length > 0);

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
  // Day cell for the payment calendar: the date plus a segmented bar, one
  // coloured segment per status, each as wide as its share of that day's
  // payments.
  const CalendarDay = ({ date }: DayContentProps) => {
    const list = paymentsByDateKey.get(date.toDateString()) || [];
    const counts = STATUS_ORDER.map((s) => [s, list.filter((p) => displayStatus(p) === s).length] as const).filter(([, n]) => n > 0);
    return (
      <span className="flex h-full w-full flex-col items-center justify-center gap-1" title={counts.map(([s, n]) => `${n} ${STATUS_LABEL[s]}`).join(" · ")}>
        <span className="leading-none">{date.getDate()}</span>
        {counts.length > 0 && (
          <span className="flex h-1.5 w-7 gap-px overflow-hidden rounded-full">
            {counts.map(([s, n]) => <span key={s} className={STATUS_BAR[s]} style={{ flexGrow: n }} />)}
          </span>
        )}
      </span>
    );
  };
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

  const openView = (payment: Payment, tab = "Overview") => {
    setSelected(payment);
    setDetailsTab(tab);
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

  // Marks any unpaid payment (draft, due or overdue) as paid. Paid is final.
  const markPaid = async () => {
    if (!selected) return;
    setActionBusy(true);
    try {
      const { data, error } = await post<any>(`transaction/${selected.id}/mark-paid`, {});
      if (error) throw new Error(error.message);
      if (data?.skipped?.length) throw new Error("This payment could not be marked as paid. Refresh and try again.");
      toast({ title: "Payment marked as paid" });
      await load();
      await refreshOne(selected.id);
    } catch (error: any) {
      toast({ title: "Action failed", description: error.message, variant: "destructive" });
    } finally {
      setActionBusy(false);
    }
  };

  // Emails the landlord a statement for this payment. Nothing is sent automatically on payment.
  // Landlord statement for the open payment: rent, each adjustment (maintenance
  // recharges, deductions, fees) and the net amount paid.
  const downloadStatement = () => {
    if (!selected) return;
    const property = propertyMap.get(selected.propertyId) as any;
    const adjustments = (selected.adjustments || []).map((a: any) => ({
      type: a.type || "Adjustment",
      description: a.description || undefined,
      relatedTo: a.relatedTo || a.jobType?.jobType || undefined,
      amount: Number(a.amount || 0),
    }));
    const contractualRent = Number(selected.toLandlordRentReceived || 0);
    const adjustmentTotal = adjustments.reduce((s: number, a: { amount: number }) => s + a.amount, 0);
    const address = [property?.addressLine1, property?.town, property?.postCode].filter(Boolean).join(", ");
    exportPaymentReviewToPdf(
      {
        details: [
          ["Reference", selected.reference || selected.tranid || "-"],
          ["Landlord", selected.toLandlordPaidBy || "-"],
          ["Property", `${formatPropertyReference(property?.propertyNumber)} ${address}`.trim() || "-"],
          ["Rent period", periodLabel(selected.accountingPeriod) || "-"],
          ["Payment date", selected.toLandlordDate ? new Date(selected.toLandlordDate).toLocaleDateString("en-GB") : "-"],
          ["Status", STATUS_LABEL[displayStatus(selected)]],
        ],
        adjustments,
        contractualRent,
        adjustmentTotal,
        // Same figure the emailed statement uses.
        netPayable: selected.toLandlordNetPaid != null ? Number(selected.toLandlordNetPaid) : contractualRent + adjustmentTotal,
      },
      `statement-${selected.reference || selected.id}.pdf`,
      "Landlord Statement",
    );
  };

  const emailStatement = async () => {
    if (!selected) return;
    setEmailing(true);
    const { data, error } = await post<any>(`transaction/${selected.id}/email-statement`, {});
    setEmailing(false);
    if (error) {
      toast({ title: "Could not email statement", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Statement emailed", description: data?.message || (data?.to ? `Sent to ${data.to}` : undefined) });
  };

  const uploadDocuments = async (files: FileList | null) => {
    if (!files?.length || !selected) return;
    setUploading(true);
    const failed: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const { id: fileId } = await uploadFile(file, { category: "transaction-document", entityType: "transaction", entityId: selected.id });
        const { error } = await post(`transaction/${selected.id}/documents`, { fileId });
        if (error) failed.push(`${file.name}: ${error.message}`);
      } catch (err: any) {
        failed.push(`${file.name}: ${err?.message || "upload failed"}`);
      }
    }
    setUploading(false);
    if (docUploadRef.current) docUploadRef.current.value = "";
    if (failed.length) toast({ title: `${failed.length} document(s) not uploaded`, description: failed.join("\n"), variant: "destructive" });
    else toast({ title: "Documents uploaded" });
    await load();
    await refreshOne(selected.id);
  };

  const selectedPayments = payments.filter((p) => selectedIds.has(p.id));

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
            <p className="text-sm text-muted-foreground">Record and track payments to landlords</p>
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

        {/* Only statuses that actually have payments — empty cards are hidden. */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {([
            ["All payments", payments, totalOf(payments), "text-blue-600"],
            ["Overdue", overdue, totalOf(overdue), "text-red-600"],
            ["Due", due, totalOf(due), "text-amber-600"],
            ["Paid", paid, totalOf(paid), "text-violet-600"],
          ] as [string, Payment[], number, string][]).filter(([, records]) => records.length > 0).map(([label, records, total, color]) => (
            <div key={label} className="surface p-4">
              <div className={`mb-2 flex items-center gap-2 text-xs font-semibold uppercase ${color}`}><WalletCards className="h-4 w-4" />{label}<InfoHint text={CARD_HINTS[label] ?? label} /></div>
              <div className="text-xl font-semibold">{money(total)}</div>
              <div className="text-xs text-muted-foreground">{records.length} payment{records.length === 1 ? "" : "s"}</div>
            </div>
          ))}
        </div>

        {/* Unpaid payments by real due date; empty buckets are hidden. */}
        {upcomingBuckets.length > 0 && (
          <div className="grid gap-3 md:grid-cols-4">
            {upcomingBuckets.map(({ label, items }) => (
              <div key={label} className="surface flex items-center justify-between p-4">
                <div><p className="text-sm font-medium">{label}</p><p className="text-lg font-semibold">{money(items.reduce((sum, p) => sum + paymentAmount(p), 0))}</p><p className="text-xs text-muted-foreground">{items.length} payment{items.length === 1 ? "" : "s"}</p></div>
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
              </div>
            ))}
          </div>
        )}


        <div className="surface overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
            <div><h2 className="font-semibold">Payment Queue ({visible.length})</h2><p className="text-xs text-muted-foreground">Review payment status before paying landlords</p></div>
            <div className="flex w-full flex-wrap gap-2 order-last">
              {DUE_WINDOWS.map((w) => {
                const count = payments.filter((p) => inDueWindow(p, w.key)).length;
                const active = dueWindow === w.key;
                return (
                  <button
                    key={w.key}
                    type="button"
                    onClick={() => setDueWindow(active ? "all" : w.key)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${active ? (w.key === "overdue" ? "border-red-600 bg-red-600 text-white" : "border-primary bg-primary text-primary-foreground") : w.key === "overdue" && count > 0 ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100" : "hover:bg-muted"}`}
                  >
                    {w.label} <span className="ml-1 opacity-80">{count}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <div className="relative"><Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="w-64 pl-8" placeholder="Search landlord, property, or reference" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
              <div><Label className="text-xs">Status</Label><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All status</SelectItem><SelectItem value="DUE">Due</SelectItem><SelectItem value="OVERDUE">Overdue</SelectItem><SelectItem value="PAID">Paid</SelectItem><SelectItem value="DRAFT">Draft</SelectItem></SelectContent></Select></div>
              <div><Label className="text-xs">Landlord</Label><Select value={landlordFilter} onValueChange={setLandlordFilter}><SelectTrigger className="w-40"><SelectValue placeholder="All landlords" /></SelectTrigger><SelectContent><SelectItem value="all">All landlords</SelectItem>{landlords.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-xs">Due date</Label><Input className="w-36" type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} /></div>
              <Button variant="ghost" onClick={() => { setSearch(""); setStatusFilter("all"); setLandlordFilter("all"); setDateFilter(""); setDueWindow("all"); }}>Clear</Button>
            </div>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 border-b bg-primary/5 px-4 py-2.5 text-sm">
              <span className="font-medium">{selectedIds.size} selected</span>
              {selectedPayments.every((p) => p.status === "PAID") ? (
                <span className="text-xs text-muted-foreground">Paid payments are locked — no status changes.</span>
              ) : (
              <Select onValueChange={bulkChangeStatus} disabled={bulkBusy}>
                <SelectTrigger className="h-8 w-44"><SelectValue placeholder="Change status to..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Set to due</SelectItem>
                  <SelectItem value="PAID">Mark as paid</SelectItem>
                </SelectContent>
              </Select>
              )}
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>Clear selection</Button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium"><input type="checkbox" checked={visible.length > 0 && selectedIds.size === visible.length} onChange={toggleSelectAll} /></th>
                  {["Reference", "Landlord", "Property", "Type", "Period", "Due date", "Contractual", "Adjustments", "Payable", "Docs", "Status", ""].map((heading) => <th key={heading} className="px-4 py-3 font-medium">{heading}{HEADING_HINTS[heading] && <InfoHint text={HEADING_HINTS[heading]} />}</th>)}
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={13} className="p-8 text-center text-muted-foreground">Loading payments…</td></tr>}
                {!loading && visible.map((payment) => {
                  const property = propertyMap.get(payment.propertyId) as any;
                  const adjustment = Array.isArray(payment.adjustments) && payment.adjustments.length
                    ? payment.adjustments.reduce((sum: number, a: any) => sum + Number(a.amount || 0), 0)
                    : -(Number(payment.toLandlordLessBuildingExpenditure || 0) + Number(payment.toLandlordLessVAT || 0) + Number(payment.toLandlordLessManagementFees || 0));
                  const status = displayStatus(payment);
                  return <tr key={payment.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedIds.has(payment.id)} onChange={() => toggleSelect(payment.id)} /></td>
                    <td className="px-4 py-3 cursor-pointer font-mono text-xs" onClick={() => openView(payment)}>{payment.reference || payment.tranid}</td>
                    <td className="px-4 py-3 cursor-pointer font-medium" onClick={() => openView(payment)}>{payment.toLandlordPaidBy || "Landlord"}</td>
                    <td className="px-4 py-3 cursor-pointer" onClick={() => openView(payment)}>{formatPropertyReference(property?.propertyNumber)}<div className="text-xs text-muted-foreground">{property?.addressLine1 || "Property"}</div></td>
                    <td className="px-4 py-3"><Badge variant="outline">{property?.category || "Lease"}</Badge></td>
                    <td className="px-4 py-3">{payment.accountingPeriod ? periodLabel(payment.accountingPeriod) : payment.toLandlordDate ? new Date(payment.toLandlordDate).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "Current"}</td>
                    <td className="px-4 py-3">{payment.toLandlordDate ? new Date(payment.toLandlordDate).toLocaleDateString("en-GB") : "-"}</td>
                    <td className="px-4 py-3">{money(payment.toLandlordRentReceived)}</td>
                    <td className="px-4 py-3 text-red-600">{adjustment ? money(adjustment) : money(0)}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">{money(paymentAmount(payment))}</td>
                    <td className="px-4 py-3">
                      {payment.documents?.length ? (
                        <button
                          className="flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
                          title={payment.documents.map((d: any) => d.fileName || d.fileUrl).join("\n")}
                          onClick={() => { openView(payment, "Documents"); }}
                        >
                          <Paperclip className="h-3.5 w-3.5" />{payment.documents.length}
                        </button>
                      ) : <span className="text-xs text-muted-foreground/60">–</span>}
                    </td>
                    <td className="px-4 py-3"><Badge className={STATUS_BADGE[status]}>{STATUS_LABEL[status]}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" title="Open notes" onClick={() => openView(payment, "Notes")}><StickyNote className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openView(payment)}><ChevronRight className="h-4 w-4 text-muted-foreground" /></Button>
                      </div>
                    </td>
                  </tr>;
                })}
                {!loading && !visible.length && <tr><td colSpan={13} className="p-8 text-center text-muted-foreground">No landlord payments found.</td></tr>}
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
                <div><p className="text-muted-foreground">Status</p><p className="font-medium">{STATUS_LABEL[displayStatus(selected)]}</p></div>
                <div><p className="text-muted-foreground">Rent period</p><p className="font-medium">{periodLabel(selected.accountingPeriod) || "-"}</p></div>
                <div><p className="text-muted-foreground">Due date</p><p className="font-medium">{dueDateOf(selected) ? new Date(dueDateOf(selected)).toLocaleDateString("en-GB") : "-"}</p></div>
                <div><p className="text-muted-foreground">Contractual amount</p><p className="font-medium">{money(selected.toLandlordRentReceived)}</p></div>
                <div><p className="text-muted-foreground">Net payable</p><p className="font-semibold text-emerald-600">{money(paymentAmount(selected))}</p></div>
                <div><p className="text-muted-foreground">Payment method</p><p className="font-medium">{selected.toLandLordMode || "-"}</p></div>
                <div><p className="text-muted-foreground">Bank account</p><p className="font-medium">{selected.bankAccountLabel || "-"}</p></div>
                <div><p className="text-muted-foreground">Payment reference</p><p className="font-mono text-xs font-medium">{selected.paymentReference || selected.reference || "-"}</p></div>
                <div><p className="text-muted-foreground">Created by</p><p className="font-medium">{selected.createdByName || "-"}</p></div>
                {selected.status === "PAID" && <div className="col-span-2"><p className="text-muted-foreground">Paid</p><p className="font-medium">{selected.paidByName || "-"}{selected.paidAt ? ` · ${new Date(selected.paidAt).toLocaleString("en-GB")}` : ""}</p></div>}
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
                <input ref={docUploadRef} type="file" multiple accept=".pdf,image/*" className="hidden" onChange={(e) => void uploadDocuments(e.target.files)} />
                <Button size="sm" variant="outline" className="w-full" disabled={uploading} onClick={() => docUploadRef.current?.click()}>
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Upload documents
                </Button>
                {!selected.documents?.length ? (
                  <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No supporting documents attached.</div>
                ) : selected.documents.map((doc: any) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => openStoredFile(doc.fileId).catch(() => toast({ title: "This document is no longer available", variant: "destructive" }))}
                    className="flex w-full items-center gap-2 rounded-lg border p-3 text-left text-sm hover:bg-muted/40"
                  >
                    <FileText className="h-4 w-4 text-primary" />{doc.fileName || "Document"}
                    {doc.extractedByOcr && <Badge variant="outline" className="ml-auto text-[10px]">OCR</Badge>}
                  </button>
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
                <p className="mt-3 text-muted-foreground">Created: {selected.createdAt ? new Date(selected.createdAt).toLocaleString("en-GB") : "Not available"}{selected.createdByName ? ` by ${selected.createdByName}` : ""}</p>
                {selected.paidAt && <p className="text-muted-foreground">Paid: {new Date(selected.paidAt).toLocaleString("en-GB")}{selected.paidByName ? ` by ${selected.paidByName}` : ""}</p>}
                <p className="text-muted-foreground">Status: {STATUS_LABEL[displayStatus(selected)]}</p>
              </div>}
              {/* No per-payment PDF: window.print() printed the whole page,
                  not the payment. Bulk export lives in the toolbar menu. */}
              {selected.status === "PAID" ? (
                <p className="rounded-lg bg-violet-50 p-3 text-center text-sm text-violet-700">This payment is paid and locked. It can no longer be edited or changed.</p>
              ) : (
                <Button className="w-full" disabled={actionBusy} onClick={() => void markPaid()}>{actionBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}Mark as paid</Button>
              )}
              <Button className="w-full" variant="outline" onClick={downloadStatement}><Download className="mr-2 h-4 w-4" />Download statement PDF</Button>
              <Button className="w-full" variant="outline" disabled={emailing} onClick={() => void emailStatement()}>{emailing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}Email statement to landlord</Button>
              <div className="flex gap-2">
                <Button className="flex-1" variant="outline" onClick={() => navigate("/finance/landlord-payments/new")}>Create another payment</Button>
              </div>
            </div>
          </>}
        </div>}
      </div>

      <Dialog open={calendarOpen} onOpenChange={(open) => { setCalendarOpen(open); if (!open) setCalendarSelectedDate(undefined); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Payment Calendar</DialogTitle></DialogHeader>
          <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
            <div>
              <Calendar
                mode="single"
                selected={calendarSelectedDate}
                onSelect={setCalendarSelectedDate}
                components={{ DayContent: CalendarDay }}
                classNames={{ head_cell: "text-muted-foreground rounded-md w-11 font-normal text-[0.8rem]", cell: "h-11 w-11 text-center text-sm p-0 relative", day: "h-11 w-11 rounded-md p-0 font-normal hover:bg-accent aria-selected:opacity-100" }}
                className="rounded-md border"
              />
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {STATUS_ORDER.map((s) => <span key={s} className="flex items-center gap-1.5"><span className={`h-1.5 w-3 rounded-full ${STATUS_BAR[s]}`} />{STATUS_LABEL[s]}</span>)}
              </div>
            </div>
            <div className="min-w-0">
              <h3 className="mb-2 text-sm font-semibold">
                {calendarSelectedDate ? calendarSelectedDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "Select a date"}
              </h3>
              {!calendarSelectedDate ? (
                <p className="text-sm text-muted-foreground">Each bar shows that day's payments by status. Click a day to list them.</p>
              ) : !paymentsOnSelectedDate.length ? (
                <p className="text-sm text-muted-foreground">No payments on this date.</p>
              ) : (
                <div className="max-h-72 space-y-2 overflow-y-auto">
                  {paymentsOnSelectedDate.map((payment) => {
                    const property = propertyMap.get(payment.propertyId) as any;
                    const status = displayStatus(payment);
                    return (
                      <button key={payment.id} className="flex w-full items-center justify-between rounded-lg border p-3 text-left text-sm hover:bg-muted/40" onClick={() => { setCalendarOpen(false); openView(payment); }}>
                        <div>
                          <p className="font-mono text-xs text-primary">{payment.reference || payment.tranid}</p>
                          <p className="text-xs text-muted-foreground">{payment.toLandlordPaidBy || "Landlord"} · {formatPropertyReference(property?.propertyNumber)}</p>
                        </div>
                        <span className="text-right">
                          <span className="block font-semibold">{money(paymentAmount(payment))}</span>
                          <Badge className={`text-[10px] ${STATUS_BADGE[status]}`}>{STATUS_LABEL[status]}</Badge>
                        </span>
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
