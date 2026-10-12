import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Clock, FileQuestion, Search, ShieldCheck } from "lucide-react";
import { get } from "@/helper/api";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPropertyReference } from "@/utils/propertyReference";

type Status = "EXPIRED" | "EXPIRING" | "MISSING" | "VALID" | "NO_EXPIRY";

type Row = {
  id: string;
  propertyId: string;
  propertyNumber: number | null;
  address: string | null;
  town: string | null;
  postCode: string | null;
  docType: string;
  typeLabel: string;
  expiryDate: string | null;
  daysLeft: number | null;
  status: Status;
};

type Overview = {
  expiringSoonDays: number;
  totalProperties: number;
  summary: { expired: number; expiring: number; missing: number; valid: number };
  byType: { docType: string; label: string; total: number; expired: number; expiring: number; missing: number }[];
  rows: Row[];
};

const STATUS_META: Record<Status, { label: string; badge: string }> = {
  EXPIRED: { label: "Expired", badge: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300" },
  EXPIRING: { label: "Expiring Soon", badge: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300" },
  MISSING: { label: "Missing", badge: "bg-slate-200 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300" },
  VALID: { label: "Valid", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
  NO_EXPIRY: { label: "No expiry date", badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" },
};

// "attention" = everything that needs action; the default view.
type Filter = "attention" | "EXPIRED" | "EXPIRING" | "MISSING" | "VALID" | "all";
const PAGE_SIZE = 8;

const fmtDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function daysLeftLabel(row: Row) {
  if (row.daysLeft === null) return "—";
  if (row.daysLeft < 0) return `${-row.daysLeft}d overdue`;
  if (row.daysLeft === 0) return "Today";
  return `${row.daysLeft}d`;
}

// Compliance page: certificate status across all published properties.
export default function ComplianceOverview() {
  const navigate = useNavigate();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("attention");
  const [type, setType] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    get<Overview>("dashboard/compliance").then(({ data: result, error: err }) => {
      if (err) setError(err.message);
      if (result) setData(result);
    });
  }, []);

  const rows = useMemo(() => {
    if (!data) return [];
    const term = search.trim().toLowerCase();
    return data.rows.filter((r) => {
      const statusOk =
        filter === "all" ? true
          : filter === "attention" ? r.status === "EXPIRED" || r.status === "EXPIRING" || r.status === "MISSING"
          : filter === "VALID" ? r.status === "VALID" || r.status === "NO_EXPIRY"
          : r.status === filter;
      const typeOk = type === "all" || r.docType === type;
      const termOk = !term || [r.address, r.town, r.postCode, r.typeLabel, formatPropertyReference(r.propertyNumber ?? undefined)]
        .some((v) => String(v || "").toLowerCase().includes(term));
      return statusOk && typeOk && termOk;
    });
  }, [data, filter, type, search]);

  useEffect(() => setPage(1), [filter, type, search]);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const visible = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const cards: { key: Filter; label: string; value: number; hint: string; icon: typeof AlertCircle; tone: string }[] = data ? [
    { key: "EXPIRED", label: "Expired", value: data.summary.expired, hint: "Requires immediate action", icon: AlertCircle, tone: "border-red-200 bg-red-50/70 text-red-600 dark:border-red-500/30 dark:bg-red-500/5" },
    { key: "EXPIRING", label: `Expiring within ${data.expiringSoonDays} days`, value: data.summary.expiring, hint: "Action required soon", icon: Clock, tone: "border-amber-200 bg-amber-50/70 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/5" },
    { key: "MISSING", label: "Missing", value: data.summary.missing, hint: "No certificate on file", icon: FileQuestion, tone: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-500/30 dark:bg-slate-500/5" },
    { key: "VALID", label: "Compliant", value: data.summary.valid, hint: "No action required", icon: CheckCircle2, tone: "border-emerald-200 bg-emerald-50/70 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/5" },
  ] : [];

  return (
    <DashboardLayout>
    <div className="mx-auto max-w-[1400px] space-y-5">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-1 h-8 w-8 shrink-0 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Compliance</h1>
          <p className="text-sm text-muted-foreground">
            Monitor property compliance certificates across {data?.totalProperties ?? "—"} published properties. Most urgent first.
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">Could not load compliance: {error}</p>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ key, label, value, hint, icon: Icon, tone }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter((f) => (f === key ? "attention" : key))}
            className={`flex items-center gap-3 rounded-lg border p-4 text-left transition hover:shadow-sm ${tone} ${filter === key ? "ring-2 ring-current" : ""}`}
          >
            <Icon className="h-8 w-8 shrink-0" />
            <span className="min-w-0">
              <span className="block text-xs font-semibold">{label}</span>
              <span className="block text-2xl font-semibold text-foreground">{value}</span>
              <span className="block text-xs text-muted-foreground">{hint}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Per certificate type; clicking one filters the table to that type. */}
      {!!data?.byType.length && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          {data.byType.map((t) => (
            <button
              key={t.docType}
              type="button"
              onClick={() => setType((current) => (current === t.docType ? "all" : t.docType))}
              className={`surface p-4 text-left transition hover:shadow-sm ${type === t.docType ? "ring-2 ring-primary" : ""}`}
            >
              <span className="block font-medium">{t.label}</span>
              <span className="block text-xs text-muted-foreground">{t.total} certificate{t.total === 1 ? "" : "s"} on file</span>
              <span className="mt-2 flex flex-wrap gap-x-2 text-xs">
                <span className={t.expired ? "text-red-600" : "text-muted-foreground"}>{t.expired} expired</span>
                <span className={t.expiring ? "text-amber-700" : "text-muted-foreground"}>{t.expiring} expiring</span>
                {t.missing > 0 && <span className="text-slate-600 dark:text-slate-300">{t.missing} missing</span>}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="surface space-y-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[14rem] flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search by property, address or postcode…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="attention">Needs attention</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
            <SelectItem value="EXPIRING">Expiring soon</SelectItem>
            <SelectItem value="MISSING">Missing</SelectItem>
            <SelectItem value="VALID">Compliant</SelectItem>
            <SelectItem value="all">All certificates</SelectItem>
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All certificate types</SelectItem>
            {data?.byType.map((t) => <SelectItem key={t.docType} value={t.docType}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Property</th>
              <th className="px-4 py-2.5 font-medium">Certificate</th>
              <th className="px-4 py-2.5 font-medium">Expiry Date</th>
              <th className="px-4 py-2.5 text-right font-medium">Days Left</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-2.5">
                  <span className="block font-medium">{r.address || "Unnamed property"}</span>
                  <span className="text-xs text-muted-foreground">{formatPropertyReference(r.propertyNumber ?? undefined)}{r.postCode ? ` · ${r.postCode}` : ""}</span>
                </td>
                <td className="px-4 py-2.5">{r.typeLabel}</td>
                <td className="px-4 py-2.5">{fmtDate(r.expiryDate)}</td>
                <td className={`px-4 py-2.5 text-right font-medium ${r.status === "EXPIRED" ? "text-red-600" : r.status === "EXPIRING" ? "text-amber-700" : "text-muted-foreground"}`}>{daysLeftLabel(r)}</td>
                <td className="px-4 py-2.5"><span className={`rounded-md px-2 py-1 text-xs font-medium ${STATUS_META[r.status].badge}`}>{STATUS_META[r.status].label}</span></td>
                <td className="px-4 py-2.5 text-right">
                  <Button size="sm" variant="outline" className="h-7" onClick={() => navigate(`/properties/${r.propertyId}`)}>
                    {r.status === "MISSING" ? "Upload" : "View"}
                  </Button>
                </td>
              </tr>
            ))}
            {!visible.length && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                {!data && !error ? "Loading…" : filter === "attention" ? "Nothing needs attention — every certificate is in date." : "No certificates match."}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {rows.length > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, rows.length)} of {rows.length}</span>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <span>Page {page} of {totalPages}</span>
            <Button size="icon" variant="outline" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
      </div>
    </div>
    </DashboardLayout>
  );
}
