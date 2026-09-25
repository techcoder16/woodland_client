import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Search, Eye, AlertCircle, RefreshCw, Edit, MoreHorizontal, Trash, Building, FileText, Bell, BookOpen, CheckCircle2, Paperclip, SlidersHorizontal } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks";
import {
  deleteTransaction,
  fetchTransaction,
  fetchTransactionSummary,
  getDraftTransactions,
  getActiveTransactions,
  publishDraftTransaction,
  markTransactionPaid,
  StatusTransaction,
} from "@/redux/dataStore/transactionSlice";
import { fetchRents } from "@/redux/dataStore/rentSlice";
import { fetchPropertyParties } from "@/redux/dataStore/partySlice";
import { fetchVendors } from "@/redux/dataStore/vendorSlice";
import { fetchtenants } from "@/redux/dataStore/tenantSlice";
import getApi from "@/helper/getApi";
import { DEFAULT_COOKIE_GETTER } from "@/helper/Cookie";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { AddTransaction } from "@/pages/AddTransaction";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EditTransaction from "../EditTransaction";
import { Badge } from "@/components/ui/badge";
import { patch } from "@/helper/api";
import MaintenancePicker from "@/utils/MaintenancePicker";
import { PDFViewer } from "@react-pdf/renderer";
import TenantStatementPDF from "@/components/pdf/TenantStatementPDF";
import RentReminderPDF from "@/components/pdf/RentReminderPDF";
import ReferenceLetterPDF from "@/components/pdf/ReferenceLetterPDF";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { formatPropertyReference } from "@/utils/propertyReference";

// ── Column widths (must be static strings for Tailwind JIT to detect them) ─────
// Every column is a fixed width AND shrink-0/grow-0 — without that, a flex
// child with no explicit flex-grow/shrink can still be stretched by the
// browser to absorb leftover row width (this is what made the last column,
// "actions", balloon to fill most of the table when its width was w-[0px]).
const FIXED = "shrink-0 grow-0";
const COL = {
  // From Tenant (blue) — 13 cols
  fromDate:        `w-[100px] min-w-[100px] ${FIXED}`,
  fromMode:        `w-[85px] min-w-[85px] ${FIXED}`,
  otherDebit:      `w-[90px] min-w-[90px] ${FIXED}`,
  benefit1:        `w-[85px] min-w-[85px] ${FIXED}`,
  benefit2:        `w-[85px] min-w-[85px] ${FIXED}`,
  rentRecv:        `w-[90px] min-w-[90px] ${FIXED}`,
  desc:            `w-[140px] min-w-[140px] ${FIXED}`,
  receivedBy:      `w-[100px] min-w-[100px] ${FIXED}`,
  privateNote:     `w-[110px] min-w-[110px] ${FIXED}`,
  totalCredit:     `w-[90px] min-w-[90px] ${FIXED}`,
  upToDate:        `w-[100px] min-w-[100px] ${FIXED}`,
  outstanding:     `w-[105px] min-w-[105px] ${FIXED}`,
  dueDate:         `w-[90px] min-w-[90px] ${FIXED}`,
  // Gross Profit (purple) — 1 col
  grossProfit:     `w-[90px] min-w-[90px] ${FIXED}`,
  // To Landlord (amber) — 17 cols
  toDate:          `w-[100px] min-w-[100px] ${FIXED}`,
  toRentRecv:      `w-[90px] min-w-[90px] ${FIXED}`,
  leaseMgmtFees:   `w-[150px] min-w-[150px] ${FIXED}`,
  buildingExp:     `w-[280px] min-w-[280px] ${FIXED}`,
  netReceived:     `w-[95px] min-w-[95px] ${FIXED}`,
  lessVAT:         `w-[80px] min-w-[80px] ${FIXED}`,
  netPaid:         `w-[85px] min-w-[85px] ${FIXED}`,
  chequeNo:        `w-[90px] min-w-[90px] ${FIXED}`,
  defaultExp:      `w-[105px] min-w-[105px] ${FIXED}`,
  expDesc:         `w-[140px] min-w-[140px] ${FIXED}`,

  // Meta (gray) — 4 cols
  branch:          `w-[80px] min-w-[80px] ${FIXED}`,
  attachments:     `w-[95px] min-w-[95px] ${FIXED}`,
  status:          `w-[90px] min-w-[90px] ${FIXED}`,
  actions:         `w-[60px] min-w-[60px] ${FIXED}`,
};

// w-full makes rows fill visible space; min-w kicks in when viewport is narrower
const TABLE_MIN_W = "min-w-[3545px] w-full";

/**
 * How each transaction status reads in the table. The lifecycle is
 * DRAFT → ACTIVE (ready) → APPROVAL_REQUIRED → approved → ACTIVE → PAID,
 * so "Ready" is approved-and-payable, and only PAID counts as money moved.
 */
const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  DRAFT: { label: "DRAFT", variant: "destructive" },
  ACTIVE: { label: "READY", variant: "secondary", className: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
  PENDING: { label: "ON HOLD", variant: "outline", className: "bg-slate-100 text-slate-600" },
  APPROVAL_REQUIRED: { label: "APPROVAL", variant: "secondary", className: "bg-amber-100 text-amber-700 hover:bg-amber-100" },
  PAID: { label: "PAID", variant: "secondary", className: "bg-emerald-600 text-white hover:bg-emerald-600/90" },
};

// ── Cell helpers ───────────────────────────────────────────────────────────────
const fmt = (v: any) => {
  if (v == null || v === "") return "-";
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
};
const money = (v: any) => (v != null && v !== "" ? `£${Number(v).toFixed(2)}` : "-");
const val   = (v: any) => (v != null && v !== "" ? v : "-");

// ── Inline-edit cell ───────────────────────────────────────────────────────────
// Click a cell to edit it in place; Enter/blur saves, Escape cancels.
const EditableCell: React.FC<{
  value: any;
  type?: "text" | "number";
  format?: (v: any) => string;
  onSave: (value: any) => void | Promise<void>;
  className?: string;
  disabled?: boolean;
}> = ({ value, type = "text", format = val, onSave, className, disabled }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  useEffect(() => { setDraft(value ?? ""); }, [value]);

  if (disabled) {
    return (
      <div
        className={`w-full h-full truncate rounded px-0.5 ${className ?? ""}`}
        title="This transaction is paid and can no longer be edited"
      >
        {format(value)}
      </div>
    );
  }

  if (editing) {
    return (
      <input
        autoFocus
        type={type}
        step={type === "number" ? "0.01" : undefined}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { setEditing(false); onSave(draft === "" ? null : type === "number" ? Number(draft) : draft); }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.currentTarget.blur(); }
          if (e.key === "Escape") { setDraft(value ?? ""); setEditing(false); }
        }}
        className={`w-full h-full px-1 py-0.5 text-xs border border-primary rounded outline-none bg-background ${className ?? ""}`}
      />
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className={`w-full h-full truncate cursor-text hover:bg-primary/10 rounded px-0.5 ${className ?? ""}`}
      title="Click to edit"
    >
      {format(value)}
    </div>
  );
};

// ── Summary box ────────────────────────────────────────────────────────────────
const SummaryField = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-2 py-0.5">
    <span className="text-xs text-muted-foreground whitespace-nowrap">{label}:</span>
    <span className="text-xs font-medium bg-card border border-border rounded px-2 py-0.5 min-w-[80px] text-right">
      {value}
    </span>
  </div>
);

// Same calculateBill logic as Rent.tsx
const calcBill = (rent: number, startsOn: string, closedOn: string | undefined, per: string, inArrears = false): number => {
  const endStr = closedOn && closedOn.trim() ? closedOn : new Date().toISOString();
  if (!startsOn || isNaN(Date.parse(startsOn)) || isNaN(Date.parse(endStr))) return rent;
  const start = new Date(startsOn);
  const end   = new Date(endStr);
  const days  = Math.ceil((end.getTime() - start.getTime()) / 86400000);
  let periods = 1;
  switch (per.toLowerCase()) {
    case "day":             periods = days; break;
    case "week":            periods = Math.ceil(days / 7); break;
    case "2-week":          periods = Math.ceil(days / 14); break;
    case "4-week":          periods = Math.ceil(days / 28); break;
    case "calendar-month":
    case "calender-month":
      periods = (end.getFullYear() - start.getFullYear()) * 12 +
                (end.getMonth() - start.getMonth()) +
                (end.getDate() >= start.getDate() ? 1 : 0);
      break;
    default: periods = 1;
  }
  periods = Math.max(1, inArrears ? periods - 1 : periods);
  return rent * periods;
};

const TransactionPage: React.FC<{ propertyId: string; property?: any; prefillRent?: string; prefillDue?: string }> = ({
  propertyId,
  property,
  prefillRent,
  prefillDue,
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { transaction, summary: backendSummary, totalPages, total, skip, take, loading, error } = useAppSelector((state) => state.transaction);
  const { rents } = useAppSelector((state) => state.rent);
  const { propertyParties }: any = useAppSelector((state: any) => state.parties);
  const { vendors }: any = useAppSelector((state: any) => state.vendors);
  const { tenants: allTenants }: any = useAppSelector((state: any) => state.tenants);
  const { user } = useAuth();
  const userName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.email || "";

  const [searchTerm, setSearchTerm]     = useState("");
  const [isAddOpen, setIsAddOpen]       = useState(false);
  const [isEditOpen, setIsEditOpen]     = useState(false);
  const [currentPage, setCurrentPage]   = useState(1);
  const [editTx, setEditTx]             = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "active">("all");
  const [pageSize, setPageSize]         = useState(10);
  const [showStatement, setShowStatement]       = useState(false);
  const [showRentReminder, setShowRentReminder] = useState(false);
  const [showRefLetter, setShowRefLetter]       = useState(false);

  // Auto-open Add Transaction, pre-filled, when arriving from the dashboard's
  // "rent due" click-through (?prefillRent=&prefillDue= on the manage-property route).
  useEffect(() => {
    if (prefillRent) setIsAddOpen(true);
  }, [prefillRent]);
  const addDefaultValues = prefillRent
    ? {
        fromTenantRentReceived: Number(prefillRent),
        toLandlordRentReceived: Number(prefillRent),
        fromTenantDate: prefillDue,
        toLandlordDate: prefillDue,
      }
    : undefined;
  const [statementTxs, setStatementTxs]         = useState<any[]>([]);

  // Synced scrollbars
  const topScrollRef   = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const syncingTop     = useRef(false);
  const syncingTable   = useRef(false);

  const onTopScroll = () => {
    if (syncingTop.current) return;
    syncingTable.current = true;
    if (tableScrollRef.current && topScrollRef.current)
      tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    syncingTable.current = false;
  };

  const onTableScroll = () => {
    if (syncingTable.current) return;
    syncingTop.current = true;
    if (topScrollRef.current && tableScrollRef.current)
      topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
    syncingTop.current = false;
  };

  // Server-side pagination for display
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(handle);
  }, [searchTerm]);

  const loadTransactions = useCallback(() => {
    const s = (currentPage - 1) * pageSize;
    if (statusFilter === "draft") {
      dispatch(getDraftTransactions({ propertyId, search: debouncedSearch, skip: s, take: pageSize }));
    } else if (statusFilter === "active") {
      dispatch(getActiveTransactions({ propertyId, search: debouncedSearch, skip: s, take: pageSize }));
    } else {
      dispatch(fetchTransaction({ propertyId, search: debouncedSearch, skip: s, take: pageSize }));
    }
  }, [dispatch, propertyId, currentPage, pageSize, statusFilter, debouncedSearch]);

  // Summary fetched once from dedicated backend endpoint — never changes with page
  const loadSummary = useCallback(() => {
    dispatch(fetchTransactionSummary({ propertyId }));
  }, [dispatch, propertyId]);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);
  useEffect(() => { loadSummary(); }, [loadSummary]);

  // Only the very first load should show the full-page spinner (which
  // unmounts the table, including the scroll container — resetting scroll
  // position). Background refreshes triggered by inline edits (e.g. picking
  // a maintenance job) keep the table mounted so scroll position survives.
  const hasLoadedOnceRef = useRef(false);
  useEffect(() => {
    if (!loading) hasLoadedOnceRef.current = true;
  }, [loading]);
  const showFullPageLoader = loading && !hasLoadedOnceRef.current;

  // Keep the version tracker in sync with freshly-loaded rows, but never
  // regress a version we already know is newer (an in-flight save's PATCH
  // response can resolve before this refetch lands).
  useEffect(() => {
    (transaction ?? []).forEach((tx: any) => {
      if (tx.id == null || tx.version == null) return;
      const known = versionRef.current[tx.id];
      if (known == null || tx.version > known) versionRef.current[tx.id] = tx.version;
    });
  }, [transaction]);

  // Load rent data for summary boxes
  useEffect(() => {
    if (!rents || Object.keys(rents).length === 0) {
      dispatch(fetchRents({ propertyId, page: 1, search: "" }));
    }
  }, [propertyId]);

  // Load party/vendor/tenant data for PDFs
  useEffect(() => {
    dispatch(fetchPropertyParties(propertyId));
    dispatch(fetchVendors({ page: 1, search: "" }));
    dispatch(fetchtenants({ page: 1, search: "" }));
  }, [dispatch, propertyId]);

  const partyData = (propertyParties as any)?.data ?? propertyParties;
  const pdfLandlord = Array.isArray(vendors)
    ? vendors.find((v: any) => v.id === partyData?.VendorId) ?? null
    : null;
  const firstTenantId = Array.isArray(partyData?.tenants) ? partyData.tenants[0]?.id : undefined;
  const pdfTenant = Array.isArray(allTenants)
    ? allTenants.find((t: any) => t.id === firstTenantId) ?? null
    : null;

  const openStatement = useCallback(async () => {
    try {
      const access_token = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = { Authorization: `Bearer ${access_token}` };
      const data: any = await getApi("transaction", `?propertyId=${propertyId}&skip=0&take=9999`, headers);
      const rows: any[] = data?.transactions || data?.data || (Array.isArray(data) ? data : []);
      setStatementTxs(rows.length > 0 ? rows : (transaction ?? []));
    } catch {
      setStatementTxs(transaction ?? []);
    }
    setShowStatement(true);
  }, [propertyId, transaction]);

  const displayRows = transaction ?? [];

  // Latest known version per transaction id, updated the instant a PATCH
  // response comes back (not on the next Redux refetch). Two edits fired in
  // quick succession on the same row would otherwise both read the same
  // stale `tx.version` from render scope, so the second PATCH loses the
  // optimistic-lock race, 409s, and the refetch-on-conflict wipes out the
  // first edit too — this is what looked like edits "reverting."
  const versionRef = useRef<Record<string, number>>({});
  // Per-row promise chain so concurrent cell saves on the same transaction
  // serialize instead of firing concurrent PATCHes against the same version.
  const saveChainRef = useRef<Record<string, Promise<void>>>({});
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => {
      loadTransactions();
      loadSummary();
    }, 400);
  }, [loadTransactions, loadSummary]);

  const saveField = useCallback(async (tx: any, fields: Record<string, any>) => {
    const version = versionRef.current[tx.id] ?? tx.version;
    try {
      const accessToken = await DEFAULT_COOKIE_GETTER("access_token");
      const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };
      const { data, error } = await patch<any>(`transaction/${tx.id}`, { ...fields, propertyId: tx.propertyId, version }, headers);
      if (error?.message) {
        toast.error(error.message.includes("modified by someone else") ? error.message : "Failed to save change");
        loadTransactions();
        return;
      }
      if (data?.version != null) versionRef.current[tx.id] = data.version;
      scheduleRefresh();
    } catch {
      toast.error("Failed to save change");
    }
  }, [loadTransactions, scheduleRefresh]);

  // Inline-edit save: PATCH the single field (plus any related auto-calc fields).
  // Chains onto any in-flight save for the same row so edits apply in order
  // against the freshest version instead of racing each other.
  const handleCellSave = useCallback((tx: any, fields: Record<string, any>) => {
    const prior = saveChainRef.current[tx.id] ?? Promise.resolve();
    const next = prior.then(() => saveField(tx, fields));
    saveChainRef.current[tx.id] = next.catch(() => {});
    return next;
  }, [saveField]);

  const handlePageChange = useCallback((page: number) => {
    if (page > 0 && page <= (totalPages ?? 1)) setCurrentPage(page);
  }, [totalPages]);

  const handleDelete = useCallback(async (id: any, propertyId: string) => {
    try {
      await dispatch(deleteTransaction({ id, propertyId })).unwrap();
      toast.success("Transaction deleted!");
    } catch {
      toast.error("Failed to delete transaction");
    }
  }, [dispatch]);

  const handleEdit = useCallback((tx: any) => {
    setEditTx(tx);
    setIsEditOpen(true);
  }, []);

  const handlePublish = useCallback(async (id: string, propertyId: string) => {
    try {
      await dispatch(publishDraftTransaction({ id, propertyId })).unwrap();
      toast.success("Draft published!");
    } catch {
      toast.error("Failed to publish draft");
    }
  }, [dispatch]);

  const handleMarkPaid = useCallback(async (id: string, propertyId: string) => {
    try {
      await dispatch(markTransactionPaid({ id, propertyId })).unwrap();
      toast.success("Transaction marked as paid");
    } catch (error: any) {
      toast.error(typeof error === "string" ? error : error?.message || "Failed to mark transaction as paid");
    }
  }, [dispatch]);

  // ── Summary totals — financial fields from backend, rent fields computed locally ──
  const summary = useMemo(() => {
    const rentDeposits: any[] = Array.isArray((rents as any)?.Deposit) ? (rents as any).Deposit : [];
    const b = backendSummary ?? {};

    const upToDateRent = rentDeposits.reduce((acc, d) =>
      acc + calcBill(Number(d.rent) || 0, d.startsOn, d.closedOn, d.per || "calender-month", d.inArrears || false),
    0);
    const dueDate = rentDeposits.reduce((latest: string, d: any) => {
      if (!d.startsOn) return latest;
      return !latest || new Date(d.startsOn) > new Date(latest) ? d.startsOn : latest;
    }, "");
    const totalCredit = b.totalCredit ?? 0;

    return {
      totalCredit,
      upToDateRent,
      netOutstanding:  upToDateRent - totalCredit,
      dueDate,
      otherDebitTotal: b.otherDebitTotal ?? 0,
      benefit1Total:   b.benefit1Total ?? 0,
      benefit2Total:   b.benefit2Total ?? 0,
      rentRecvTotal:   b.rentRecvTotal ?? 0,
      toRentRecvTotal: b.llNetRentRecv ?? 0,
      leaseMgmtTotal:  b.llLeaseMgmt ?? 0,
      netPaidTotal:    b.llNetPaid ?? 0,
      grossTotal:      b.grossTotal ?? 0,
      llNetRentRecv:   b.llNetRentRecv ?? 0,
      llNetDeductions: b.llNetDeductions ?? 0,
      llNetToBePaid:   b.llNetToBePaid ?? 0,
      llNetPaid:       b.llNetPaid ?? 0,
      llNetDebit:      b.llNetDebit ?? 0,
    };
  }, [backendSummary, rents]);

  return (
    <div className="w-full space-y-4 overflow-x-hidden">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
            <p className="text-sm text-muted-foreground">
              Property ID: <span className="font-medium text-foreground">{formatPropertyReference(property?.propertyNumber)}</span>
              {property?.addressLine1 ? ` - ${property.addressLine1}` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={openStatement}>
              <FileText className="mr-1 h-4 w-4" /> Tenant Statement
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowRentReminder(true)}>
              <Bell className="mr-1 h-4 w-4" /> Rent Reminder
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowRefLetter(true)}>
              <BookOpen className="mr-1 h-4 w-4" /> Reference Letter
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate("/finance/landlord-payments/new")}>
              <Building className="mr-1 h-4 w-4" /> Landlord Payment
            </Button>
            <Button size="sm" onClick={() => setIsAddOpen(true)}>
              <Plus className="mr-1 h-4 w-4" /> Add Transaction
            </Button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search transactions..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {/* "Ready" is the approved, payable state — it is not paid yet. */}
            {(["all", "draft", "active"] as const).map((f) => (
              <Button
                key={f}
                variant={statusFilter === f ? "default" : "outline"}
                size="sm"
                onClick={() => { setStatusFilter(f); setCurrentPage(1); }}
                className="capitalize"
              >
                {f === "all" ? "All" : f === "draft" ? "Drafts" : "Ready to pay"}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      {showFullPageLoader ? (
        <div className="text-center p-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="mt-2 text-muted-foreground">Loading transactions...</p>
        </div>
      ) : error ? (
        <div className="text-center p-8">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-2" />
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadTransactions} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" /> Try Again
          </Button>
        </div>
      ) : (total ?? 0) > 0 ? (
        <>
          <div className="rounded-lg border shadow-sm overflow-hidden w-full">

            {/* Top scrollbar */}
            <div
              ref={topScrollRef}
              onScroll={onTopScroll}
              className="overflow-x-auto overflow-y-hidden"
              style={{ height: 12 }}
            >
              <div className={`${TABLE_MIN_W} h-1`} />
            </div>

            {/* Table scroll container */}
            <div ref={tableScrollRef} onScroll={onTableScroll} className="overflow-x-auto">

              {/* ── Section labels ── */}
              <div className={`flex text-xs font-semibold uppercase tracking-wide ${TABLE_MIN_W}`}>
                {/* Tenant */}
                <div className="flex bg-blue-600 text-white">
                  <div className={`${COL.fromDate}    px-2 py-1`} />
                  <div className={`${COL.fromMode}    px-2 py-1`} />
                  <div className={`${COL.otherDebit}  px-2 py-1`} />
                  <div className={`${COL.benefit1}    px-2 py-1`} />
                  <div className={`${COL.benefit2}    px-2 py-1`} />
                  <div className={`${COL.rentRecv}    px-2 py-1`} />
                  <div className={`${COL.desc}        px-2 py-1`} />
                  <div className={`${COL.receivedBy}  px-2 py-1`} />
                  <div className={`${COL.privateNote} px-2 py-1`} />
                  <div className={`${COL.totalCredit} px-2 py-1`} />
                  <div className={`${COL.upToDate}    px-2 py-1`} />
                  <div className={`${COL.outstanding} px-2 py-1`} />
                  <div className={`${COL.dueDate}     px-2 py-1 flex items-center`}>From Tenant</div>
                </div>
                {/* Gross Profit */}
                <div className="flex bg-purple-600 text-white">
                  <div className={`${COL.grossProfit} px-2 py-1 flex items-center`}>Gross</div>
                </div>
                {/* Landlord */}
                <div className="flex bg-amber-600 text-white">
                  <div className={`${COL.toDate}          px-2 py-1`} />
                  <div className={`${COL.toRentRecv}      px-2 py-1`} />
                  <div className={`${COL.leaseMgmtFees}   px-2 py-1`} />
                  <div className={`${COL.buildingExp}     px-2 py-1`} />
                  <div className={`${COL.netReceived}     px-2 py-1`} />
                  <div className={`${COL.lessVAT}         px-2 py-1`} />
                  <div className={`${COL.netPaid}         px-2 py-1`} />
                  <div className={`${COL.chequeNo}        px-2 py-1`} />
                  <div className={`${COL.defaultExp}      px-2 py-1`} />
                  <div className={`${COL.expDesc}         px-2 py-1 flex items-center`}>To Landlord</div>
                </div>
                {/* Meta */}
                <div className="flex bg-muted-foreground text-white">
                  <div className={`${COL.branch}  px-2 py-1 flex items-center`}>Branch</div>
                  <div className={`${COL.attachments} px-2 py-1 flex items-center`}>Attach.</div>
                  <div className={`${COL.status}  px-2 py-1 flex items-center`}>Status</div>
                  <div className={`${COL.actions} px-2 py-1`} />
                </div>
              </div>

              {/* ── Column headers ── */}
              <div className={`flex text-xs font-medium text-muted-foreground border-b ${TABLE_MIN_W}`}>
                {/* Tenant */}
                <div className={`${COL.fromDate}    px-2 py-2 bg-blue-50 border-r border-blue-200`}>Date</div>
                <div className={`${COL.fromMode}    px-2 py-2 bg-blue-50 border-r border-blue-200`}>Mode</div>
                <div className={`${COL.otherDebit}  px-2 py-2 bg-blue-50 border-r border-blue-200`}>Other Debit</div>
                <div className={`${COL.benefit1}    px-2 py-2 bg-blue-50 border-r border-blue-200`}>Benefit 1</div>
                <div className={`${COL.benefit2}    px-2 py-2 bg-blue-50 border-r border-blue-200`}>Benefit 2</div>
                <div className={`${COL.rentRecv}    px-2 py-2 bg-blue-50 border-r border-blue-200`}>Rent Recv.</div>
                <div className={`${COL.desc}        px-2 py-2 bg-blue-50 border-r border-blue-200`}>Description</div>
                <div className={`${COL.receivedBy}  px-2 py-2 bg-blue-50 border-r border-blue-200`}>Received By</div>
                <div className={`${COL.privateNote} px-2 py-2 bg-blue-50 border-r border-blue-200`}>Private Note</div>
                <div className={`${COL.totalCredit} px-2 py-2 bg-blue-50 border-r border-blue-200`}>Total Credit</div>
                <div className={`${COL.upToDate}    px-2 py-2 bg-blue-50 border-r border-blue-200`}>Up-to-date</div>
                <div className={`${COL.outstanding} px-2 py-2 bg-blue-50 border-r border-blue-200`}>Outstanding</div>
                <div className={`${COL.dueDate}     px-2 py-2 bg-blue-50 border-r border-blue-400`}>Due Date</div>
                {/* Gross */}
                <div className={`${COL.grossProfit} px-2 py-2 bg-purple-50 border-r border-purple-400`}>Gross Profit</div>
                {/* Landlord */}
                <div className={`${COL.toDate}          px-2 py-2 bg-amber-50 border-r border-amber-200`}>Date</div>
                <div className={`${COL.toRentRecv}      px-2 py-2 bg-amber-50 border-r border-amber-200`}>Rent Recv.</div>
                <div className={`${COL.leaseMgmtFees}   px-2 py-2 bg-amber-50 border-r border-amber-200`}>Less Mgmt Fees</div>
                <div className={`${COL.buildingExp}     px-2 py-2 bg-amber-50 border-r border-amber-200`}>Bldg Exp. (Planned / Actual / Diff)</div>
                <div className={`${COL.netReceived}     px-2 py-2 bg-amber-50 border-r border-amber-200`}>Net Received</div>
                <div className={`${COL.lessVAT}         px-2 py-2 bg-amber-50 border-r border-amber-200`}>Less VAT</div>
                <div className={`${COL.netPaid}         px-2 py-2 bg-amber-50 border-r border-amber-200`}>Net Paid</div>
                <div className={`${COL.chequeNo}        px-2 py-2 bg-amber-50 border-r border-amber-200`}>Cheque No</div>
                <div className={`${COL.defaultExp}      px-2 py-2 bg-amber-50 border-r border-amber-200`}>Default Exp.</div>
                <div className={`${COL.expDesc}         px-2 py-2 bg-amber-50 border-r border-amber-200`}>Exp. Desc.</div>
                {/* Meta */}
                <div className={`${COL.branch}  px-2 py-2 bg-muted border-r border-border`}>Branch</div>
                <div className={`${COL.attachments} px-2 py-2 bg-muted border-r border-border`}>Adj. / Docs</div>
                <div className={`${COL.status}  px-2 py-2 bg-muted border-r border-border`}>Status</div>
                <div className={`${COL.actions} px-2 py-2 bg-muted`}></div>
              </div>

              {/* ── Data rows ── */}
              <div className="divide-y">
                {displayRows.map((tx: any, i: number) => (
                  <div
                    key={tx.tranid ?? tx.id ?? i}
                    className={`flex text-xs hover:bg-muted transition-colors ${TABLE_MIN_W} ${
                      i % 2 === 0 ? "bg-card" : "bg-muted/60"
                    }`}
                  >
                    {/* Tenant */}
                    <div className={`${COL.fromDate}    px-2 py-2 truncate bg-blue-50/30 border-r border-blue-100`}>{fmt(tx.fromTenantDate)}</div>
                    <div className={`${COL.fromMode}    px-2 py-2 truncate bg-blue-50/30 border-r border-blue-100`}>{val(tx.fromTenantMode)}</div>
                    <div className={`${COL.otherDebit}  px-2 py-2 truncate bg-blue-50/30 border-r border-blue-100`}>{money(tx.fromTenantOtherDebit)}</div>
                    <div className={`${COL.benefit1}    px-2 py-2 truncate bg-blue-50/30 border-r border-blue-100`}>{money(tx.fromTenantHBenefit1)}</div>
                    <div className={`${COL.benefit2}    px-2 py-2 truncate bg-blue-50/30 border-r border-blue-100`}>{money(tx.fromTenantHBenefit2)}</div>
                    <div className={`${COL.rentRecv}    px-2 py-2 bg-blue-50/30 border-r border-blue-100`}>
                      <EditableCell
                        value={tx.fromTenantRentReceived}
                        type="number"
                        format={money}
                        onSave={(v) => handleCellSave(tx, { fromTenantRentReceived: v })}
                        disabled={tx.status === StatusTransaction.PAID}
                      />
                    </div>
                    <div className={`${COL.desc}        px-2 py-2 truncate bg-blue-50/30 border-r border-blue-100`} title={tx.fromTenantDescription}>{val(tx.fromTenantDescription)}</div>
                    <div className={`${COL.receivedBy}  px-2 py-2 truncate bg-blue-50/30 border-r border-blue-100`}>{val(tx.fromTenantReceivedBy)}</div>
                    <div className={`${COL.privateNote} px-2 py-2 truncate bg-blue-50/30 border-r border-blue-100`} title={tx.fromTenantPrivateNote}>{val(tx.fromTenantPrivateNote)}</div>
                    <div className={`${COL.totalCredit} px-2 py-2 truncate bg-blue-50/30 border-r border-blue-100`}>{money(tx.tenantTotalCredit)}</div>
                    <div className={`${COL.upToDate}    px-2 py-2 truncate bg-blue-50/30 border-r border-blue-100`}>{money(tx.tenantUpToDateRent)}</div>
                    <div className={`${COL.outstanding} px-2 py-2 truncate bg-blue-50/30 border-r border-blue-100`}>{money(tx.tenantNetOutstanding)}</div>
                    <div className={`${COL.dueDate}     px-2 py-2 truncate bg-blue-50/30 border-r border-blue-300`}>{fmt(tx.tenantDueDate)}</div>
                    {/* Gross */}
                    <div className={`${COL.grossProfit} px-2 py-2 truncate bg-purple-50/30 border-r border-purple-300`}>{money(tx.grossProfit)}</div>
                    {/* Landlord */}
                    <div className={`${COL.toDate}          px-2 py-2 truncate bg-amber-50/30 border-r border-amber-100`}>{fmt(tx.toLandlordDate)}</div>
                    <div className={`${COL.toRentRecv}      px-2 py-2 bg-amber-50/30 border-r border-amber-100`}>
                      <EditableCell
                        value={tx.toLandlordRentReceived}
                        type="number"
                        format={money}
                        onSave={(v) => handleCellSave(tx, { toLandlordRentReceived: v })}
                        disabled={tx.status === StatusTransaction.PAID}
                      />
                    </div>
                    <div className={`${COL.leaseMgmtFees}   px-2 py-2 bg-amber-50/30 border-r border-amber-100`}>
                      <div className="flex items-center gap-1">
                        <select
                          value={tx.toLandlordManagementFeeMode || "FLAT"}
                          onChange={(e) => handleCellSave(tx, { toLandlordManagementFeeMode: e.target.value })}
                          disabled={tx.status === StatusTransaction.PAID}
                          className="text-[10px] border rounded bg-background px-0.5 py-0.5 shrink-0 disabled:opacity-60"
                          title="Management fee mode"
                        >
                          <option value="FLAT">£</option>
                          <option value="PERCENT">%</option>
                        </select>
                        {tx.toLandlordManagementFeeMode === "PERCENT" ? (
                          <EditableCell
                            value={tx.toLandlordManagementFeePercent}
                            type="number"
                            format={(v) => (v != null ? `${v}%` : "-")}
                            onSave={(v) => handleCellSave(tx, { toLandlordManagementFeePercent: v })}
                            disabled={tx.status === StatusTransaction.PAID}
                          />
                        ) : (
                          <EditableCell
                            value={tx.toLandlordLessManagementFees}
                            type="number"
                            format={money}
                            onSave={(v) => handleCellSave(tx, { toLandlordLessManagementFees: v, toLandlordManagementFeeMode: "FLAT" })}
                            disabled={tx.status === StatusTransaction.PAID}
                          />
                        )}
                      </div>
                      {tx.toLandlordManagementFeeMode === "PERCENT" && (
                        <div className="text-[10px] text-muted-foreground truncate">= {money(tx.toLandlordLessManagementFees)}</div>
                      )}
                    </div>
                    <div className={`${COL.buildingExp}     px-2 py-2 bg-amber-50/30 border-r border-amber-100`}>
                      <div className="mb-1">
                        <MaintenancePicker
                          propertyId={tx.propertyId}
                          value={tx.jobTypeIds}
                          selectedLabels={tx.toLandlordExpenditureDescription ? [tx.toLandlordExpenditureDescription] : undefined}
                          onChange={(jobIds, totalCharged, jobs) =>
                            handleCellSave(tx, {
                              jobTypeIds: jobIds,
                              toLandlordLessBuildingExpenditure: totalCharged,
                              toLandlordExpenditureDescription: jobs.map((j) => j.label).join("; "),
                            })
                          }
                          disabled={tx.status === StatusTransaction.PAID}
                        />
                      </div>
                      <div className="flex items-center gap-1 text-[11px]">
                        <span className="text-muted-foreground shrink-0">Plan</span>
                        <EditableCell
                          value={tx.toLandlordLessBuildingExpenditure}
                          type="number"
                          format={money}
                          onSave={(v) => handleCellSave(tx, { toLandlordLessBuildingExpenditure: v })}
                          disabled={tx.status === StatusTransaction.PAID}
                        />
                        <span className="text-muted-foreground shrink-0">Act</span>
                        <EditableCell
                          value={tx.toLandlordLessBuildingExpenditureActual}
                          type="number"
                          format={money}
                          onSave={(v) => {
                            const planned = Number(tx.toLandlordLessBuildingExpenditure) || 0;
                            const actual = Number(v) || 0;
                            handleCellSave(tx, {
                              toLandlordLessBuildingExpenditureActual: v,
                              toLandlordLessBuildingExpenditureDifference: actual - planned,
                            });
                          }}
                          disabled={tx.status === StatusTransaction.PAID}
                        />
                        <span
                          className={`shrink-0 font-medium ${Number(tx.toLandlordLessBuildingExpenditureDifference) > 0 ? "text-destructive" : "text-emerald-600"}`}
                          title="Actual − Planned"
                        >
                          {money(tx.toLandlordLessBuildingExpenditureDifference)}
                        </span>
                      </div>
                    </div>
                    <div className={`${COL.netReceived}     px-2 py-2 truncate bg-amber-50/30 border-r border-amber-100`}>{money(tx.toLandlordNetReceived)}</div>
                    <div className={`${COL.lessVAT}         px-2 py-2 bg-amber-50/30 border-r border-amber-100`}>
                      <EditableCell
                        value={tx.toLandlordLessVAT}
                        type="number"
                        format={money}
                        onSave={(v) => handleCellSave(tx, { toLandlordLessVAT: v })}
                        disabled={tx.status === StatusTransaction.PAID}
                      />
                    </div>
                    <div className={`${COL.netPaid}         px-2 py-2 truncate bg-amber-50/30 border-r border-amber-100`}>{money(tx.toLandlordNetPaid)}</div>
                    <div className={`${COL.chequeNo}        px-2 py-2 bg-amber-50/30 border-r border-amber-100`}>
                      <EditableCell
                        value={tx.toLandlordChequeNo}
                        onSave={(v) => handleCellSave(tx, { toLandlordChequeNo: v })}
                        disabled={tx.status === StatusTransaction.PAID}
                      />
                    </div>
                    <div className={`${COL.defaultExp}      px-2 py-2 truncate bg-amber-50/30 border-r border-amber-100`}>{val(tx.toLandlordDefaultExpenditure)}</div>
                    <div className={`${COL.expDesc}         px-2 py-2 bg-amber-50/30 border-r border-amber-100`}>
                      <EditableCell
                        value={tx.toLandlordExpenditureDescription}
                        onSave={(v) => handleCellSave(tx, { toLandlordExpenditureDescription: v })}
                        disabled={tx.status === StatusTransaction.PAID}
                      />
                    </div>
 {/* Meta */}
                    <div className={`${COL.branch}  px-2 py-2 truncate border-r border-border`}>{val(tx.Branch)}</div>
                    {/* Adjustments and documents come back with every listing
                        query; without this column they were invisible unless
                        the row was opened. */}
                    <div className={`${COL.attachments} px-2 py-2 flex items-center gap-2 text-[11px] border-r border-border`}>
                      {(tx.adjustments?.length ?? 0) > 0 ? (
                        <span
                          className="flex items-center gap-0.5 text-amber-700"
                          title={tx.adjustments.map((a: any) => `${a.type}${a.description ? ` — ${a.description}` : ""}: ${money(a.amount)}`).join("\n")}
                        >
                          <SlidersHorizontal className="h-3 w-3" />
                          {tx.adjustments.length}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">–</span>
                      )}
                      {(tx.documents?.length ?? 0) > 0 ? (
                        <span
                          className="flex items-center gap-0.5 text-blue-700"
                          title={tx.documents.map((d: any) => d.fileName || d.fileUrl).join("\n")}
                        >
                          <Paperclip className="h-3 w-3" />
                          {tx.documents.length}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">–</span>
                      )}
                    </div>
                    <div className={`${COL.status}  px-2 py-2 flex items-center border-r border-border`}>
                      {/* Every status reads distinctly: collapsing them to
                          "ACTIVE" hid which rows were awaiting approval, and
                          ACTIVE means approved-and-ready-to-pay, not paid. */}
                      <Badge variant={STATUS_BADGE[tx.status]?.variant ?? "secondary"} className={`text-xs ${STATUS_BADGE[tx.status]?.className ?? ""}`}>
                        {STATUS_BADGE[tx.status]?.label ?? tx.status ?? "-"}
                      </Badge>
                    </div>
                    <div className={`${COL.actions} px-1 py-1.5 flex items-center justify-center`}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {tx.status !== StatusTransaction.PAID && (
                            <DropdownMenuItem onClick={() => handleEdit(tx)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                          )}
                          {tx.status === StatusTransaction.DRAFT && (
                            <DropdownMenuItem onClick={() => handlePublish(tx.id, tx.propertyId)}>
                              <Eye className="mr-2 h-4 w-4" /> Publish
                            </DropdownMenuItem>
                          )}
                          {tx.status === StatusTransaction.ACTIVE && (
                            <DropdownMenuItem onClick={() => handleMarkPaid(tx.id, tx.propertyId)}>
                              <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as Paid
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {tx.status !== StatusTransaction.PAID && (
                            <DropdownMenuItem
                              onClick={() => handleDelete(tx.id, tx.propertyId)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Totals row ── */}
              {summary && (
                <div className={`flex text-xs font-semibold bg-foreground text-background ${TABLE_MIN_W}`}>
                  <div className={`${COL.fromDate}    px-2 py-2`}>Totals</div>
                  <div className={`${COL.fromMode}    px-2 py-2`} />
                  <div className={`${COL.otherDebit}  px-2 py-2`}>£{summary.otherDebitTotal.toFixed(2)}</div>
                  <div className={`${COL.benefit1}    px-2 py-2`}>£{summary.benefit1Total.toFixed(2)}</div>
                  <div className={`${COL.benefit2}    px-2 py-2`}>£{summary.benefit2Total.toFixed(2)}</div>
                  <div className={`${COL.rentRecv}    px-2 py-2`}>£{summary.rentRecvTotal.toFixed(2)}</div>
                  <div className={`${COL.desc}        px-2 py-2`} />
                  <div className={`${COL.receivedBy}  px-2 py-2`} />
                  <div className={`${COL.privateNote} px-2 py-2`} />
                  <div className={`${COL.totalCredit} px-2 py-2`} />
                  <div className={`${COL.upToDate}    px-2 py-2`} />
                  <div className={`${COL.outstanding} px-2 py-2`} />
                  <div className={`${COL.dueDate}     px-2 py-2`} />
                  <div className={`${COL.grossProfit} px-2 py-2`}>£{summary.grossTotal.toFixed(2)}</div>
                  <div className={`${COL.toDate}          px-2 py-2`} />
                  <div className={`${COL.toRentRecv}      px-2 py-2`}>£{summary.toRentRecvTotal.toFixed(2)}</div>
                  <div className={`${COL.leaseMgmtFees}   px-2 py-2`}>£{summary.leaseMgmtTotal.toFixed(2)}</div>
                  <div className={`${COL.buildingExp}     px-2 py-2`} />
                  <div className={`${COL.netReceived}     px-2 py-2`} />
                  <div className={`${COL.lessVAT}         px-2 py-2`} />
                  <div className={`${COL.netPaid}         px-2 py-2`}>£{summary.netPaidTotal.toFixed(2)}</div>
                  <div className={`${COL.chequeNo}        px-2 py-2`} />
                  <div className={`${COL.defaultExp}      px-2 py-2`} />
                  <div className={`${COL.expDesc}         px-2 py-2`} />
       
                  <div className={`${COL.branch}          px-2 py-2`} />
                  <div className={`${COL.attachments}     px-2 py-2`} />
                  <div className={`${COL.status}          px-2 py-2`} />
                  <div className={`${COL.actions}         px-2 py-2`} />
                </div>
              )}

            </div>
          </div>

          {/* ── Pagination ── */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-muted-foreground">
            <div>
              Showing {(skip ?? 0) + 1}–{Math.min((skip ?? 0) + (take ?? pageSize), total ?? 0)} of {total ?? 0} transactions
            </div>
            <div className="flex items-center gap-2">
              <span>Page size:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="border rounded px-2 py-1"
              >
                {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(totalPages ?? 1, 5) }, (_, i) => {
                  const tp = totalPages ?? 1;
                  const p =
                    tp <= 5 ? i + 1
                    : currentPage <= 3 ? i + 1
                    : currentPage >= tp - 2 ? tp - 4 + i
                    : currentPage - 2 + i;
                  return (
                    <PaginationItem key={p}>
                      <PaginationLink
                        onClick={() => handlePageChange(p)}
                        isActive={currentPage === p}
                        className="cursor-pointer"
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={currentPage === (totalPages ?? 1) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <Building className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">
            {statusFilter === "all" ? "No transactions found" : statusFilter === "draft" ? "No draft transactions" : "No transactions ready to pay"}
          </h3>
          <p className="mt-2 text-muted-foreground text-sm">
            {statusFilter === "draft"
              ? "No draft transactions yet."
              : statusFilter === "active"
              ? "No active transactions found."
              : "Get started by adding your first transaction."}
          </p>
          <div className="flex gap-2 justify-center mt-4">
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Transaction
            </Button>
            <Button onClick={loadTransactions} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>
      )}

      {/* ── Summary boxes (always visible — driven by rent deposits + transactions) ── */}
      <div className="grid grid-cols-3 gap-4">
        {/* Tenant */}
        <div className="border rounded-lg p-3 bg-blue-50/40">
          <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Tenant</div>
          <SummaryField label="Total Credit"    value={`£${summary.totalCredit.toFixed(2)}`} />
          <SummaryField label="Up to Date Rent" value={`£${summary.upToDateRent.toFixed(2)}`} />
          <SummaryField label="Net Outstanding"  value={`£${summary.netOutstanding.toFixed(2)}`} />
          <SummaryField label="Due Date"         value={fmt(summary.dueDate)} />
        </div>
        {/* Gross Profit */}
        <div className="border rounded-lg p-3 bg-purple-50/40 flex flex-col items-center justify-center">
          <div className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2">Gross Profit</div>
          <span className="text-2xl font-bold text-purple-800">£{summary.grossTotal.toFixed(2)}</span>
        </div>
        {/* Landlord */}
        <div className="border rounded-lg p-3 bg-amber-50/40">
          <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">Landlord</div>
          <SummaryField label="Net Rent Received" value={`£${summary.llNetRentRecv.toFixed(2)}`} />
          <SummaryField label="Net Deductions"    value={`£${summary.llNetDeductions.toFixed(2)}`} />
          <SummaryField label="Net to be Paid"    value={`£${summary.llNetToBePaid.toFixed(2)}`} />
          <SummaryField label="Net Paid"          value={`£${summary.llNetPaid.toFixed(2)}`} />
          <SummaryField label="Net Credit"        value={`£${summary.llNetDebit.toFixed(2)}`} />
        </div>
      </div>

      <AddTransaction
        isOpen={isAddOpen}
        propertyId={propertyId}
        defaultValues={addDefaultValues}
        onClose={() => { setIsAddOpen(false); loadTransactions(); loadSummary(); }}
      />
      {isEditOpen && (
        <EditTransaction
          isOpen={isEditOpen}
          onClose={() => { setIsEditOpen(false); loadTransactions(); loadSummary(); }}
          transaction={editTx}
        />
      )}

      <Dialog open={showStatement} onOpenChange={setShowStatement}>
        <DialogContent className="sm:max-w-5xl h-[90vh] w-full">
          <DialogTitle className="text-lg font-semibold">Tenant Statement</DialogTitle>
          <div className="w-full h-[78vh] border rounded-md overflow-hidden">
            <PDFViewer width="100%" height="100%" showToolbar={false}>
              <TenantStatementPDF
                transactions={statementTxs}
                property={property}
                rentData={rents}
                tenant={pdfTenant}
              />
            </PDFViewer>
          </div>
          <DialogFooter className="pt-2 flex justify-end">
            <Button variant="outline" onClick={() => setShowStatement(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRentReminder} onOpenChange={setShowRentReminder}>
        <DialogContent className="sm:max-w-4xl h-[90vh] w-full">
          <DialogTitle className="text-lg font-semibold">Rent Reminder</DialogTitle>
          <div className="w-full h-[78vh] border rounded-md overflow-hidden">
            <PDFViewer width="100%" height="100%" showToolbar={false}>
              <RentReminderPDF
                property={property}
                rentData={rents}
                netOutstanding={summary.netOutstanding}
                dueDate={summary.dueDate}
                userName={userName}
                tenant={pdfTenant}
              />
            </PDFViewer>
          </div>
          <DialogFooter className="pt-2 flex justify-end">
            <Button variant="outline" onClick={() => setShowRentReminder(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRefLetter} onOpenChange={setShowRefLetter}>
        <DialogContent className="sm:max-w-4xl h-[90vh] w-full">
          <DialogTitle className="text-lg font-semibold">Reference Letter</DialogTitle>
          <div className="w-full h-[78vh] border rounded-md overflow-hidden">
            <PDFViewer width="100%" height="100%" showToolbar={false}>
              <ReferenceLetterPDF
                property={property}
                rentData={rents}
                netOutstanding={summary.netOutstanding}
                dueDate={summary.dueDate}
                userName={userName}
                tenant={pdfTenant}
              />
            </PDFViewer>
          </div>
          <DialogFooter className="pt-2 flex justify-end">
            <Button variant="outline" onClick={() => setShowRefLetter(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransactionPage;
