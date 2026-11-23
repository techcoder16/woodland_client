import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { priorityBadgeClass, priorityTextClass, PRIORITY_BADGE, statusBadgeClass, statusRowClass } from "@/utils/priorityStyle";
import { Badge } from "@/components/ui/badge";
import { Hint, InfoHint } from "@/components/ui/hint";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import TextAreaField from "@/utils/TextAreaField";
import SelectField from "@/utils/SelectedField";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Trash2, Search, CheckCircle2, Send, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks";
import { get } from "@/helper/api";
import {
  fetchJobTypes,
  createJobType,
  updateJobType,
  deleteJobType,
  JobType,
  JobStatusFilter,
  ReportingStatus,
} from "@/redux/dataStore/jobTypeSlice";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { Department } from "@/types/permissions";
import FileUploadField from "@/utils/FileUploadField";
import { JOB_TYPE_OPTIONS, JOB_LOCATION_OPTIONS } from "@/helper/jobTypeOptions";
import { formatLocalDate } from "@/helper/formatLocalDate";
import { useMaintenanceSummary } from "@/components/maintenance/useMaintenanceSummary";
import { computeSla, formatLondonDate, formatLondonDateTime, isJobOverdue, jobDueValue } from "@/utils/maintenanceSla";
import { emailLandlord } from "./jobActions";
import { AddressCell, DueCell } from "./jobCells";

// Matches what CreateJobTypeDto persists on create. The server forces the
// status and sets dueAt/chaseUpAt from the priority; the form only previews them.
const maintenanceSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  jobType: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  thingsToDo: z.string().optional(),
  priority: z.string().min(1, "Priority is required"),
  responsibility: z.string().optional(),
  reportedBy: z.string().optional(),
  deductible: z.boolean().optional(),
  mediaFileIds: z.array(z.string()).optional(),
});

type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

interface Property {
  id: string;
  addressLine1: string;
  addressLine2?: string;
  town?: string;
  postCode?: string;
}

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

// The create endpoint's body: the new job itself, or wrapped in jobType / data.
interface CreatedJobResponse {
  id?: string;
  jobType?: { id?: string };
  data?: { id?: string; jobType?: { id?: string } };
}

const STATUS_LABELS: Record<ReportingStatus, string> = {
  OPEN: "Open",
  WAITING_AUTHORIZATION: "Waiting Authorisation",
  QUOTING: "Quoting",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  CONTRACTOR_DONE: "Pending",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_HINTS: Record<ReportingStatus, string> = {
  OPEN: "Logged and waiting for the next step.",
  WAITING_AUTHORIZATION: "The landlord has been emailed and needs to authorise the work.",
  QUOTING: "Waiting for quotes; no contractor chosen yet.",
  ASSIGNED: "A contractor has been assigned but has not started.",
  IN_PROGRESS: "The contractor is working on it.",
  CONTRACTOR_DONE: "Contractor says it is finished; waiting for sign-off.",
  COMPLETED: "Signed off and done.",
  CANCELLED: "Cancelled; no further work.",
};

/** Status filter buttons. "Active" (everything not completed or cancelled) is the default. */
const STATUS_FILTERS: { value: JobStatusFilter | ""; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "OPEN", label: "Open" },
  { value: "WAITING_AUTHORIZATION", label: "Waiting Authorisation" },
  { value: "QUOTING", label: "Quoting" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "CONTRACTOR_DONE", label: "Pending" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "", label: "All" },
];

const RESPONSIBILITY_OPTIONS = [
  { value: "LANDLORD", label: "Landlord" },
  { value: "INTERNAL", label: "Internal" },
];

const REPORTED_BY_OPTIONS = [
  { value: "TENANT", label: "Tenant" },
  { value: "LANDLORD", label: "Landlord" },
  { value: "INTERNAL", label: "Internal" },
];

const PRIORITY_OPTIONS = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
  { value: "Critical", label: "Critical" },
];

const formatAddress = (property?: JobType["property"]) => {
  if (!property) return "-";
  return [property.addressLine1, property.addressLine2, property.town, property.postCode]
    .filter(Boolean)
    .join(", ");
};

const SummaryTile = ({ label, value, className = "" }: { label: string; value?: number; className?: string }) => (
  <div className={`rounded-lg border p-3 ${className}`}>
    <div className="text-xs font-medium opacity-80">{label}</div>
    <div className="text-2xl font-semibold leading-tight">{value ?? "–"}</div>
  </div>
);

const MaintenanceList = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { jobTypes, loading, totalPages } = useAppSelector((state) => state.jobTypes);
  const { isDepartmentAdmin } = useAuth();
  const canManageMaintenance = isDepartmentAdmin(Department.Maintenance);
  const { summary, reload: reloadSummary } = useMaintenanceSummary(true);

  const [properties, setProperties] = useState<Property[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);
  const [statusFilter, setStatusFilter] = useState<JobStatusFilter | "">("ACTIVE"); // default hides completed/cancelled
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreatingJob, setIsCreatingJob] = useState(false);

  // Changing the status filter always resets to page 1 — combined into one
  // effect (rather than a separate "reset page" effect + "fetch" effect) so
  // there's no race between two effects dispatching fetchJobTypes with two
  // different page numbers for the same filter change, where the stale
  // request could resolve after the correct one and overwrite it.
  useEffect(() => {
    setCurrentPage(1);
    dispatch(fetchJobTypes({ page: 1, limit: 20, status: statusFilter || undefined, search: debouncedSearch || undefined }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, statusFilter, debouncedSearch]);

  useEffect(() => {
    if (currentPage === 1) return; // already fetched by the effect above
    dispatch(fetchJobTypes({ page: currentPage, limit: 20, status: statusFilter || undefined, search: debouncedSearch || undefined }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, currentPage]);

  useEffect(() => {
    (async () => {
      const { data } = await get<{ items?: Property[] }>("properties?page=1&limit=200&search=");
      setProperties(data?.items || []);
    })();
    (async () => {
      const { data } = await get<User[]>("user/all");
      setUsers(data || []);
    })();
  }, []);

  const getEmployeeName = (employeeId?: string) => {
    if (!employeeId) return "-";
    const user = users.find((u) => u.id === employeeId);
    if (!user) return employeeId;
    return user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email;
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: { deductible: true, priority: "" },
  });

  const priorityValue = watch("priority");
  const responsibilityValue = watch("responsibility");
  const deductibleValue = watch("deductible");
  // Live preview only: the server computes the real dueAt / chaseUpAt on save.
  const slaPreview = useMemo(() => computeSla(priorityValue), [priorityValue]);

  const closeDialog = () => {
    setIsDialogOpen(false);
    reset({ deductible: true, priority: "" });
  };

  const refreshList = () => {
    dispatch(fetchJobTypes({ page: currentPage, limit: 20, status: statusFilter || undefined, search: debouncedSearch || undefined }));
    reloadSummary();
  };

  const submitJob = async (data: MaintenanceFormData, informLandlord: boolean) => {
    // Guards against duplicate jobs from a double-click/slow-network resubmit:
    // each dispatch generates its own fresh Idempotency-Key (idempotency only
    // catches identical retries of the SAME request, not two distinct clicks),
    // so the button itself must ignore repeat submissions while one is in flight.
    if (isCreatingJob) return;
    setIsCreatingJob(true);
    try {
      // Blank optional fields are sent as undefined (not ""), because the server's @IsIn checks reject "".
      const blank = (v?: string) => (v ? v : undefined);
      const payload = {
        propertyId: data.propertyId,
        jobType: blank(data.jobType),
        location: blank(data.location),
        description: blank(data.description),
        thingsToDo: blank(data.thingsToDo),
        priority: data.priority,
        responsibility: blank(data.responsibility),
        reportedBy: blank(data.reportedBy),
        deductible: data.deductible !== false,
        mediaFileIds: data.mediaFileIds ?? [],
        status: "OPEN",
      } as Omit<JobType, "id">;

      // .unwrap() is required — createAsyncThunk never throws on its own, so
      // without it a rejected (rejectWithValue) result was silently treated
      // as success: no error toast shown, and the dialog closed as if the
      // job had actually been created.
      const created = (await dispatch(createJobType(payload)).unwrap()) as CreatedJobResponse;
      toast.success("Maintenance job created successfully");

      if (informLandlord) {
        const jobId: string | undefined = created?.id ?? created?.jobType?.id ?? created?.data?.id ?? created?.data?.jobType?.id;
        if (!jobId) {
          toast.error("Job saved, but the landlord could not be informed from here. Open the job to inform them.");
        } else {
          try {
            const result = await emailLandlord(jobId);
            toast.success(result?.message || "Landlord informed. Waiting for authorisation.");
          } catch (error) {
            // The job is kept; the landlord can be informed later from the job page.
            toast.error(error?.message || "Could not inform the landlord. The job has been saved.");
          }
        }
      }

      setCurrentPage(1);
      dispatch(fetchJobTypes({ page: 1, limit: 20, status: statusFilter || undefined, search: debouncedSearch || undefined }));
      reloadSummary();
      closeDialog();
    } catch (error) {
      toast.error(typeof error === "string" ? error : error?.message || "Error saving maintenance job");
    } finally {
      setIsCreatingJob(false);
    }
  };

  const handleDelete = async (job: JobType) => {
    if (!job.id) return;
    try {
      await dispatch(deleteJobType({ id: job.id, propertyId: job.propertyId }));
      toast.success("Maintenance job deleted successfully");
      refreshList();
    } catch (error) {
      toast.error("Error deleting maintenance job");
    }
  };

  const handleCompleteJob = async (job: JobType) => {
    if (!job.id) return;
    try {
      await dispatch(
        updateJobType({
          id: job.id,
          jobTypeData: { propertyId: job.propertyId, dateDone: formatLocalDate(new Date()), status: "COMPLETED" },
        })
      ).unwrap();
      toast.success("Maintenance job marked as done");
      refreshList();
    } catch (error) {
      toast.error(typeof error === "string" ? error : error?.message || "Error completing maintenance job");
    }
  };

  const propertyOptions = properties.map((p) => ({
    value: p.id,
    label: [p.addressLine1, p.town].filter(Boolean).join(", "),
  }));

  const filteredJobTypes = jobTypes.filter((job) => {
    void job; // the search runs on the server (address, description, job type)
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="hero-stat text-[2rem]">Jobs</h1>
          <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate("/maintenance/jobs")}>
            <CalendarClock className="h-4 w-4 mr-2" />
            Visits
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => (open ? setIsDialogOpen(true) : closeDialog())}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Maintenance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
              <DialogHeader>
                <DialogTitle>Add New Maintenance</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit((data) => submitJob(data, false))} className="flex flex-col flex-1 min-h-0">
                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_18rem] gap-6 overflow-y-auto pr-1 flex-1 min-h-0">
                  <div className="space-y-4">
                    <SelectField
                      label="Property"
                      name="propertyId"
                      register={register}
                      setValue={setValue}
                      watch={watch}
                      error={errors.propertyId?.message}
                      options={propertyOptions}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <SelectField
                        label="Type *"
                        name="jobType"
                        register={register}
                        setValue={setValue}
                        watch={watch}
                        error={errors.jobType?.message}
                        options={JOB_TYPE_OPTIONS.map((o) => ({ value: o, label: o }))}
                      />
                      <SelectField
                        label="Location *"
                        name="location"
                        register={register}
                        setValue={setValue}
                        watch={watch}
                        error={errors.location?.message}
                        options={JOB_LOCATION_OPTIONS.map((o) => ({ value: o, label: o }))}
                      />
                    </div>

                    <TextAreaField
                      label="Description"
                      name="description"
                      register={register}
                      error={errors.description?.message}
                      placeholder="Describe the issue..."
                    />

                    <FileUploadField
                      label="Photos"
                      name="mediaFileIds"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      register={register}
                      setValue={setValue}
                      watch={watch}
                      error={errors.mediaFileIds?.message as string | undefined}
                      upload={{ category: "job-media", entityType: "jobType" }}
                    />

                    <TextAreaField
                      label="Notes"
                      name="thingsToDo"
                      register={register}
                      error={errors.thingsToDo?.message}
                      placeholder="List specific tasks to be completed..."
                    />
                  </div>

                  <div className="space-y-4 rounded-lg border bg-muted/30 p-4 h-fit">
                    <SelectField
                      label="Responsibility"
                      name="responsibility"
                      register={register}
                      setValue={setValue}
                      watch={watch}
                      error={errors.responsibility?.message}
                      options={RESPONSIBILITY_OPTIONS}
                    />

                    <div className="space-y-1.5">
                      <div className="text-muted-foreground text-sm font-medium">Job status</div>
                      <div className="flex h-10 items-center rounded-md border bg-background px-3 text-sm">
                        <Badge variant="outline" className={statusBadgeClass("OPEN")}>Open</Badge>
                        <span className="ml-2 text-xs text-muted-foreground">set on create</span>
                      </div>
                    </div>

                    <SelectField
                      label="Reported by"
                      name="reportedBy"
                      register={register}
                      setValue={setValue}
                      watch={watch}
                      error={errors.reportedBy?.message}
                      options={REPORTED_BY_OPTIONS}
                    />

                    <SelectField
                      label="Priority *"
                      name="priority"
                      register={register}
                      setValue={setValue}
                      watch={watch}
                      error={errors.priority?.message}
                      options={PRIORITY_OPTIONS}
                    />

                    <div className="rounded-md border bg-background p-3 text-sm space-y-1">
                      <div className="font-medium">Due date</div>
                      {slaPreview ? (
                        <div className="text-muted-foreground">
                          Due: <span className="text-foreground">{formatLondonDateTime(slaPreview.dueAt)}</span>
                          {" · "}
                          Chase up: <span className="text-foreground">{formatLondonDateTime(slaPreview.chaseUpAt)}</span>
                        </div>
                      ) : (
                        <div className="text-muted-foreground">Set a priority to see when it is due.</div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Set automatically from priority. Critical and High count office hours (Mon–Fri 9:00–17:00).
                      </div>
                    </div>

                    <label className="flex items-start gap-3">
                      <Checkbox
                        checked={deductibleValue !== false}
                        onCheckedChange={(v) => setValue("deductible", v === true, { shouldDirty: true })}
                      />
                      <span>
                        <span className="block text-sm font-medium">
                          Deductible from landlord<InfoHint text="Ticked: the cost of this job can be deducted from the landlord's payment." />
                        </span>
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-2 pt-4 border-t mt-2">
                  <Button type="button" variant="outline" onClick={closeDialog} disabled={isCreatingJob}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="secondary" disabled={isCreatingJob}>
                    {isCreatingJob ? "Saving…" : "Save"}
                  </Button>
                  {responsibilityValue === "LANDLORD" && (
                    <Button
                      type="button"
                      disabled={isCreatingJob}
                      onClick={handleSubmit((data) => submitJob(data, true))}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isCreatingJob ? "Saving…" : "Save & inform landlord"}
                    </Button>
                  )}
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
          <Link to="/maintenance/chase-up" className="block hover:opacity-90" title="Open the chase-up list">
            <SummaryTile label="Chase up" value={summary?.chaseUp} className="border-red-300 bg-red-50 text-red-800" />
          </Link>
          <SummaryTile label="Overdue" value={summary?.overdue} className="border-red-300 bg-white text-red-700" />
          <SummaryTile label="Waiting authorisation" value={summary?.waitingAuthorization} className="border-violet-300 bg-violet-50 text-violet-800" />
          <SummaryTile label="Unassigned" value={summary?.unassigned} className="border-sky-300 bg-sky-50 text-sky-800" />
          <SummaryTile label="Critical" value={summary?.byPriority?.Critical} className={PRIORITY_BADGE.Critical} />
          <SummaryTile label="High" value={summary?.byPriority?.High} className={PRIORITY_BADGE.High} />
          <SummaryTile label="Medium" value={summary?.byPriority?.Medium} className={PRIORITY_BADGE.Medium} />
          <SummaryTile label="Low" value={summary?.byPriority?.Low} className={PRIORITY_BADGE.Low} />
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for a maintenance..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_FILTERS.map(({ value, label }) => (
              <Button
                key={value || "all"}
                variant={statusFilter === value ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(value)}
              >
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date<InfoHint text="Date the job was logged." /></th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Due<InfoHint text="When the work is due. Shown in red once it is overdue." /></th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Address<InfoHint text="The property this job is for." /></th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Description<InfoHint text="What needs doing." /></th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Resp.<InfoHint text="Who is responsible: L = Landlord, I = Internal (Woodland)." /></th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Priority<InfoHint text="How urgent the job is: Critical (red), High (orange), Medium (yellow), Low (pink)." /></th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Contractor<InfoHint text="The contractor assigned to carry out the work." /></th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status<InfoHint text="Where the job is: Open, Waiting Authorisation, Quoting, Assigned, In Progress, Pending (contractor finished, awaiting sign-off), Completed or Cancelled." /></th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Notes<InfoHint text="The latest note someone added to the job." /></th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Actions<InfoHint text="Click any row to open the job." /></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                        Loading maintenance jobs...
                      </td>
                    </tr>
                  ) : filteredJobTypes.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                        No maintenance jobs found
                      </td>
                    </tr>
                  ) : (
                    filteredJobTypes.map((job) => {
                      return (
                        <tr key={job.id} className={`border-b border-border/50 hover:brightness-95 transition-colors align-top cursor-pointer ${statusRowClass(job.status)}`} onClick={() => navigate(`/maintenance/${job.id}`)}>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "-"}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <DueCell job={job} />
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <AddressCell property={job.property} />
                          </td>
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
                            {job.priority ? <Hint text={`${job.priority} priority`}><Badge noHint variant="outline" className={priorityBadgeClass(job.priority)}>{job.priority}</Badge></Hint> : "-"}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {job.contractorRef ? job.contractorRef.name : job.employeeId ? getEmployeeName(job.employeeId) : "-"}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Hint text={STATUS_HINTS[job.status] ?? job.status}><Badge noHint variant="outline" className={statusBadgeClass(job.status)}>{STATUS_LABELS[job.status] ?? job.status}</Badge></Hint>
                          </td>
                          <td className="px-4 py-3 text-sm max-w-[14rem]">
                            {(job.notes ?? [])[0] ? (
                              <div className="truncate text-muted-foreground" title={(job.notes ?? [])[0].note}>{(job.notes ?? [])[0].note}</div>
                            ) : <span className="text-muted-foreground">-</span>}
                          </td>
                          <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-center space-x-2">
                              {canManageMaintenance && job.status !== "COMPLETED" && (
                                <Button size="sm" variant="outline" onClick={() => handleCompleteJob(job)}>
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                              )}
                              {canManageMaintenance && (
                                <Button size="sm" variant="outline" onClick={() => handleDelete(job)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
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
                <PaginationPrevious onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, index) => (
                <PaginationItem key={index}>
                  <PaginationLink
                    onClick={() => setCurrentPage(index + 1)}
                    isActive={currentPage === index + 1}
                  >
                    {index + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MaintenanceList;
