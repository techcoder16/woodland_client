import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, Eye, AlertCircle, RefreshCw, Edit, MoreHorizontal, Trash, Building, FileText, Bell, BookOpen } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks";
import {
  deleteTransaction,
  fetchTransaction,
  fetchTransactionSummary,
  getDraftTransactions,
  getActiveTransactions,
  publishDraftTransaction,
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
import { PDFViewer } from "@react-pdf/renderer";
import TenantStatementPDF from "@/components/pdf/TenantStatementPDF";
import RentReminderPDF from "@/components/pdf/RentReminderPDF";
import ReferenceLetterPDF from "@/components/pdf/ReferenceLetterPDF";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";

// ── Column widths (must be static strings for Tailwind JIT to detect them) ─────
const COL = {
  // From Tenant (blue) — 13 cols
  fromDate:        "w-[100px] min-w-[100px]",
  fromMode:        "w-[85px] min-w-[85px]",
  otherDebit:      "w-[90px] min-w-[90px]",
  benefit1:        "w-[85px] min-w-[85px]",
  benefit2:        "w-[85px] min-w-[85px]",
  rentRecv:        "w-[90px] min-w-[90px]",
  desc:            "w-[140px] min-w-[140px]",
  receivedBy:      "w-[100px] min-w-[100px]",
  privateNote:     "w-[110px] min-w-[110px]",
  totalCredit:     "w-[90px] min-w-[90px]",
  upToDate:        "w-[100px] min-w-[100px]",
  outstanding:     "w-[105px] min-w-[105px]",
  dueDate:         "w-[90px] min-w-[90px]",
  // Gross Profit (purple) — 1 col
  grossProfit:     "w-[90px] min-w-[90px]",
  // To Landlord (amber) — 17 cols
  toDate:          "w-[100px] min-w-[100px]",
  toRentRecv:      "w-[90px] min-w-[90px]",
  leaseMgmtFees:   "w-[110px] min-w-[110px]",
  buildingExp:     "w-[105px] min-w-[105px]",
  netReceived:     "w-[95px] min-w-[95px]",
  lessVAT:         "w-[80px] min-w-[80px]",
  netPaid:         "w-[85px] min-w-[85px]",
  chequeNo:        "w-[90px] min-w-[90px]",
  defaultExp:      "w-[105px] min-w-[105px]",
  expDesc:         "w-[140px] min-w-[140px]",
  
  // Meta (gray) — 3 cols
  branch:          "w-[80px] min-w-[80px]",
  status:          "w-[80px] min-w-[80px]",
  actions:         "w-[60px] min-w-[60px]",
};

// w-full makes rows fill visible space; min-w kicks in when viewport is narrower
const TABLE_MIN_W = "min-w-[3235px] w-full";

// ── Cell helpers ───────────────────────────────────────────────────────────────
const fmt = (v: any) => {
  if (v == null || v === "") return "-";
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
};
const money = (v: any) => (v != null && v !== "" ? `£${Number(v).toFixed(2)}` : "-");
const val   = (v: any) => (v != null && v !== "" ? v : "-");

// ── Summary box ────────────────────────────────────────────────────────────────
const SummaryField = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-2 py-0.5">
    <span className="text-xs text-gray-600 whitespace-nowrap">{label}:</span>
    <span className="text-xs font-medium bg-white border border-gray-300 rounded px-2 py-0.5 min-w-[80px] text-right">
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

const TransactionPage: React.FC<{ propertyId: string; property?: any }> = ({ propertyId, property }) => {
  const dispatch = useAppDispatch();
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
  const loadTransactions = useCallback(() => {
    const s = (currentPage - 1) * pageSize;
    if (statusFilter === "draft") {
      dispatch(getDraftTransactions({ propertyId, skip: s, take: pageSize }));
    } else if (statusFilter === "active") {
      dispatch(getActiveTransactions({ propertyId, skip: s, take: pageSize }));
    } else {
      dispatch(fetchTransaction({ propertyId, skip: s, take: pageSize }));
    }
  }, [dispatch, propertyId, currentPage, pageSize, statusFilter]);

  // Summary fetched once from dedicated backend endpoint — never changes with page
  const loadSummary = useCallback(() => {
    dispatch(fetchTransactionSummary({ propertyId }));
  }, [dispatch, propertyId]);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);
  useEffect(() => { loadSummary(); }, [loadSummary]);

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
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
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
            {(["all", "draft", "active"] as const).map((f) => (
              <Button
                key={f}
                variant={statusFilter === f ? "default" : "outline"}
                size="sm"
                onClick={() => { setStatusFilter(f); setCurrentPage(1); }}
                className="capitalize"
              >
                {f === "all" ? "All" : f === "draft" ? "Drafts" : "Active"}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="text-center p-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="mt-2 text-muted-foreground">Loading transactions...</p>
        </div>
      ) : error ? (
        <div className="text-center p-8">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-2" />
          <p className="text-gray-500 mb-4">{error}</p>
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
                <div className="flex bg-gray-600 text-white">
                  <div className={`${COL.branch}  px-2 py-1 flex items-center`}>Branch</div>
                  <div className={`${COL.status}  px-2 py-1 flex items-center`}>Status</div>
                  <div className={`${COL.actions} px-2 py-1`} />
                </div>
              </div>

              {/* ── Column headers ── */}
              <div className={`flex text-xs font-medium text-gray-600 border-b ${TABLE_MIN_W}`}>
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
                <div className={`${COL.buildingExp}     px-2 py-2 bg-amber-50 border-r border-amber-200`}>Less Bldg Exp.</div>
                <div className={`${COL.netReceived}     px-2 py-2 bg-amber-50 border-r border-amber-200`}>Net Received</div>
                <div className={`${COL.lessVAT}         px-2 py-2 bg-amber-50 border-r border-amber-200`}>Less VAT</div>
                <div className={`${COL.netPaid}         px-2 py-2 bg-amber-50 border-r border-amber-200`}>Net Paid</div>
                <div className={`${COL.chequeNo}        px-2 py-2 bg-amber-50 border-r border-amber-200`}>Cheque No</div>
                <div className={`${COL.defaultExp}      px-2 py-2 bg-amber-50 border-r border-amber-200`}>Default Exp.</div>
                <div className={`${COL.expDesc}         px-2 py-2 bg-amber-50 border-r border-amber-200`}>Exp. Desc.</div>
                {/* Meta */}
                <div className={`${COL.branch}  px-2 py-2 bg-gray-50 border-r border-gray-200`}>Branch</div>
                <div className={`${COL.status}  px-2 py-2 bg-gray-50 border-r border-gray-200`}>Status</div>
                <div className={`${COL.actions} px-2 py-2 bg-gray-50`}></div>
              </div>

              {/* ── Data rows ── */}
              <div className="divide-y">
                {displayRows.map((tx: any, i: number) => (
                  <div
                    key={tx.tranid ?? tx.id ?? i}
                    className={`flex text-xs hover:bg-gray-50 transition-colors ${TABLE_MIN_W} ${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50/60"
                    }`}
                  >
                    {/* Tenant */}
                    <div className={`${COL.fromDate}    px-2 py-2 truncate bg-blue-50/30 border-r border-blue-100`}>{fmt(tx.fromTenantDate)}</div>
                    <div className={`${COL.fromMode}    px-2 py-2 truncate bg-blue-50/30 border-r border-blue-100`}>{val(tx.fromTenantMode)}</div>
                    <div className={`${COL.otherDebit}  px-2 py-2 truncate bg-blue-50/30 border-r border-blue-100`}>{money(tx.fromTenantOtherDebit)}</div>
                    <div className={`${COL.benefit1}    px-2 py-2 truncate bg-blue-50/30 border-r border-blue-100`}>{money(tx.fromTenantHBenefit1)}</div>
                    <div className={`${COL.benefit2}    px-2 py-2 truncate bg-blue-50/30 border-r border-blue-100`}>{money(tx.fromTenantHBenefit2)}</div>
                    <div className={`${COL.rentRecv}    px-2 py-2 truncate bg-blue-50/30 border-r border-blue-100`}>{money(tx.fromTenantRentReceived)}</div>
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
                    <div className={`${COL.toRentRecv}      px-2 py-2 truncate bg-amber-50/30 border-r border-amber-100`}>{money(tx.toLandlordRentReceived)}</div>
                    <div className={`${COL.leaseMgmtFees}   px-2 py-2 truncate bg-amber-50/30 border-r border-amber-100`}>{money(tx.toLandlordLessManagementFees)}</div>
                    <div className={`${COL.buildingExp}     px-2 py-2 truncate bg-amber-50/30 border-r border-amber-100`}>{money(tx.toLandlordLessBuildingExpenditure)}</div>
                    <div className={`${COL.netReceived}     px-2 py-2 truncate bg-amber-50/30 border-r border-amber-100`}>{money(tx.toLandlordNetReceived)}</div>
                    <div className={`${COL.lessVAT}         px-2 py-2 truncate bg-amber-50/30 border-r border-amber-100`}>{money(tx.toLandlordLessVAT)}</div>
                    <div className={`${COL.netPaid}         px-2 py-2 truncate bg-amber-50/30 border-r border-amber-100`}>{money(tx.toLandlordNetPaid)}</div>
                    <div className={`${COL.chequeNo}        px-2 py-2 truncate bg-amber-50/30 border-r border-amber-100`}>{val(tx.toLandlordChequeNo)}</div>
                    <div className={`${COL.defaultExp}      px-2 py-2 truncate bg-amber-50/30 border-r border-amber-100`}>{val(tx.toLandlordDefaultExpenditure)}</div>
                    <div className={`${COL.expDesc}         px-2 py-2 truncate bg-amber-50/30 border-r border-amber-100`} title={tx.toLandlordExpenditureDescription}>{val(tx.toLandlordExpenditureDescription)}</div>
 {/* Meta */}
                    <div className={`${COL.branch}  px-2 py-2 truncate border-r border-gray-200`}>{val(tx.Branch)}</div>
                    <div className={`${COL.status}  px-2 py-2 flex items-center border-r border-gray-200`}>
                      <Badge
                        variant={tx.status === StatusTransaction.DRAFT ? "destructive" : "default"}
                        className="text-xs"
                      >
                        {tx.status === StatusTransaction.DRAFT ? "DRAFT" : "ACTIVE"}
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
                          <DropdownMenuItem onClick={() => handleEdit(tx)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          {tx.status === StatusTransaction.DRAFT && (
                            <DropdownMenuItem onClick={() => handlePublish(tx.id, tx.propertyId)}>
                              <Eye className="mr-2 h-4 w-4" /> Publish
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(tx.id, tx.propertyId)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Totals row ── */}
              {summary && (
                <div className={`flex text-xs font-semibold bg-gray-800 text-white ${TABLE_MIN_W}`}>
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
                  <div className={`${COL.status}          px-2 py-2`} />
                  <div className={`${COL.actions}         px-2 py-2`} />
                </div>
              )}

            </div>
          </div>

          {/* ── Pagination ── */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-gray-600">
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
            {statusFilter === "all" ? "No transactions found" : `No ${statusFilter} transactions`}
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
