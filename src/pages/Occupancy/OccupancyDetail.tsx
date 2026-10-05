import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Building2, CalendarDays, ClipboardList, FileText, Home, Loader2, Plus, Trash2, User, Users } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { del, get, patch, post } from "@/helper/api";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useOccupancyMeta } from "./useOccupancyMeta";
import {
  Occupancy,
  OccupancyStatus,
  OccupancyTask,
  SHOW_TASKS,
  addressSub,
  estimatedIncome,
  fileUrl,
  fmtDate,
  formatRate,
  fullName,
  money,
  payerName,
  payerSub,
  staffName,
  statusOf,
  toneBadge,
  toneOutline,
  typeOf,
} from "./occupancyShared";

const today = () => new Date().toISOString().slice(0, 10);

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="contents">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium break-words">{value}</dd>
    </div>
  );
}

function Card({ icon: Icon, title, children, action }: { icon: any; title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="surface p-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="flex-1 font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function OccupancyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const meta = useOccupancyMeta();
  const { isAdmin } = useAuth();
  const [occupancy, setOccupancy] = useState<Occupancy | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingStatus, setPendingStatus] = useState<OccupancyStatus | null>(null);
  const [statusDate, setStatusDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [newTask, setNewTask] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await get<Occupancy>(`occupancy/${id}`);
    if (error) toast.error(error.message);
    setOccupancy(data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !occupancy) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center text-muted-foreground">{loading ? "Loading..." : "Occupancy not found."}</div>
      </DashboardLayout>
    );
  }

  const o = occupancy;
  const status = statusOf(meta, o.status);
  const type = typeOf(meta, o.type);
  const tasks = o.tasks || [];
  const done = tasks.filter((t) => t.isCompleted).length;
  const income = estimatedIncome(o.rateAmount, o.rateFrequency, o.moveInDate, o.actualMoveOutDate || o.expectedMoveOutDate);
  // Which actions to offer comes from the backend's allowed transitions.
  const nextStatuses = (status?.next ?? []).map((s) => statusOf(meta, s)!).filter(Boolean);

  const openStatus = (s: OccupancyStatus) => {
    setPendingStatus(s);
    setStatusDate(s === "ENDING" ? (o.expectedMoveOutDate || "").slice(0, 10) : s === "ENDED" ? today() : "");
  };

  const confirmStatus = async () => {
    if (!pendingStatus) return;
    setSaving(true);
    const body: Record<string, string> = { status: pendingStatus };
    if (pendingStatus === "ENDING") body.expectedMoveOutDate = statusDate;
    if (pendingStatus === "ENDED" && statusDate) body.actualMoveOutDate = statusDate;
    const { error } = await patch(`occupancy/${o.id}/status`, body);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`Status changed to ${statusOf(meta, pendingStatus)?.label}`);
    setPendingStatus(null);
    load();
  };

  const toggleTask = async (task: OccupancyTask, isCompleted: boolean) => {
    setOccupancy({ ...o, tasks: tasks.map((t) => (t.id === task.id ? { ...t, isCompleted } : t)) });
    const { error } = await patch(`occupancy/tasks/${task.id}`, { isCompleted });
    if (error) {
      toast.error(error.message);
      load();
    }
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    const { error } = await post(`occupancy/${o.id}/tasks`, { title: newTask.trim() });
    if (error) return toast.error(error.message);
    setNewTask("");
    load();
  };

  const removeTask = async (task: OccupancyTask) => {
    const { error } = await del(`occupancy/tasks/${task.id}`);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async () => {
    if (!window.confirm(`Delete occupancy ${o.reference}? This can't be undone from the app.`)) return;
    const { error } = await del(`occupancy/${o.id}`);
    if (error) return toast.error(error.message);
    toast.success("Occupancy deleted");
    navigate("/occupancy");
  };

  const pendingMeta = statusOf(meta, pendingStatus);
  const needsDate = pendingStatus === "ENDING";

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Button variant="ghost" size="sm" className="-ml-2 mb-1" onClick={() => navigate("/occupancy")}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Occupancy
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="hero-stat text-[2rem]">{o.property?.addressLine1 || "Occupancy"}</h1>
              <span className={cn("rounded-md px-2.5 py-1 text-xs font-medium", toneBadge(status?.tone))}>{status?.label ?? o.status}</span>
              <span className={cn("rounded border px-2 py-0.5 text-xs font-medium", toneOutline(type?.tone))}>{type?.label ?? o.type}</span>
            </div>
            <p className="hero-meta">{o.reference} · {addressSub(o.property)} · created {fmtDate(o.createdAt)}{o.createdByName ? ` by ${o.createdByName}` : ""}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {nextStatuses.map((s) => (
              <Button key={s.value} variant={s.value === "CANCELLED" ? "outline" : "default"} onClick={() => openStatus(s.value)}>
                {s.actionLabel}
              </Button>
            ))}
            {isAdmin && (
              <Button variant="ghost" size="icon" onClick={remove} aria-label="Delete occupancy">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card icon={Home} title="Property">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <Row label="Address" value={o.property?.addressLine1} />
              <Row label="Area" value={addressSub(o.property)} />
              <Row label="Type" value={o.property?.propertyTypeCategory} />
              <Row label="Bedrooms" value={o.property?.bedrooms} />
              <Row label="Landlord" value={[o.property?.vendor?.firstName, o.property?.vendor?.lastName].filter(Boolean).join(" ")} />
            </dl>
            <Button variant="link" className="px-0" onClick={() => navigate(`/properties/${o.propertyId}`)}>Open property</Button>
          </Card>

          <Card icon={o.type === "COUNCIL" ? Building2 : User} title={o.type === "COUNCIL" ? "Council Customer (Payer)" : "Private Customer (Payer)"}>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <Row label={o.type === "COUNCIL" ? "Council" : "Customer"} value={`${payerName(o)} ${payerSub(o)}`.trim()} />
              {o.type === "COUNCIL" ? (
                <>
                  <Row label="Contact" value={o.councilContactName} />
                  <Row label="Reference" value={o.councilReference} />
                  <Row label="Team" value={o.councilTeam} />
                  <Row label="Email" value={o.councilCustomer?.email} />
                  <Row label="Phone" value={o.councilCustomer?.phone} />
                </>
              ) : (
                <>
                  <Row label="Email" value={o.customerEmail} />
                  <Row label="Phone" value={o.customerPhone} />
                  <Row label="Address" value={[o.customerAddressLine1, o.customerTown, o.customerPostCode].filter(Boolean).join(", ")} />
                </>
              )}
            </dl>
            {!!o.customerDocuments?.length && (
              <ul className="mt-3 space-y-1 text-sm">
                {o.customerDocuments.map((d) => (
                  <li key={d.fileUrl}>
                    <a href={fileUrl(d.fileUrl)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:underline">
                      <FileText className="h-3.5 w-3.5" /> {d.fileName || "Document"}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card icon={Users} title="Occupier">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <Row label="Name" value={fullName(o.occupier, true)} />
              <Row label="DOB" value={o.occupier?.dateOfBirth ? fmtDate(o.occupier.dateOfBirth) : ""} />
              <Row label="Phone" value={o.occupier?.MobileNo} />
              <Row label="Email" value={o.occupier?.Email} />
              <Row label="Portal" value={o.occupier?.Email ? "Has login" : "No email — no portal access"} />
            </dl>
            {!!o.additionalOccupiers?.length && (
              <div className="mt-3">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Household (+{o.additionalOccupiers.length})</p>
                <ul className="space-y-0.5 text-sm">
                  {o.additionalOccupiers.map((m, i) => (
                    <li key={i}>{m.name}{m.relationship ? ` · ${m.relationship}` : ""}{m.dateOfBirth ? ` · ${fmtDate(m.dateOfBirth)}` : ""}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <Card icon={CalendarDays} title="Dates & Rate">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <Row label="Move In" value={fmtDate(o.moveInDate)} />
              <Row label="Expected Move Out" value={o.expectedMoveOutDate ? fmtDate(o.expectedMoveOutDate) : "Not set"} />
              <Row label="Moved Out" value={o.actualMoveOutDate ? fmtDate(o.actualMoveOutDate) : ""} />
              <Row label="Rate" value={formatRate(meta, o.rateAmount, o.rateFrequency)} />
              <Row label="Estimated Income" value={income != null ? money(income) : "-"} />
            </dl>
          </Card>

          <Card icon={CalendarDays} title="Booking-In Appointment">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <Row label="Assigned To" value={staffName(o.bookingAssignedTo) || "Unassigned"} />
              <Row label="Date" value={fmtDate(o.bookingDate)} />
              <Row label="Time" value={o.bookingTime} />
              <Row label="Notes" value={o.bookingNotes} />
            </dl>
          </Card>

          {SHOW_TASKS && <Card icon={ClipboardList} title={`Tasks (${done}/${tasks.length})`}>
            <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${tasks.length ? (done / tasks.length) * 100 : 0}%` }} />
            </div>
            <ul className="space-y-2">
              {tasks.map((t) => (
                <li key={t.id} className="group flex items-start gap-2.5 text-sm">
                  <Checkbox id={t.id} className="mt-0.5" checked={t.isCompleted} onCheckedChange={(v) => toggleTask(t, !!v)} />
                  <label htmlFor={t.id} className={cn("flex-1 cursor-pointer leading-snug", t.isCompleted && "text-muted-foreground line-through")}>
                    {t.title}
                    {t.isCompleted && t.completedByName && <span className="block text-xs no-underline">by {t.completedByName}</span>}
                  </label>
                  <button className="opacity-0 group-hover:opacity-100 focus:opacity-100" onClick={() => removeTask(t)} aria-label={`Remove ${t.title}`}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <Input placeholder="Add a task..." value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()} />
              <Button variant="outline" size="icon" onClick={addTask} disabled={!newTask.trim()} aria-label="Add task"><Plus className="h-4 w-4" /></Button>
            </div>
          </Card>}
        </div>

        {!!o.activity?.length && (
          <section className="surface p-5">
            <h2 className="mb-3 font-semibold">Activity</h2>
            <ul className="space-y-2.5">
              {o.activity.map((a) => (
                <li key={a.id} className="flex gap-2.5 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <span className="flex-1">{a.title}</span>
                  <span className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString("en-GB")}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <Dialog open={!!pendingStatus} onOpenChange={(open) => !open && setPendingStatus(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pendingMeta?.actionLabel}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {pendingMeta?.description}. The occupier{o.occupier?.Email ? " and Woodland's inbox" : ""} will be notified by email.
          </p>
          {(pendingStatus === "ENDING" || pendingStatus === "ENDED") && (
            <div className="space-y-1.5">
              <Label>{needsDate ? "Expected move-out date" : "Move-out date"}{needsDate && <span className="text-destructive"> *</span>}</Label>
              <Input type="date" min={o.moveInDate.slice(0, 10)} value={statusDate} onChange={(e) => setStatusDate(e.target.value)} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingStatus(null)}>Cancel</Button>
            <Button onClick={confirmStatus} disabled={saving || (needsDate && !statusDate)}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
