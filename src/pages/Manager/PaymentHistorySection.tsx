import { useEffect, useMemo, useState } from "react";
import { Download, ArrowDownCircle, ArrowUpCircle, Receipt, Scale, TrendingUp } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_COOKIE_GETTER } from "@/helper/Cookie";
import getApi from "@/helper/getApi";
import { useTheme } from "@/context/ThemeContext";

const money = (value: unknown) => {
  const n = Number(value || 0);
  return `${n < 0 ? "-" : ""}£${Math.abs(n).toLocaleString("en-GB", { minimumFractionDigits: 2 })}`;
};

type RowType = "Income" | "Landlord Payment" | "Expense";

interface PaymentRow {
  id: string;
  date?: string;
  type: RowType;
  category: string;
  description: string;
  reference: string;
  counterparty: string;
  amount: number;
  status: string;
  method: string;
}

const TYPE_BADGE: Record<RowType, string> = {
  Income: "bg-emerald-100 text-emerald-700 border-transparent",
  "Landlord Payment": "bg-blue-100 text-blue-700 border-transparent",
  Expense: "bg-orange-100 text-orange-700 border-transparent",
};

const STATUS_LABEL: Record<string, string> = { ACTIVE: "Ready", DRAFT: "Draft", PENDING: "Hold", APPROVAL_REQUIRED: "Approval", PAID: "Paid" };
const STATUS_BADGE: Record<string, string> = {
  PAID: "bg-violet-100 text-violet-700 border-transparent",
  ACTIVE: "bg-emerald-100 text-emerald-700 border-transparent",
  PENDING: "bg-orange-100 text-orange-700 border-transparent",
  APPROVAL_REQUIRED: "bg-red-100 text-red-700 border-transparent",
  DRAFT: "bg-slate-100 text-slate-700 border-transparent",
};

// Each Transaction is a combined tenant-receipt + landlord-payment record
// (plus child adjustments) — there's no row-level type on the API, so a
// "payment history" log of separate Income/Landlord Payment/Expense lines
// has to be built by splitting each transaction into up to 2 + N rows here.
function splitIntoRows(transactions: any[]): PaymentRow[] {
  const rows: PaymentRow[] = [];
  for (const t of transactions) {
    const status = t.status || "ACTIVE";
    if (t.fromTenantRentReceived || t.fromTenantOtherDebit || t.fromTenantHBenefit1 || t.fromTenantHBenefit2) {
      const amount = Number(t.fromTenantRentReceived || 0) + Number(t.fromTenantOtherDebit || 0) + Number(t.fromTenantHBenefit1 || 0) + Number(t.fromTenantHBenefit2 || 0);
      rows.push({
        id: `${t.id}-income`,
        date: t.fromTenantDate,
        type: "Income",
        category: "Rent Payment",
        description: t.fromTenantDescription || "Rent received from tenant",
        reference: t.reference || String(t.tranid ?? ""),
        counterparty: t.fromTenantReceivedBy || "Tenant",
        amount,
        status,
        method: t.fromTenantMode || "-",
      });
    }
    if (t.toLandlordNetPaid) {
      rows.push({
        id: `${t.id}-landlord`,
        date: t.toLandlordDate,
        type: "Landlord Payment",
        category: "Rent Payment",
        description: t.toLandlordExpenditureDescription || "Payment to landlord",
        reference: t.reference || String(t.tranid ?? ""),
        counterparty: t.toLandlordPaidBy || "Landlord",
        amount: -Number(t.toLandlordNetPaid || 0),
        status,
        method: t.toLandLordMode || "-",
      });
    }
    for (const adj of t.adjustments || []) {
      const amount = Number(adj.amount || 0);
      if (amount >= 0) continue;
      rows.push({
        id: `${t.id}-adj-${adj.id}`,
        date: t.toLandlordDate || t.fromTenantDate,
        type: "Expense",
        category: adj.type || "Other",
        description: adj.description || adj.relatedTo || adj.type || "Expense",
        reference: t.reference || String(t.tranid ?? ""),
        counterparty: adj.relatedTo || "-",
        amount,
        status,
        method: "-",
      });
    }
  }
  return rows.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
}

const TYPE_FILTERS: Array<{ label: string; value: "all" | RowType }> = [
  { label: "All Types", value: "all" },
  { label: "Income / Receipts", value: "Income" },
  { label: "Landlord Payments", value: "Landlord Payment" },
  { label: "Expenses", value: "Expense" },
];

export default function PaymentHistorySection({ propertyId }: { propertyId: string }) {
  const { brandColors } = useTheme();
  const hsl = (value: string) => `hsl(${value})`;
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<"all" | RowType>("all");
  // Every transaction linked to this property is fetched and shown in the
  // table regardless of status, but the KPI tiles/chart total only PAID
  // (approved) ones — draft/pending amounts aren't real income/expense yet.
  const [statusFilter, setStatusFilter] = useState<"PAID" | "all">("PAID");

  useEffect(() => {
    if (!propertyId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const token = await DEFAULT_COOKIE_GETTER("access_token");
      const data: any = await getApi("transaction", `?propertyId=${propertyId}&skip=0&take=500`, { Authorization: `Bearer ${token}` });
      if (cancelled) return;
      const transactions = Array.isArray(data) ? data : data?.transactions || data?.data || [];
      setRows(splitIntoRows(transactions));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [propertyId]);

  const paidRows = useMemo(() => rows.filter((r) => r.status === "PAID"), [rows]);

  const totals = useMemo(() => {
    const income = paidRows.filter((r) => r.type === "Income").reduce((s, r) => s + r.amount, 0);
    const landlord = paidRows.filter((r) => r.type === "Landlord Payment").reduce((s, r) => s + Math.abs(r.amount), 0);
    const expenses = paidRows.filter((r) => r.type === "Expense").reduce((s, r) => s + Math.abs(r.amount), 0);
    const net = income - landlord - expenses;
    const months = new Set(paidRows.filter((r) => r.date).map((r) => new Date(r.date!).toISOString().slice(0, 7)));
    const avgMonthlyMargin = months.size ? net / months.size : 0;
    return { income, landlord, expenses, net, avgMonthlyMargin };
  }, [paidRows]);

  const breakdown = [
    { name: "Income / Receipts", value: totals.income, color: hsl(brandColors.success) },
    { name: "Landlord Payments", value: totals.landlord, color: hsl(brandColors.primary) },
    { name: "Expenses", value: totals.expenses, color: hsl(brandColors.warning) },
  ].filter((item) => item.value > 0);
  const breakdownTotal = breakdown.reduce((s, item) => s + item.value, 0);

  const visibleRows = rows
    .filter((r) => typeFilter === "all" || r.type === typeFilter)
    .filter((r) => statusFilter === "all" || r.status === statusFilter);

  const exportCsv = () => {
    const header = ["Date", "Type", "Category", "Description", "Reference", "Paid To / Received From", "Amount", "Status", "Payment Method"];
    const lines = visibleRows.map((r) => [
      r.date ? new Date(r.date).toLocaleDateString("en-GB") : "",
      r.type,
      r.category,
      r.description,
      r.reference,
      r.counterparty,
      r.amount.toFixed(2),
      STATUS_LABEL[r.status] || r.status,
      r.method,
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "payment-history.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <p className="p-6 text-sm text-muted-foreground">Loading payment history…</p>;
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="surface p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-emerald-600"><ArrowDownCircle className="h-4 w-4" />Total Received (Income)</div>
          <div className="text-xl font-semibold">{money(totals.income)}</div>
          <div className="text-xs text-muted-foreground">{paidRows.filter((r) => r.type === "Income").length} payments</div>
        </div>
        <div className="surface p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-blue-600"><ArrowUpCircle className="h-4 w-4" />Total Paid (Landlord)</div>
          <div className="text-xl font-semibold">{money(totals.landlord)}</div>
          <div className="text-xs text-muted-foreground">{paidRows.filter((r) => r.type === "Landlord Payment").length} payments</div>
        </div>
        <div className="surface p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-orange-600"><Receipt className="h-4 w-4" />Total Expenses</div>
          <div className="text-xl font-semibold">{money(totals.expenses)}</div>
          <div className="text-xs text-muted-foreground">{paidRows.filter((r) => r.type === "Expense").length} payments</div>
        </div>
        <div className="surface p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-violet-600"><Scale className="h-4 w-4" />Net Position</div>
          <div className={`text-xl font-semibold ${totals.net >= 0 ? "text-emerald-600" : "text-red-600"}`}>{money(totals.net)}</div>
          <div className="text-xs text-muted-foreground">{totals.net >= 0 ? "Profit" : "Loss"}</div>
        </div>
        <div className="surface p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-slate-600"><TrendingUp className="h-4 w-4" />Avg. Monthly Margin</div>
          <div className="text-xl font-semibold">{money(totals.avgMonthlyMargin)}</div>
          <div className="text-xs text-muted-foreground">margin</div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="surface overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
            <div>
              <h2 className="font-semibold">Payment History</h2>
              <p className="text-xs text-muted-foreground">All transactions linked to this property</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {TYPE_FILTERS.map((f) => (
                <Button key={f.value} size="sm" variant={typeFilter === f.value ? "default" : "outline"} onClick={() => setTypeFilter(f.value)}>{f.label}</Button>
              ))}
              <Button size="sm" variant={statusFilter === "PAID" ? "default" : "outline"} onClick={() => setStatusFilter(statusFilter === "PAID" ? "all" : "PAID")}>
                {statusFilter === "PAID" ? "Paid only" : "All statuses"}
              </Button>
              <Button size="sm" variant="outline" onClick={exportCsv}><Download className="mr-1.5 h-3.5 w-3.5" />Export</Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  {["Date", "Type", "Category", "Description", "Reference", "Paid To / Received From", "Amount", "Status", "Payment Method"].map((h) => (
                    <th key={h} className="px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3 whitespace-nowrap">{r.date ? new Date(r.date).toLocaleDateString("en-GB") : "-"}</td>
                    <td className="px-4 py-3"><Badge className={TYPE_BADGE[r.type]}>{r.type}</Badge></td>
                    <td className="px-4 py-3">{r.category}</td>
                    <td className="px-4 py-3 max-w-[200px] truncate" title={r.description}>{r.description}</td>
                    <td className="px-4 py-3 font-mono text-xs">{r.reference}</td>
                    <td className="px-4 py-3">{r.counterparty}</td>
                    <td className={`px-4 py-3 font-semibold whitespace-nowrap ${r.amount < 0 ? "text-red-600" : "text-emerald-600"}`}>{money(r.amount)}</td>
                    <td className="px-4 py-3"><Badge className={STATUS_BADGE[r.status] || "bg-slate-100 text-slate-700 border-transparent"}>{STATUS_LABEL[r.status] || r.status}</Badge></td>
                    <td className="px-4 py-3">{r.method}</td>
                  </tr>
                ))}
                {!visibleRows.length && (
                  <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">No transactions found for this property.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-5">
          <div className="surface p-5">
            <h2 className="font-semibold">Payment Summary</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Income / Receipts</dt><dd className="font-medium text-emerald-600">{money(totals.income)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Landlord Payments</dt><dd className="font-medium text-red-600">-{money(totals.landlord)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Expenses</dt><dd className="font-medium text-red-600">-{money(totals.expenses)}</dd></div>
              <div className="flex justify-between border-t pt-2 font-semibold"><dt>Net Position</dt><dd className={totals.net >= 0 ? "text-emerald-600" : "text-red-600"}>{money(totals.net)}</dd></div>
            </dl>
          </div>

          <div className="surface p-5">
            <h2 className="font-semibold">Breakdown by Type</h2>
            <div className="relative h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={breakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={2}>
                    {breakdown.map((item) => <Cell key={item.name} fill={item.color} />)}
                  </Pie>
                  <Tooltip formatter={(value: any, name: any) => [money(value), name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-semibold">{money(breakdownTotal)}</span>
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              {breakdown.map((item) => {
                const pct = breakdownTotal ? (item.value / breakdownTotal) * 100 : 0;
                return (
                  <div key={item.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span>
                    <span className="text-muted-foreground">{pct.toFixed(1)}%</span>
                  </div>
                );
              })}
              {!breakdown.length && <p className="text-center text-muted-foreground">No paid transactions to chart yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
