// Assigned and past jobs for one contractor, shown on the contractor page.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InfoHint } from "@/components/ui/hint";
import { get } from "@/helper/api";
import type { JobType, ReportingStatus } from "@/redux/dataStore/jobTypeSlice";
import { priorityBadgeClass, statusBadgeClass } from "@/utils/priorityStyle";
import { formatLondonDate, formatLondonDateTime, isJobOverdue, jobDueValue } from "@/utils/maintenanceSla";
import { formatJobAddress, formatVisit } from "@/pages/Maintenance/jobActions";

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

const listJobs = async (query: string): Promise<JobType[]> => {
  const { data } = await get<{ jobTypes?: JobType[]; items?: JobType[] }>(`property-management/job-type?${query}`);
  return data?.jobTypes ?? data?.items ?? [];
};

const byDueAsc = (a: JobType, b: JobType) => {
  const ta = new Date(jobDueValue(a) ?? 0).getTime() || 0;
  const tb = new Date(jobDueValue(b) ?? 0).getTime() || 0;
  return ta - tb;
};

const byDueDesc = (a: JobType, b: JobType) => byDueAsc(b, a);

function JobTable({ jobs, empty }: { jobs: JobType[]; empty: string }) {
  if (jobs.length === 0) return <p className="text-sm text-muted-foreground py-4 text-center">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse table-auto text-sm">
        <thead className="bg-background">
          <tr className="border-b border-border/70">
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Job</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Property</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Visit</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Due</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Priority</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Status</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => {
            const overdue = isJobOverdue(job);
            return (
              <tr key={job.id} className="border-b border-border/50 align-top hover:bg-muted/40">
                <td className="px-3 py-2">
                  <Link to={`/maintenance/${job.id}`} className="font-medium text-primary hover:underline">
                    {job.jobType}
                  </Link>
                  {job.description && <div className="text-xs text-muted-foreground truncate max-w-xs">{job.description}</div>}
                </td>
                <td className="px-3 py-2 min-w-[10rem]">{formatJobAddress(job.property)}</td>
                <td className="px-3 py-2 whitespace-nowrap">{formatVisit(job)}</td>
                <td className={`px-3 py-2 whitespace-nowrap ${overdue ? "text-red-600 font-semibold" : ""}`}>
                  {job.dueAt ? formatLondonDateTime(job.dueAt) : formatLondonDate(jobDueValue(job))}
                  {overdue && <div className="text-xs">Overdue</div>}
                </td>
                <td className="px-3 py-2">
                  {job.priority ? <Badge variant="outline" className={priorityBadgeClass(job.priority)}>{job.priority}</Badge> : "-"}
                </td>
                <td className="px-3 py-2">
                  <Badge variant="outline" className={statusBadgeClass(job.status)}>{STATUS_LABELS[job.status] ?? job.status}</Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function ContractorJobHistory({ contractorId }: { contractorId: string }) {
  const [assigned, setAssigned] = useState<JobType[] | null>(null);
  const [past, setPast] = useState<JobType[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [active, completed, cancelledJobs] = await Promise.all([
          listJobs(`contractorId=${contractorId}&status=ACTIVE`),
          listJobs(`contractorId=${contractorId}&status=COMPLETED`),
          listJobs(`contractorId=${contractorId}&status=CANCELLED`),
        ]);
        if (cancelled) return;
        setAssigned([...active].sort(byDueAsc));
        setPast([...completed, ...cancelledJobs].sort(byDueDesc));
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [contractorId]);

  if (error) {
    return <Card><CardContent className="p-4 text-sm text-muted-foreground">Could not load this contractor's jobs.</CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="font-semibold">Assigned jobs<InfoHint text="Open jobs for this contractor, earliest deadline first." /></div>
          {assigned === null ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
          ) : (
            <JobTable jobs={assigned} empty="No open jobs for this contractor." />
          )}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="font-semibold">Past jobs<InfoHint text="Completed and cancelled jobs, most recent deadline first." /></div>
          {past === null ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
          ) : (
            <JobTable jobs={past} empty="No completed or cancelled jobs yet." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
