import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  DoorOpen,
  Eye,
  Home,
  LogIn,
  LogOut,
  MoreVertical,
  Plus,
  Search,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { get } from "@/helper/api";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useOccupancyMeta } from "./useOccupancyMeta";
import {
  CouncilCustomer,
  Occupancy,
  OccupancyStatus,
  OccupancyType,
  TONE_HEX,
  addressLine,
  addressSub,
  fmtDate,
  formatRate,
  fullName,
  payerName,
  payerSub,
  statusOf,
  toneBadge,
  toneOutline,
  typeOf,
} from "./occupancyShared";

interface Stats {
  total: number;
  byStatus: Record<OccupancyStatus, number>;
  endedThisYear: number;
  createdLastMonth: number;
  upcoming: { id: string; kind: "MOVE_IN" | "MOVE_OUT"; date: string; address?: string; type: OccupancyType }[];
  recent: { id: string; title: string; description: string; createdAt: string }[];
}

// A tab is "ALL", a status value, or "type:<type value>" — all
// status/type values come from the backend meta.
const TYPE_TAB = "type:";
const PAGE_SIZE = 10;

const timeAgo = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const units: [number, string][] = [[86400, "day"], [3600, "hour"], [60, "minute"]];
  for (const [secs, name] of units) {
    const n = Math.floor(s / secs);
    if (n >= 1) return `${n} ${name}${n > 1 ? "s" : ""} ago`;
  }
  return "Just now";
};

function StatCard({ icon: Icon, value, label, tone, sub }: { icon: any; value: number; label: string; tone: string; sub?: string }) {
  return (
    <div className={cn("rounded-xl border p-4 flex items-start gap-3", tone)}>
      <div className="rounded-lg bg-background/70 p-2">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="stat-figure text-2xl text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function OccupancyList() {
  const navigate = useNavigate();
  const meta = useOccupancyMeta();
  const statuses = meta?.statuses ?? [];
  const types = meta?.types ?? [];

  const [tab, setTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [councilFilter, setCouncilFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<Occupancy[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [councils, setCouncils] = useState<CouncilCustomer[]>([]);

  const isStatusTab = statuses.some((s) => s.value === tab);
  const isTypeTab = tab.startsWith(TYPE_TAB);
  // Tabs and the filter dropdowns drive the same query params; a tab wins.
  const effectiveStatus = isStatusTab ? tab : statusFilter !== "all" ? statusFilter : "";
  const effectiveType = isTypeTab ? tab.slice(TYPE_TAB.length) : typeFilter !== "all" ? typeFilter : "";

  const loadList = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (effectiveStatus) params.set("status", effectiveStatus);
    if (effectiveType) params.set("type", effectiveType);
    if (councilFilter !== "all") params.set("councilCustomerId", councilFilter);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const { data, error } = await get<{ items: Occupancy[]; total: number; totalPages: number }>(`occupancy?${params}`);
    if (error) toast.error(error.message);
    setItems(data?.items || []);
    setTotal(data?.total || 0);
    setTotalPages(data?.totalPages || 1);
    setLoading(false);
  }, [page, debouncedSearch, effectiveStatus, effectiveType, councilFilter, from, to]);

  const loadSide = useCallback(async () => {
    const [s, c] = await Promise.all([
      get<Stats>("occupancy/stats"),
      get<{ councils: CouncilCustomer[] }>("occupancy/councils"),
    ]);
    if (s.data) setStats(s.data);
    setCouncils(c.data?.councils || []);
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    loadSide();
  }, [loadSide]);

  useEffect(() => {
    setPage(1);
  }, [tab, debouncedSearch, statusFilter, typeFilter, councilFilter, from, to]);

  // Every backend status with its count; the donut hides zero slices.
  const donutRows = useMemo(
    () => statuses.map((s) => ({ key: s.value, label: s.label, color: TONE_HEX[s.tone || "gray"], value: stats?.byStatus?.[s.value] ?? 0 })),
    [statuses, stats],
  );
  const donutData = donutRows.filter((d) => d.value > 0);
  const donutTotal = donutRows.reduce((sum, d) => sum + d.value, 0);
  const pct = (n: number) => (donutTotal ? Math.round((n / donutTotal) * 100) : 0);
  const count = (s: OccupancyStatus) => stats?.byStatus?.[s] ?? 0;
  const statusLabel = (s: OccupancyStatus) => statusOf(meta, s)?.label ?? "";

  const pageNumbers = useMemo(() => {
    const pages: (number | "…")[] = [];
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pages.push(p);
      else if (pages[pages.length - 1] !== "…") pages.push("…");
    }
    return pages;
  }, [page, totalPages]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="hero-stat text-[2rem]">Occupancy</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage all property occupancies, bookings and move in/out activity</p>
          </div>
          <Button onClick={() => navigate("/occupancy/new")}>
            <Plus className="mr-2 h-4 w-4" /> Create New Occupancy
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant={tab === "ALL" ? "default" : "outline"} size="sm" onClick={() => setTab("ALL")}>
            All Occupancies
          </Button>
          {statuses.map((s) => (
            <Button key={s.value} variant={tab === s.value ? "default" : "outline"} size="sm" onClick={() => setTab(s.value)}>
              {s.label}
            </Button>
          ))}
          <span className="mx-1 hidden w-px self-stretch bg-border sm:block" />
          {types.map((t) => {
            const key = TYPE_TAB + t.value;
            return (
              <Button key={key} variant={tab === key ? "default" : "outline"} size="sm" onClick={() => setTab(tab === key ? "ALL" : key)}>
                {t.label}
              </Button>
            );
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6 min-w-0">
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
              <StatCard icon={Home} value={stats?.total ?? 0} label="Total Occupancies" tone="bg-card" sub={stats ? `${stats.createdLastMonth} new in last 30 days` : undefined} />
              <StatCard icon={Home} value={count("ACTIVE")} label={statusLabel("ACTIVE")} tone="bg-emerald-50/60 border-emerald-200/70 dark:bg-emerald-500/5 dark:border-emerald-500/20" />
              <StatCard icon={Clock} value={count("PENDING")} label={statusLabel("PENDING")} tone="bg-amber-50/60 border-amber-200/70 dark:bg-amber-500/5 dark:border-amber-500/20" />
              <StatCard icon={DoorOpen} value={count("ENDING")} label={statusLabel("ENDING")} tone="bg-blue-50/60 border-blue-200/70 dark:bg-blue-500/5 dark:border-blue-500/20" />
              <StatCard icon={Home} value={stats?.endedThisYear ?? 0} label={`${statusLabel("ENDED")} (this year)`} tone="bg-muted/40" />
            </div>

              <div className="surface">
                <div className="space-y-4 border-b border-border/70 p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by property, occupier, council or reference..."
                      className="pl-9"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Status</p>
                      <Select value={statusFilter} onValueChange={setStatusFilter} disabled={isStatusTab}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {statuses.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Occupancy Type</p>
                      <Select value={typeFilter} onValueChange={setTypeFilter} disabled={isTypeTab}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {types.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Council</p>
                      <Select value={councilFilter} onValueChange={setCouncilFilter}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {councils.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Move in from</p>
                      <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Move in to</p>
                      <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/70 text-left text-xs text-muted-foreground">
                        <th className="px-4 py-3 font-medium">Property</th>
                        <th className="px-4 py-3 font-medium">Type</th>
                        <th className="px-4 py-3 font-medium">Council / Customer (Payer)</th>
                        <th className="px-4 py-3 font-medium">Occupier / Household</th>
                        <th className="px-4 py-3 font-medium">Start Date</th>
                        <th className="px-4 py-3 font-medium">End Date</th>
                        <th className="px-4 py-3 font-medium">Rate / Rent</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">Loading...</td></tr>
                      ) : items.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-4 py-12 text-center">
                            <p className="text-muted-foreground">No occupancies found.</p>
                            <Button variant="link" onClick={() => navigate("/occupancy/new")}>Create a new occupancy</Button>
                          </td>
                        </tr>
                      ) : (
                        items.map((o) => {
                          const household = o.additionalOccupiers?.length || 0;
                          const type = typeOf(meta, o.type);
                          const status = statusOf(meta, o.status);
                          return (
                            <tr
                              key={o.id}
                              className="border-b border-border/50 hover:bg-muted/40 cursor-pointer transition-colors"
                              onClick={() => navigate(`/occupancy/${o.id}`)}
                            >
                              <td className="px-4 py-3">
                                <p className="font-medium">{addressLine(o.property)}</p>
                                <p className="text-xs text-muted-foreground">{addressSub(o.property)}</p>
                              </td>
                              <td className="px-4 py-3">
                                <span className={cn("rounded border px-2 py-0.5 text-xs font-medium", toneOutline(type?.tone))}>{type?.label ?? o.type}</span>
                              </td>
                              <td className="px-4 py-3">
                                <p>{payerName(o)}</p>
                                {payerSub(o) && <p className="text-xs text-muted-foreground">{payerSub(o)}</p>}
                              </td>
                              <td className="px-4 py-3">
                                <p>{fullName(o.occupier) || "-"}</p>
                                {household > 0 && <p className="text-xs text-muted-foreground">+{household}</p>}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">{fmtDate(o.moveInDate)}</td>
                              <td className="px-4 py-3 whitespace-nowrap">{fmtDate(o.actualMoveOutDate || o.expectedMoveOutDate)}</td>
                              <td className="px-4 py-3 whitespace-nowrap font-mono text-[13px]">{formatRate(meta, o.rateAmount, o.rateFrequency)}</td>
                              <td className="px-4 py-3">
                                <span className={cn("rounded-md px-2.5 py-1 text-xs font-medium", toneBadge(status?.tone))}>{status?.label ?? o.status}</span>
                              </td>
                              <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" aria-label="Actions"><MoreVertical className="h-4 w-4" /></Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => navigate(`/occupancy/${o.id}`)}>
                                      <Eye className="mr-2 h-4 w-4" /> View details
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    {total === 0 ? "No occupancies" : `Showing ${(page - 1) * PAGE_SIZE + 1} to ${Math.min(page * PAGE_SIZE, total)} of ${total} occupancies`}
                  </p>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Previous page">‹</Button>
                      {pageNumbers.map((p, i) =>
                        p === "…" ? (
                          <span key={`gap-${i}`} className="px-2 text-muted-foreground">…</span>
                        ) : (
                          <Button key={p} variant={p === page ? "default" : "outline"} size="sm" onClick={() => setPage(p)}>{p}</Button>
                        ),
                      )}
                      <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)} aria-label="Next page">›</Button>
                    </div>
                  )}
                </div>
              </div>
          </div>

          <aside className="space-y-4">
            <div className="surface p-4">
              <h2 className="font-semibold mb-2">Occupancy Status</h2>
              {donutTotal === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No occupancies yet.</p>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="relative h-32 w-32 shrink-0">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={donutData} dataKey="value" innerRadius={40} outerRadius={60} paddingAngle={2} stroke="none">
                          {donutData.map((d) => <Cell key={d.key} fill={d.color} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-semibold">{donutTotal}</span>
                      <span className="text-[11px] text-muted-foreground">Total</span>
                    </div>
                  </div>
                  <ul className="flex-1 space-y-1.5 text-sm">
                    {donutRows.map((d) => (
                      <li key={d.key} className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                        <span className="flex-1">{d.label}</span>
                        <span className="tabular-nums text-muted-foreground">{d.value} ({pct(d.value)}%)</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="surface p-4">
              <div className="mb-3 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-semibold flex-1">Upcoming Move In / Move Out</h2>
              </div>
              {!stats?.upcoming.length ? (
                <p className="text-sm text-muted-foreground">Nothing in the next 30 days.</p>
              ) : (
                <ul className="space-y-2.5 text-sm">
                  {stats.upcoming.map((u) => (
                    <li key={`${u.kind}-${u.id}`} className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(`/occupancy/${u.id}`)}>
                      {u.kind === "MOVE_IN" ? <LogIn className="h-4 w-4 text-emerald-600" /> : <LogOut className="h-4 w-4 text-red-600" />}
                      <span className="w-14 shrink-0 text-xs text-muted-foreground">{new Date(u.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                      <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium", toneBadge(u.kind === "MOVE_IN" ? "green" : "red"))}>
                        {u.kind === "MOVE_IN" ? "Move In" : "Move Out"}
                      </span>
                      <span className="flex-1 truncate">{u.address}</span>
                      <span className="text-xs text-muted-foreground">{typeOf(meta, u.type)?.label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="surface p-4">
              <h2 className="font-semibold mb-3">Recent Updates</h2>
              {!stats?.recent.length ? (
                <p className="text-sm text-muted-foreground">No updates yet.</p>
              ) : (
                <ul className="space-y-3">
                  {stats.recent.map((r) => (
                    <li key={r.id} className="flex gap-2.5 text-sm">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      <div className="min-w-0">
                        <p className="leading-snug">{r.title}</p>
                        <p className="text-xs text-muted-foreground">{r.description} · {timeAgo(r.createdAt)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => navigate("/council-customers")}>
                Council Customers <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}
