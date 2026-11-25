// Assigned contractor jobs, filtered by visit day. Staff use this to check
// tomorrow's visits, message contractors, and close jobs off.
import { contractorLabel, jobStatusLabel } from "@/utils/contractorLabel";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Hint, InfoHint } from "@/components/ui/hint";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks";
import { fetchJobTypes, JobType, ReportingStatus } from "@/redux/dataStore/jobTypeSlice";
import { useAuth } from "@/context/AuthContext";
import { Department } from "@/types/permissions";
import { priorityBadgeClass, priorityRowClass, priorityTextClass, statusBadgeClass } from "@/utils/priorityStyle";
import { formatLondonDate, formatLondonDateTime, isJobOverdue, jobDueValue, londonDateString } from "@/utils/maintenanceSla";
import { VisitTimeDialog, NotePromptDialog } from "./JobDialogs";
import { cancelJob, formatJobAddress, formatVisit, markJobDone, markJobNotComplete } from "./jobActions";

type JobsFilter = "tomorrow" | "today" | "all";

const FILTERS: { value: JobsFilter; label: string }[] = [
  { value: "tomorrow", label: "Tomorrow" },
  { value: "today", label: "Today" },
  { value: "all", label: "All assigned" },
];

const STATUS_LABELS: Partial<Record<ReportingStatus, string>> = {
  OPEN: "Open",
  WAITING_AUTHORIZATION: "Awaiting Authorisation",
  QUOTING: "Quoting",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  CONTRACTOR_DONE: "Pending",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

/** Sort key: visit day and time; jobs without a visit go last. */
const visitSortKey = (job: JobType) => {
  if (!job.visitDate) return Number.POSITIVE_INFINITY;
  const day = String(job.visitDate).slice(0, 10);
  const t = new Date(`${day}T${job.time || "23:59"}:00`).getTime();
  return isNaN(t) ? Number.POSITIVE_INFINITY : t;
};

const MaintenanceJobs = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { jobTypes, loading, totalPages } = useAppSelector((state) => state.jobTypes);
  const { isDepartmentAdmin } = useAuth();
  const canManageMaintenance = isDepartmentAdmin(Department.Maintenance);

  const [filter, setFilter] = useState<JobsFilter>("tomorrow");
  const [page, setPage] = useState(1);
  const [notCompleteJob, setNotCompleteJob] = useState<JobType | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Tomorrow is the default: staff check the next day's visits.
  const visitDate = filter === "today" ? londonDateString(0) : filter === "tomorrow" ? londonDateString(1) : undefined;

  // Changing the filter resets to page 1 in the same click, so only one fetch runs per change.
  const changeFilter = (next: JobsFilter) => {
    setFilter(next);
    setPage(1);
  };

  const reload = () => {
    dispatch(fetchJobTypes({ page, limit: 50, assigned: true, visitDate }));
  };

  useEffect(() => {
    dispatch(fetchJobTypes({ page, limit: 50, assigned: true, visitDate }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, filter, page]);

  const runRowAction = async (job: JobType, action: () => Promise<unknown>, successMessage: string) => {
    if (!job.id) return;
    setBusyId(job.id);
    try {
      await action();
      toast.success(successMessage);
      reload();
    } catch (error) {
      toast.error(error?.message || "Something went wrong");
    } finally {
      setBusyId(null);
    }
  };

  const sorted = [...jobTypes].sort((a, b) => visitSortKey(a) - visitSortKey(b));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="hero-stat text-[2rem]">Visits</h1>
            <p className="text-sm text-muted-foreground">Jobs with a contractor assigned, by visit day.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map(({ value, label }) => (
              <Button key={value} size="sm" variant={filter === value ? "default" : "outline"} onClick={() => changeFilter(value)}>
                {label}
              </Button>
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse table-auto">
                <thead className="bg-background">
                  <tr className="border-b border-border/70">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Visit<InfoHint text="When the contractor is due at the property." /></th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Property<InfoHint text="Full property address." /></th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Job<InfoHint text="What needs doing." /></th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Contractor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Due<InfoHint text="Deadline for the work. Red once overdue." /></th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Loading jobs...</td>
                    </tr>
                  ) : sorted.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                        {filter === "tomorrow" ? "No jobs visiting tomorrow." : filter === "today" ? "No jobs visiting today." : "No assigned jobs."}
                      </td>
                    </tr>
                  ) : (
                    sorted.map((job) => {
                      const closed = job.status === "COMPLETED" || job.status === "CANCELLED";
                      const overdue = isJobOverdue(job);
                      const due = jobDueValue(job);
                      const busy = busyId === job.id;
                      return (
                        <tr
                          key={job.id}
                          className={`border-b border-border/50 align-top cursor-pointer hover:brightness-95 transition-colors ${priorityRowClass(job.priority)}`}
                          onClick={() => navigate(`/maintenance/${job.id}`)}
                        >
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            {job.visitDate ? formatVisit(job) : <span className="text-muted-foreground">Not scheduled</span>}
                          </td>
                          <td className="px-4 py-3 text-sm min-w-[12rem] max-w-[18rem]">{formatJobAddress(job.property)}</td>
                          <td className="px-4 py-3 text-sm max-w-xs">
                            <div className="font-medium">{job.jobType}{job.location ? ` · ${job.location}` : ""}</div>
                            <div className="text-muted-foreground truncate">{job.description || "-"}</div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {job.priority ? <Badge variant="outline" className={priorityBadgeClass(job.priority)}>{job.priority}</Badge> : "-"}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {job.contractorRef ? (
                              <div>
                                <div className="font-medium">{contractorLabel(job.contractorRef.name)}</div>
                                {job.contractorRef.phone && <div className="text-xs text-muted-foreground">{job.contractorRef.phone}</div>}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className={`px-4 py-3 text-sm whitespace-nowrap ${priorityTextClass(job.priority, overdue)}`}>
                            {job.dueAt ? formatLondonDateTime(job.dueAt) : due ? formatLondonDate(due) : "-"}
                            {overdue && <div className="text-xs font-semibold text-red-600">Overdue</div>}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Hint text={jobStatusLabel(job.status, STATUS_LABELS[job.status] ?? job.status, job.contractorRef?.name)}>
                              <Badge variant="outline" className={statusBadgeClass(job.status)}>{jobStatusLabel(job.status, STATUS_LABELS[job.status] ?? job.status, job.contractorRef?.name)}</Badge>
                            </Hint>
                          </td>
                          <td className="px-4 py-3 text-sm" onClick={(e) => e.stopPropagation()}>
                            <div className="flex flex-wrap gap-2 min-w-[14rem]">
                              {canManageMaintenance && !closed && (
                                <>
                                  <VisitTimeDialog job={job} disabled={busy} onSaved={reload} />
                                  <Button size="sm" disabled={busy} onClick={() => runRowAction(job, () => markJobDone(job), "Marked as complete")}>
                                    <CheckCircle2 className="h-4 w-4 mr-1" /> Complete
                                  </Button>
                                  <Button size="sm" variant="outline" disabled={busy} onClick={() => setNotCompleteJob(job)}>
                                    <RotateCcw className="h-4 w-4 mr-1" /> Not complete
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={busy}
                                    onClick={() => {
                                      if (window.confirm("Cancel this job?")) runRowAction(job, () => cancelJob(job), "Job cancelled");
                                    }}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" /> Cancel job
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onClick={() => setPage((p) => Math.max(p - 1, 1))} />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, index) => (
                <PaginationItem key={index}>
                  <PaginationLink onClick={() => setPage(index + 1)} isActive={page === index + 1}>
                    {index + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext onClick={() => setPage((p) => Math.min(p + 1, totalPages))} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      <NotePromptDialog
        open={!!notCompleteJob}
        onOpenChange={(open) => !open && setNotCompleteJob(null)}
        title="Mark as not complete"
        description="The job goes back to the contractor. Say what is still outstanding."
        submitLabel="Mark not complete"
        onSubmit={async (note) => {
          const job = notCompleteJob;
          if (!job) return;
          try {
            await markJobNotComplete(job, note);
            toast.success("Job sent back as not complete");
            reload();
          } catch (error) {
            toast.error(error?.message || "Failed to update the job");
          }
        }}
      />
    </DashboardLayout>
  );
};

export default MaintenanceJobs;
