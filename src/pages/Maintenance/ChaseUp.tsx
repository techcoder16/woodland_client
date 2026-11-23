// Jobs that need chasing: due soon, overdue, or past their chase-up time.
// Same table as the Jobs list; click a row to open its assign box and notes.
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ChevronDown, ChevronRight } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Hint, InfoHint } from "@/components/ui/hint";
import { get } from "@/helper/api";
import { updateJobType } from "@/redux/dataStore/jobTypeSlice";
import type { JobType, ReportingStatus } from "@/redux/dataStore/jobTypeSlice";
import { useAppDispatch } from "@/redux/reduxHooks";
import ContractorPicker from "@/utils/ContractorPicker";
import { useAuth } from "@/context/AuthContext";
import { Department } from "@/types/permissions";
import { priorityBadgeClass, statusBadgeClass, statusRowClass } from "@/utils/priorityStyle";
import { formatLondonDateTime, isJobOverdue, jobDueValue } from "@/utils/maintenanceSla";
import { addJobNote } from "./jobActions";
import { AddressCell, DueCell } from "./jobCells";

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
  const dispatch = useAppDispatch();
  const { isDepartmentAdmin } = useAuth();
  const canManageMaintenance = isDepartmentAdmin(Department.Maintenance);

  const [jobs, setJobs] = useState<JobType[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [pendingContractor, setPendingContractor] = useState<Record<string, string>>({});
  const [assigningId, setAssigningId] = useState<string | null>(null);

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

  // Same rule as the job page and the server: a contractor can be (re)assigned when
  // none is set, the contractor has finished, or the job is overdue.
  const canAssign = (job: JobType) => !job.contractorId || job.status === "CONTRACTOR_DONE" || isJobOverdue(job);

  const handleAssign = async (job: JobType) => {
    const contractorId = pendingContractor[job.id as string];
    if (!job.id || !contractorId) return;
    setAssigningId(job.id);
    try {
      await dispatch(updateJobType({ id: job.id, jobTypeData: { propertyId: job.propertyId, contractorId } })).unwrap();
      toast.success(job.contractorId ? "Contractor reassigned" : "Contractor assigned");
      setPendingContractor((p) => ({ ...p, [job.id as string]: "" }));
      await load();
    } catch (error) {
      toast.error(typeof error === "string" ? error : error?.message || "Failed to assign the contractor");
    } finally {
      setAssigningId(null);
    }
  };

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

  const th = "px-4 py-3 text-left text-xs font-medium text-muted-foreground";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="hero-stat text-[2rem]">Chase Up</h1>
            <p className="text-sm text-muted-foreground">
              Jobs that are due soon or overdue, earliest deadline first.
              <InfoHint text="A job appears here once it reaches its chase-up time, or when it is overdue. Click a row to assign a contractor or add a note." />
            </p>
          </div>
          <Badge variant="outline" className="border-red-300 bg-red-50 text-red-700">{total} to chase</Badge>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse table-auto">
                <thead className="bg-background">
                  <tr className="border-b border-border/70">
                    <th className={th}>Date<InfoHint text="Date the job was logged." /></th>
                    <th className={th}>Address<InfoHint text="The property this job is for." /></th>
                    <th className={th}>Description<InfoHint text="What needs doing." /></th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Resp.<InfoHint text="Who is responsible: L = Landlord, I = Internal (Woodland)." /></th>
                    <th className={th}>Priority<InfoHint text="How urgent the job is: Critical (red), High (orange), Medium (yellow), Low (pink)." /></th>
                    <th className={th}>Contractor<InfoHint text="The contractor assigned to carry out the work." /></th>
                    <th className={th}>Due<InfoHint text="When the work is due. Shown in red once it is overdue." /></th>
                    <th className={th}>Chase up at<InfoHint text="When this job was due to be chased." /></th>
                    <th className={th}>Status<InfoHint text="Where the job is." /></th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
                  ) : sorted.length === 0 ? (
                    <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">Nothing to chase up right now.</td></tr>
                  ) : (
                    sorted.map((job) => {
                      const id = job.id as string;
                      const isOpen = !!open[id];
                      const draft = drafts[id] ?? "";
                      const notes = (job.notes ?? []).slice(0, 3);
                      return (
                        <Fragment key={id}>
                          <tr
                            className={`border-b border-border/50 hover:brightness-95 transition-colors align-top cursor-pointer ${statusRowClass(job.status)}`}
                            onClick={() => setOpen((o) => ({ ...o, [id]: !o[id] }))}
                          >
                            <td className="px-4 py-3 text-sm whitespace-nowrap">
                              <span className="inline-flex items-center gap-1">
                                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "-"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm"><AddressCell property={job.property} /></td>
                            <td className="px-4 py-3 text-sm max-w-xs">
                              <div className="font-medium">{job.jobType}</div>
                              <div className="text-muted-foreground truncate">{job.description || "-"}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-center font-semibold">
                              {job.responsibility ? (
                                <Hint text={job.responsibility.toUpperCase() === "LANDLORD" ? "Landlord responsible" : "Internal (Woodland) responsible"}>
                                  <span>{job.responsibility.toUpperCase() === "LANDLORD" ? "L" : "I"}</span>
                                </Hint>
                              ) : "-"}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {job.priority ? <Badge variant="outline" className={priorityBadgeClass(job.priority)}>{job.priority}</Badge> : "-"}
                            </td>
                            <td className="px-4 py-3 text-sm">{job.contractorRef ? job.contractorRef.name : "-"}</td>
                            <td className="px-4 py-3 text-sm"><DueCell job={job} /></td>
                            <td className="px-4 py-3 text-sm whitespace-nowrap">{job.chaseUpAt ? formatLondonDateTime(job.chaseUpAt) : "-"}</td>
                            <td className="px-4 py-3 text-sm">
                              <Badge variant="outline" className={statusBadgeClass(job.status)}>{STATUS_LABELS[job.status] ?? job.status}</Badge>
                            </td>
                            <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <Button asChild size="sm" variant="outline"><Link to={`/maintenance/${id}`}>Open</Link></Button>
                            </td>
                          </tr>
                          {isOpen && (
                            <tr className="border-b border-border/50 bg-muted/20">
                              <td colSpan={10} className="px-6 py-4 space-y-4">
                                {canManageMaintenance && (
                                  <div>
                                    <div className="text-sm font-medium mb-2">{job.contractorId ? "Reassign contractor" : "Assign contractor"}</div>
                                    {canAssign(job) ? (
                                      <div className="flex flex-wrap items-end gap-2">
                                        <div className="flex-1 min-w-[14rem] max-w-sm">
                                          <ContractorPicker
                                            label=""
                                            name={`_chase_${id}`}
                                            watch={() => pendingContractor[id] || ""}
                                            setValue={(_name: string, value: string) => setPendingContractor((p) => ({ ...p, [id]: value }))}
                                            clearErrors={() => undefined}
                                          />
                                        </div>
                                        <Button size="sm" disabled={assigningId === id || !pendingContractor[id]} onClick={() => handleAssign(job)}>
                                          {assigningId === id ? "Saving…" : job.contractorId ? "Reassign" : "Assign"}
                                        </Button>
                                      </div>
                                    ) : (
                                      <p className="text-sm text-muted-foreground">
                                        {job.contractorRef?.name || "A contractor"} is assigned. Reassigning opens once the job is overdue or the contractor marks it done.
                                      </p>
                                    )}
                                  </div>
                                )}

                                <div className="space-y-3">
                                  <div className="text-sm font-medium">Notes</div>
                                  {notes.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No notes yet.</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {notes.map((n) => (
                                        <div key={n.id} className="rounded-md bg-background border px-3 py-2 text-sm">
                                          <div className="text-xs text-muted-foreground">
                                            {n.kind === "CHASE_UP" ? "Chase-up" : "Note"} · {n.authorName || "Staff"} · {formatLondonDateTime(n.createdAt)}
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
                                        onChange={(e) => setDrafts((d) => ({ ...d, [id]: e.target.value }))}
                                      />
                                      <div className="flex justify-end">
                                        <Button size="sm" disabled={savingId === id || !draft.trim()} onClick={() => handleAddNote(job)}>
                                          {savingId === id ? "Saving…" : "Add chase-up note"}
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ChaseUp;
