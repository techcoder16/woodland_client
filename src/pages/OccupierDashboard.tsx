import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, CalendarDays, CheckCircle2, Circle, Home, User, Users, Wrench } from "lucide-react";
import PartyDashboardLayout from "@/components/layout/PartyDashboardLayout";
import { Button } from "@/components/ui/button";
import { partyGet } from "@/helper/partyAuth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Occupancy,
  OccupancyMeta,
  Occupier,
  SHOW_TASKS,
  addressSub,
  fmtDate,
  formatRate,
  fullName,
  loadOccupancyMeta,
  statusOf,
  toneBadge,
  typeOf,
} from "./Occupancy/occupancyShared";

interface MyOccupancy {
  occupier: Occupier | null;
  isActive: boolean;
  current: Occupancy | null;
  history: Occupancy[];
}

function Tile({ icon: Icon, label, value, sub }: { icon: any; label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="surface p-4 flex items-start gap-3">
      <div className="rounded-lg bg-primary/10 p-2 text-primary"><Icon className="h-5 w-5" /></div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold truncate">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

// The occupier's home screen: which type of occupancy they're on (Council or
// Private), their property, dates, booking-in and handover progress.
export default function OccupierDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<MyOccupancy | null>(null);
  const [meta, setMeta] = useState<OccupancyMeta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOccupancyMeta(() => partyGet<OccupancyMeta>("tenant", "occupancy/meta").catch(() => null)).then(setMeta);
    partyGet<MyOccupancy>("tenant", "occupancy/my")
      .then(setData)
      .catch(() => toast.error("Failed to load your occupancy"))
      .finally(() => setLoading(false));
  }, []);

  const o = data?.current;
  const type = typeOf(meta, o?.type ?? data?.occupier?.occupierType);
  const status = statusOf(meta, o?.status);
  const tasks = o?.tasks || [];
  const done = tasks.filter((t) => t.isCompleted).length;

  return (
    <PartyDashboardLayout kind="tenant">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back{data?.occupier?.FirstName ? `, ${data.occupier.FirstName}` : ""}</p>
            <h1 className="hero-stat text-[2rem]">My Home</h1>
          </div>
          {type && (
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-sm font-semibold text-primary">
              {type.value === "COUNCIL" ? <Users className="h-4 w-4" /> : <User className="h-4 w-4" />}
              {type.longLabel}
            </span>
          )}
        </div>

        {loading ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Loading...</p>
        ) : !o ? (
          <div className="surface p-10 text-center space-y-2">
            <Home className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="font-medium">You don't have an active occupancy</p>
            <p className="text-sm text-muted-foreground">Your account becomes active once Woodland links you to a property. Contact us if you think this is wrong.</p>
          </div>
        ) : (
          <>
            <section className="surface overflow-hidden">
              <div className="grid md:grid-cols-[260px_1fr]">
                <div className="flex h-48 items-center justify-center bg-muted md:h-full">
                  {o.property?.photographs && !o.property.photographs.startsWith("data:application/pdf") ? (
                    <img src={o.property.photographs} alt="Your property" className="h-full w-full object-cover" />
                  ) : (
                    <Home className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-3 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold">{o.property?.addressLine1}</h2>
                    <span className={cn("rounded-md px-2.5 py-1 text-xs font-medium", toneBadge(status?.tone))}>{status?.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{addressSub(o.property)}</p>
                  {status?.description && <p className="text-sm">{status.description}.</p>}
                  <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                    <dt className="text-muted-foreground">Reference</dt><dd>{o.reference}</dd>
                    <dt className="text-muted-foreground">Occupancy type</dt><dd>{type?.longLabel}</dd>
                    {o.type === "COUNCIL" ? (
                      <><dt className="text-muted-foreground">Arranged by</dt><dd>{o.councilCustomer?.name || "-"}</dd></>
                    ) : (
                      <><dt className="text-muted-foreground">Rent</dt><dd>{formatRate(meta, o.rateAmount, o.rateFrequency)}</dd></>
                    )}
                    {!!o.additionalOccupiers?.length && (
                      <><dt className="text-muted-foreground">Household</dt><dd>{[fullName(data?.occupier), ...o.additionalOccupiers.map((m) => m.name)].join(", ")}</dd></>
                    )}
                  </dl>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" onClick={() => navigate("/tenant/maintenance")}><Wrench className="mr-2 h-4 w-4" /> Report a repair</Button>
                    <Button size="sm" variant="outline" onClick={() => navigate("/tenant/property")}><Building2 className="mr-2 h-4 w-4" /> Property details</Button>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid gap-4 sm:grid-cols-3">
              <Tile icon={CalendarDays} label="Move-in date" value={fmtDate(o.moveInDate)} />
              <Tile icon={CalendarDays} label="Expected move-out" value={o.expectedMoveOutDate ? fmtDate(o.expectedMoveOutDate) : "Ongoing"} />
              <Tile
                icon={User}
                label="Booking-in appointment"
                value={o.bookingDate ? `${fmtDate(o.bookingDate)}${o.bookingTime ? `, ${o.bookingTime}` : ""}` : "To be arranged"}
                sub={o.bookingAssignedTo ? `with ${[o.bookingAssignedTo.first_name, o.bookingAssignedTo.last_name].filter(Boolean).join(" ")}` : undefined}
              />
            </div>

            {SHOW_TASKS && tasks.length > 0 && (
              <section className="surface p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-semibold">Move-in checklist</h2>
                  <span className="text-sm text-muted-foreground">{done} of {tasks.length} done</span>
                </div>
                <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary transition-all" style={{ width: `${(done / tasks.length) * 100}%` }} />
                </div>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {tasks.map((t, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      {t.isCompleted ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                      <span className={cn(t.isCompleted && "text-muted-foreground")}>{t.title}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}

        {!!data?.history.length && (
          <section className="surface p-5">
            <h2 className="mb-3 font-semibold">Previous occupancies</h2>
            <ul className="divide-y text-sm">
              {data.history.map((h) => (
                <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span>{h.property?.addressLine1} · {typeOf(meta, h.type)?.label}</span>
                  <span className="text-muted-foreground">{fmtDate(h.moveInDate)} – {fmtDate(h.actualMoveOutDate || h.expectedMoveOutDate)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </PartyDashboardLayout>
  );
}
