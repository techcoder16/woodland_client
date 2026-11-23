// Jobs that need chasing: due soon, overdue, or past their chase-up time.
// Each row has the latest notes and a box to add a chase-up note.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { InfoHint } from "@/components/ui/hint";
import { get } from "@/helper/api";
import type { JobType, ReportingStatus } from "@/redux/dataStore/jobTypeSlice";
import { useAuth } from "@/context/AuthContext";
import { Department } from "@/types/permissions";
import { priorityBadgeClass, priorityRowClass, priorityTextClass, statusBadgeClass } from "@/utils/priorityStyle";
import { formatLondonDateTime, isJobOverdue, jobDueValue } from "@/utils/maintenanceSla";
import { addJobNote, formatJobAddress, formatVisit } from "./jobActions";

const STATUS_LABELS: Partial<Record<ReportingStatus, string>> = {
  OPEN: "Open",
  WAITING_AUTHORIZATION: "Waiting Authorisation",
  QUOTING: "Quoting",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  CONTRACTOR_DONE: "Pending",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const dueKey = (job: JobType) => {
  const due = jobDueValue(job);
  const t = due ? new Date(due).getTime() : Number.POSITIVE_INFINITY;
  return isNaN(t) ? Number.POSITIVE_INFINITY : t;
};

const ChaseUp = () => {
  const { isDepartmentAdmin } = useAuth();
  const canManageMaintenance = isDepartmentAdmin(Department.Maintenance);

  const [jobs, setJobs] = useState<JobType[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await get<{ jobs: JobType[]; total: number }>("property-management/job-type/chase-up");
      if (error) throw new Error(error.message);
      setJobs(data?.jobs ?? []);
      setTotal(data?.total ?? data?.jobs?.length ?? 0);
    } catch (error) {
      toast.error(error?.message || "Failed to load the chase-up list");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sorted = useMemo(() => [...jobs].sort((a, b) => dueKey(a) - dueKey(b)), [jobs]);

  const handleAddNote = async (job: JobType) => {
    if (!job.id) return;
    const note = (drafts[job.id] ?? "").trim();
    if (!note) return;
    setSavingId(job.id);
    try {
      await addJobNote(job.id, note, "CHASE_UP");
      setDrafts((d) => ({ ...d, [job.id as string]: "" }));
      toast.success("Chase-up note added");
      await load();
    } catch (error) {
      toast.error(error?.message || "Failed to add the note");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="hero-stat text-[2rem]">Chase Up</h1>
            <p className="text-sm text-muted-foreground">
              Jobs that are due soon or overdue, earliest deadline first.
              <InfoHint text="A job appears here once it reaches its chase-up time, or when it is overdue." />
            </p>
          </div>
          <Badge variant="outline" className="border-red-300 bg-red-50 text-red-700">{total} to chase</Badge>
        </div>

        {loading ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Loading...</CardContent></Card>
        ) : sorted.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Nothing to chase up right now.</CardContent></Card>
        ) : (
          sorted.map((job) => {
            const overdue = isJobOverdue(job);
            const draft = drafts[job.id as string] ?? "";
            const latestNotes = (job.notes ?? []).slice(0, 3);
            return (
              <Card key={job.id} className={`overflow-hidden ${priorityRowClass(job.priority)}`}>
                <CardContent className="p-4 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {job.priority && <Badge variant="outline" className={priorityBadgeClass(job.priority)}>{job.priority}</Badge>}
                        <Badge variant="outline" className={statusBadgeClass(job.status)}>{STATUS_LABELS[job.status] ?? job.status}</Badge>
                        {overdue && <Badge variant="destructive">Overdue</Badge>}
                      </div>
                      <div className="font-semibold">
                        {job.jobType}{job.location ? ` Â· ${job.location}` : ""}
                      </div>
                      <div className="text-sm text-muted-foreground">{formatJobAddress(job.property)}</div>
                      {job.description && <div className="text-sm">{job.description}</div>}
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/maintenance/${job.id}`}>
                          Open job <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                      </Button>
                      {canManageMaintenance && (
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/maintenance/${job.id}`} title="Assign a contractor on the job page">Assign</Link>
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Due</div>
                      <div className={priorityTextClass(job.priority, overdue)}>{formatLondonDateTime(jobDueValue(job))}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Chase up at</div>
                      <div>{formatLondonDateTime(job.chaseUpAt)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Contractor</div>
                      <div>{job.contractorRef?.name || "Not assigned"}</div>
                      {job.contractorRef?.phone && <div className="text-xs text-muted-foreground">{job.contractorRef.phone}</div>}
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Visit</div>
                      <div>{formatVisit(job)}</div>
                    </div>
                  </div>

                  <div className="border-t pt-3 space-y-3">
                    <div className="text-sm font-medium">Notes</div>
                    {latestNotes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No notes yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {latestNotes.map((n) => (
                          <div key={n.id} className="rounded-md bg-background/70 border px-3 py-2 text-sm">
                            <div className="text-xs text-muted-foreground">
                              {n.kind === "CHASE_UP" ? "Chase-up" : "Note"} Â· {n.authorName || "Staff"} Â· {formatLondonDateTime(n.createdAt)}
                            </div>
                            <div className="whitespace-pre-wrap">{n.note}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {canManageMaintenance && (
                      <div className="space-y-2">
                        <Textarea
                          rows={2}
                          placeholder="What did you find out? e.g. contractor will attend Thursday"
                          value={draft}
                          onChange={(e) => setDrafts((d) => ({ ...d, [job.id as string]: e.target.value }))}
                        />
                        <div className="flex justify-end">
                          <Button size="sm" disabled={savingId === job.id || !draft.trim()} onClick={() => handleAddNote(job)}>
                            {savingId === job.id ? "Savingâ€¦" : "Add chase-up note"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
};

export default ChaseUp;
