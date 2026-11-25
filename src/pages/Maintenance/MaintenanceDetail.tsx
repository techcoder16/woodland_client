import { useState, useEffect } from "react";
import { contractorLabel, jobStatusLabel } from "@/utils/contractorLabel";
import StoredFilePreview from "@/components/StoredFilePreview";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { priorityBadgeClass, priorityTextClass, statusBadgeClass } from "@/utils/priorityStyle";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ChevronLeft, CheckCircle2, Mail, Phone, RotateCcw, Send, ShieldCheck, XCircle } from "lucide-react";
import TextAreaField from "@/utils/TextAreaField";
import SelectField from "@/utils/SelectedField";
import ContractorPicker from "@/utils/ContractorPicker";
import FileUploadField from "@/utils/FileUploadField";
import { useAppDispatch, useAppSelector } from "@/redux/reduxHooks";
import { fetchJobTypeById, updateJobType, JobType, JobNote, ReportingStatus } from "@/redux/dataStore/jobTypeSlice";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { Department } from "@/types/permissions";
import { formatLocalDate } from "@/helper/formatLocalDate";
import { get } from "@/helper/api";
import { Checkbox } from "@/components/ui/checkbox";
import { InfoHint } from "@/components/ui/hint";
import { JOB_TYPE_OPTIONS, JOB_LOCATION_OPTIONS } from "@/helper/jobTypeOptions";
import JobLandlordEmails from "@/components/maintenance/JobLandlordEmails";
import JobMediaPanel from "@/components/maintenance/JobMediaPanel";
import JobPaymentsPanel from "@/components/maintenance/JobPaymentsPanel";
import ContractorInvoicePanel from "@/components/maintenance/ContractorInvoicePanel";
import { formatLondonDate, formatLondonDateTime, isJobOverdue, jobDueValue } from "@/utils/maintenanceSla";
import {
  addJobNote,
  cancelJob,
  emailLandlord,
  fetchJobNotes,
  formatJobAddress,
  formatVisit,
  markJobDone,
  markJobNotComplete,
  markLandlordAuthorised,
} from "./jobActions";
import { NotePromptDialog } from "./JobDialogs";

interface HistoryEntry {
  id: string;
  action: string;
  description: string;
  actorKind: string;
  actorName?: string;
  createdAt: string;
}

const editSchema = z.object({
  jobType: z.string().min(1, "Type is required"),
  location: z.string().min(1, "Location is required"),
  description: z.string().optional(),
  priority: z.string().min(1, "Priority is required"),
  responsibility: z.string().optional(),
  reportedBy: z.string().optional(),
  schedule: z.string().optional(),
  time: z.string().optional(),
  thingsToDo: z.string().optional(),
  mediaFileIds: z.array(z.string()).optional(),
});

type EditFormData = z.infer<typeof editSchema>;

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

const PRIORITY_OPTIONS = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
  { value: "Critical", label: "Critical" },
];

const RESPONSIBILITY_OPTIONS = [
  { value: "LANDLORD", label: "Landlord" },
  { value: "INTERNAL", label: "Internal" },
  { value: "TENANT", label: "Tenant" },
];

const REPORTED_BY_OPTIONS = [
  { value: "TENANT", label: "Tenant" },
  { value: "LANDLORD", label: "Landlord" },
  { value: "INTERNAL", label: "Internal" },
];

/** Stored values are upper case; show them as words. */
const partyLabel = (value?: string | null) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : "-";

const formatAddress = (property?: JobType["property"]) => {
  if (!property) return "-";
  return [property.addressLine1, property.addressLine2, property.town, property.postCode]
    .filter(Boolean)
    .join(", ");
};

const money = (n: number) => `£${n.toFixed(2)}`;

const MaintenanceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { jobTypes, loading } = useAppSelector((state) => state.jobTypes);
  const job = jobTypes.find((j) => j.id === id) || null;
  const { isDepartmentAdmin } = useAuth();
  const canManageMaintenance = isDepartmentAdmin(Department.Maintenance);

  const [isEditing, setIsEditing] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [notes, setNotes] = useState<JobNote[] | null>(null);
  const [notesLoading, setNotesLoading] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [pendingContractorId, setPendingContractorId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [isSavingDeductible, setIsSavingDeductible] = useState(false);
  const [isActing, setIsActing] = useState(false);
  const [notCompleteOpen, setNotCompleteOpen] = useState(false);

  useEffect(() => {
    if (id) dispatch(fetchJobTypeById(id));
  }, [dispatch, id]);

  const refresh = () => {
    if (id) dispatch(fetchJobTypeById(id));
  };

  const loadHistory = async () => {
    if (!id || history !== null) return;
    setHistoryLoading(true);
    try {
      const { data, error } = await get<{ history: HistoryEntry[] }>(`property-management/job-type/${id}/history`);
      if (error) throw new Error(error.message);
      setHistory(data?.history || []);
    } catch (error) {
      toast.error("Failed to load job history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadNotes = async () => {
    if (!id) return;
    setNotesLoading(true);
    try {
      setNotes(await fetchJobNotes(id));
    } catch (error) {
      toast.error(error?.message || "Failed to load notes");
    } finally {
      setNotesLoading(false);
    }
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
  });

  useEffect(() => {
    if (job) {
      reset({
        jobType: job.jobType,
        location: job.location || "",
        description: job.description,
        priority: job.priority || "",
        responsibility: (job.responsibility || "").toUpperCase(),
        reportedBy: (job.reportedBy || "").toUpperCase(),
        schedule: job.schedule || "",
        time: job.time || "",
        thingsToDo: job.thingsToDo || "",
        mediaFileIds: job.mediaFileIds || [],
      });
      setPendingContractorId(job.contractorId || "");
    }
  }, [job, reset]);

  // Once a contractor is assigned, reassigning is locked until the job is
  // awaiting review/completed, or its due time has passed — mirrors the
  // backend rule in job-type-note.service.ts exactly.
  const isOverdue = !!job && isJobOverdue(job);
  const isAwaitingReviewOrDone = job?.status === "CONTRACTOR_DONE" || job?.status === "COMPLETED";
  const canReassignContractor = !job?.contractorId || isAwaitingReviewOrDone || isOverdue;
  // COMPLETED/CANCELLED are terminal — mirrors the backend's hard lock in
  // updateJobType, which now rejects any edit to a closed job outright.
  const isJobClosed = job?.status === "COMPLETED" || job?.status === "CANCELLED";

  const landlord = job?.property?.vendor;
  const landlordName = landlord ? [landlord.firstName, landlord.lastName].filter(Boolean).join(" ") || "Landlord" : "";

  const handleToggleDeductible = async (deductible: boolean) => {
    if (!job?.id) return;
    setIsSavingDeductible(true);
    try {
      await dispatch(updateJobType({ id: job.id, jobTypeData: { propertyId: job.propertyId, deductible } })).unwrap();
      await dispatch(fetchJobTypeById(job.id));
      toast.success(deductible ? "Marked as deductible from landlord" : "Marked as not deductible — hidden from landlord transactions");
    } catch (error) {
      toast.error(typeof error === "string" ? error : error?.message || "Failed to update");
    } finally {
      setIsSavingDeductible(false);
    }
  };

  const handleAssignContractor = async () => {
    if (!job?.id || !pendingContractorId) return;
    setIsAssigning(true);
    try {
      await dispatch(updateJobType({ id: job.id, jobTypeData: { propertyId: job.propertyId, contractorId: pendingContractorId } })).unwrap();
      await dispatch(fetchJobTypeById(job.id));
      toast.success("Contractor assigned");
    } catch (error) {
      toast.error(typeof error === "string" ? error : error?.message || "Failed to assign contractor");
    } finally {
      setIsAssigning(false);
    }
  };

  const onSubmit = async (data: EditFormData) => {
    if (!job?.id) return;
    try {
      // .unwrap() is required — createAsyncThunk never throws on its own,
      // so without it a rejected update (e.g. the backend's closed-job
      // lock) was silently treated as success here.
      await dispatch(
        updateJobType({
          id: job.id,
          jobTypeData: {
            propertyId: job.propertyId,
            jobType: data.jobType,
            location: data.location,
            description: data.description,
            thingsToDo: data.thingsToDo,
            priority: data.priority,
            responsibility: data.responsibility || undefined,
            reportedBy: data.reportedBy || undefined,
            mediaFileIds: data.mediaFileIds,
          },
        })
      ).unwrap();
      await dispatch(fetchJobTypeById(job.id));
      toast.success("Maintenance job updated successfully");
      setIsEditing(false);
    } catch (error) {
      toast.error(typeof error === "string" ? error : error?.message || "Error updating maintenance job");
    }
  };

  // Shared runner for the status buttons: one action at a time, then reload the job.
  const runAction = async (action: () => Promise<unknown>, successMessage: string) => {
    setIsActing(true);
    try {
      await action();
      toast.success(successMessage);
      refresh();
    } catch (error) {
      toast.error(error?.message || "Something went wrong");
    } finally {
      setIsActing(false);
    }
  };

  const handleAddNote = async (kind: "NOTE" | "CHASE_UP" = "NOTE") => {
    if (!id || !newNote.trim()) return;
    setSavingNote(true);
    try {
      await addJobNote(id, newNote.trim(), kind);
      setNewNote("");
      await loadNotes();
    } catch (error) {
      toast.error(error?.message || "Failed to add note");
    } finally {
      setSavingNote(false);
    }
  };

  if (loading && !job) {
    return (
      <DashboardLayout>
        <div className="py-12 text-center text-muted-foreground">Loading maintenance job...</div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout>
        <div className="py-12 text-center text-muted-foreground">Maintenance job not found</div>
      </DashboardLayout>
    );
  }

  const vendor = job.property?.vendor;
  const due = jobDueValue(job);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2" onClick={() => navigate("/maintenance")}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="text-sm text-muted-foreground">
            <Link to="/maintenance" className="hover:underline">Maintenance</Link>
            {" > "}
            {formatAddress(job.property)}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] items-start">
          <div className="min-w-0">
        <Tabs
          defaultValue="details"
          onValueChange={(v) => {
            if (v === "history") loadHistory();
            if (v === "notes" || v === "chase-up") loadNotes();
          }}
        >
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="chase-up">Chase up</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="landlord-emails">Landlord emails</TabsTrigger>
            {canManageMaintenance && <TabsTrigger value="history">History</TabsTrigger>}
          </TabsList>

          <TabsContent value="notes" className="space-y-4">
            <Card className="p-4 space-y-4">
              <div className="font-semibold">Notes<InfoHint text="Office notes and chase-up notes for this job, newest first." /></div>
              {canManageMaintenance && !isJobClosed && (
                <div className="space-y-2">
                  <Textarea rows={3} placeholder="Add a note…" value={newNote} onChange={(e) => setNewNote(e.target.value)} />
                  <div className="flex justify-end">
                    <Button type="button" size="sm" disabled={savingNote || !newNote.trim()} onClick={() => handleAddNote("NOTE")}>
                      {savingNote ? "Saving…" : "Add note"}
                    </Button>
                  </div>
                </div>
              )}
              {notesLoading ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
              ) : !notes || notes.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No notes yet.</p>
              ) : (
                <div className="space-y-3">
                  {notes.map((n) => (
                    <div key={n.id} className="border-l-2 border-border pl-3 py-0.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className={n.kind === "CHASE_UP" ? "border-red-300 bg-red-50 text-red-700" : ""}>
                          {n.kind === "CHASE_UP" ? "Chase-up" : "Note"}
                        </Badge>
                        <span>{n.authorName || "Staff"} · {formatLondonDateTime(n.createdAt)}</span>
                      </div>
                      <div className="mt-1 whitespace-pre-wrap text-sm">{n.note}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="chase-up" className="space-y-4">
            <Card className="p-4 space-y-4">
              <div className="font-semibold">Chase up<InfoHint text="When this job is chased and what was said each time. Only chase-up notes are listed here." /></div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div><span className="text-muted-foreground">Chase up at:</span> {job.chaseUpAt ? formatLondonDateTime(job.chaseUpAt) : "-"}</div>
                <div><span className="text-muted-foreground">Due:</span> {job.dueAt ? formatLondonDateTime(job.dueAt) : "-"}</div>
                <div><span className="text-muted-foreground">Contractor:</span> {contractorLabel(job.contractorRef?.name) || "Not assigned"}</div>
              </div>
              {canManageMaintenance && !isJobClosed && (
                <div className="space-y-2">
                  <Textarea rows={3} placeholder="What did you find out? e.g. contractor will attend Thursday" value={newNote} onChange={(e) => setNewNote(e.target.value)} />
                  <div className="flex justify-end">
                    <Button type="button" size="sm" disabled={savingNote || !newNote.trim()} onClick={() => handleAddNote("CHASE_UP")}>
                      {savingNote ? "Saving…" : "Add chase-up note"}
                    </Button>
                  </div>
                </div>
              )}
              {notesLoading ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
              ) : !notes || notes.filter((n) => n.kind === "CHASE_UP").length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No chase-up notes yet.</p>
              ) : (
                <div className="space-y-3">
                  {notes.filter((n) => n.kind === "CHASE_UP").map((n) => (
                    <div key={n.id} className="border-l-2 border-red-300 pl-3 py-0.5">
                      <div className="text-xs text-muted-foreground">{n.authorName || "Staff"} · {formatLondonDateTime(n.createdAt)}</div>
                      <div className="mt-1 whitespace-pre-wrap text-sm">{n.note}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>



          <TabsContent value="landlord-emails" className="space-y-4">
            <JobLandlordEmails jobId={job.id as string} reloadKey={job.landlordInformedAt} canManage={canManageMaintenance} onSent={refresh} />
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            <ContractorInvoicePanel job={job} canManage={canManageMaintenance} onChanged={refresh} />
                      <JobPaymentsPanel job={job} canManage={canManageMaintenance} onChanged={refresh} />
            <Card className="p-4">
              <label className="flex items-start gap-3">
                <Checkbox
                  checked={job.deductible !== false}
                  disabled={!canManageMaintenance || isSavingDeductible}
                  onCheckedChange={(v) => handleToggleDeductible(v === true)}
                />
                <span>
                  <span className="font-medium block">Deductible from landlord<InfoHint text="Ticked: once the job is completed, its total is offered on the landlord's next payment and taken off their rent as an adjustment. Unticked: Woodland absorbs the cost." /></span>
                  <span className="text-sm text-muted-foreground">
                    {job.deductible !== false
                      ? "The total is deducted from the landlord's rent payment as an adjustment once the job is completed."
                      : "Not deductible: Woodland absorbs this cost and nothing is deducted from the landlord."}
                  </span>
                </span>
              </label>
            </Card>
          </TabsContent>

          {canManageMaintenance && (
            <TabsContent value="history" className="space-y-4">
              <Card className="p-4">
                <div className="font-semibold mb-3">Job history</div>
                {historyLoading ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
                ) : !history || history.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No history recorded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {history.map((entry) => (
                      <div key={entry.id} className="border-l-2 border-border pl-3 py-0.5">
                        <div className="text-sm">{entry.description}</div>
                        <div className="text-xs text-muted-foreground">
                          {entry.actorName ? `${entry.actorName} (${entry.actorKind})` : entry.actorKind} —{" "}
                          {new Date(entry.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>
          )}

          <TabsContent value="details" className="space-y-6">
        {isEditing ? (
          <Card className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                <SelectField
                  label="Priority *"
                  name="priority"
                  register={register}
                  setValue={setValue}
                  watch={watch}
                  error={errors.priority?.message}
                  options={PRIORITY_OPTIONS}
                />
                <SelectField
                  label="Responsibility"
                  name="responsibility"
                  register={register}
                  setValue={setValue}
                  watch={watch}
                  error={errors.responsibility?.message}
                  options={RESPONSIBILITY_OPTIONS}
                />
                <SelectField
                  label="Reported by"
                  name="reportedBy"
                  register={register}
                  setValue={setValue}
                  watch={watch}
                  error={errors.reportedBy?.message}
                  options={REPORTED_BY_OPTIONS}
                />
              </div>

              <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
                Due date is set automatically from the priority. It cannot be edited by hand.
              </div>

              <TextAreaField label="Description" name="description" register={register} error={errors.description?.message} />

              <TextAreaField label="Notes" name="thingsToDo" register={register} error={errors.thingsToDo?.message} />

              <FileUploadField
                label="Photos"
                name="mediaFileIds"
                upload={{ category: "job-media", entityType: "jobType", entityId: job.id, propertyId: job.propertyId }}
                accept="image/jpeg,image/png,image/webp,application/pdf"
                multiple
                register={register}
                setValue={setValue}
                watch={watch}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="font-semibold mb-3">Contractor details</div>
                {job.contractorRef ? (
                  <div className="space-y-1 text-sm">
                    <div><span className="text-muted-foreground">Name:</span> {contractorLabel(job.contractorRef.name)}</div>
                    {job.contractorRef.company && <div><span className="text-muted-foreground">Company:</span> {job.contractorRef.company}</div>}
                    {job.contractorRef.phone && (
                      <div className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> {job.contractorRef.phone}</div>
                    )}
                    {job.contractorRef.email && (
                      <div className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> {job.contractorRef.email}</div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No contractor assigned yet.</p>
                )}
              </Card>

              <Card className="p-4">
                <div className="font-semibold mb-3">Landlord details</div>
                {vendor ? (
                  <div className="space-y-1 text-sm">
                    <div><span className="text-muted-foreground">Name:</span> {vendor.firstName} {vendor.lastName}</div>
                    {vendor.phone && (
                      <div className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> {vendor.phone}</div>
                    )}
                    {vendor.email && (
                      <div className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> {vendor.email}</div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No landlord linked to this property.</p>
                )}
              </Card>
            </div>

            {canManageMaintenance && !isJobClosed && (
              <Card className="p-4 space-y-3">
                <div className="font-semibold">Landlord approval<InfoHint text="For jobs the landlord is responsible for: email the landlord about the job. The job then waits as Waiting Authorisation until the landlord says yes; press Landlord authorised when they do. Nothing is sent automatically." /></div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isActing || !landlord?.email}
                    title={!landlord?.email ? "This property's landlord has no email on file" : undefined}
                    onClick={() => runAction(async () => {
                      const result = await emailLandlord(job.id as string);
                      toast.success(result?.message || "Landlord informed");
                    }, "Landlord informed")}
                  >
                    <Send className="h-4 w-4 mr-2" /> {job.landlordInformedAt ? "Inform landlord again" : "Inform landlord"}
                  </Button>
                  {job.status === "WAITING_AUTHORIZATION" && (
                    <Button
                      type="button"
                      disabled={isActing}
                      onClick={() => runAction(() => markLandlordAuthorised(job.id as string), "Landlord authorised")}
                    >
                      <ShieldCheck className="h-4 w-4 mr-2" /> Landlord authorised
                    </Button>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {job.landlordInformedAt
                    ? `Landlord informed ${formatLondonDateTime(job.landlordInformedAt)}.`
                    : "The landlord has not been informed yet."}
                  {!landlord?.email && " This property's landlord has no email on file."}
                </div>
              </Card>
            )}

            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold">Job details</div>
                {!isJobClosed && (
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>Edit</Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {job.priority && <Badge variant="outline" className={priorityBadgeClass(job.priority)}>Priority: {job.priority}</Badge>}
                <Badge variant="outline" className={statusBadgeClass(job.status)}>Status: {jobStatusLabel(job.status, STATUS_LABELS[job.status] ?? job.status, job.contractorRef?.name)}</Badge>
                {isOverdue && <Badge variant="destructive">Overdue</Badge>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-sm">
                <div><span className="text-muted-foreground">Type:</span> {job.jobType}</div>
                <div><span className="text-muted-foreground">Location:</span> {job.location || "-"}</div>
                <div><span className="text-muted-foreground">Responsibility:</span> {partyLabel(job.responsibility)}</div>
                <div><span className="text-muted-foreground">Reported by:</span> {partyLabel(job.reportedBy)}</div>
                <div className="md:col-span-2"><span className="text-muted-foreground">Description:</span> {job.description}</div>
                {job.thingsToDo && <div className="md:col-span-2"><span className="text-muted-foreground">Notes:</span> {job.thingsToDo}</div>}
                <div><span className="text-muted-foreground">Due:</span> <span className={priorityTextClass(job.priority, isOverdue)}>{job.dueAt ? formatLondonDateTime(job.dueAt) : due ? formatLondonDate(due) : "-"}</span></div>
                <div><span className="text-muted-foreground">Visit:</span> {formatVisit(job)}</div>
                {job.startDate && <div><span className="text-muted-foreground">Start date (set by contractor):</span> {job.startDate}</div>}
                {job.endDate && <div><span className="text-muted-foreground">End date (set by contractor):</span> {job.endDate}</div>}
                {job.dateDone && <div><span className="text-muted-foreground">Done:</span> {job.dateDone}</div>}
              </div>

              {/* Next-step hint row — read only, no edit needed to see what's pending */}
              <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                {job.status === "OPEN" && "Next step: inform the landlord (if they are responsible) or assign a contractor."}
                {job.status === "WAITING_AUTHORIZATION" && "Next step: waiting for the landlord to authorise the work."}
                {job.status === "QUOTING" && "Next step: assign a contractor."}
                {job.status === "ASSIGNED" && "Next step: waiting on the contractor to set a start date."}
                {job.status === "IN_PROGRESS" && "Next step: waiting on the contractor to submit as done."}
                {job.status === "CONTRACTOR_DONE" && "Next step: review the contractor's cost, set a markup, and mark the job done."}
                {job.status === "COMPLETED" && "This job is complete."}
                {job.status === "CANCELLED" && "This job was cancelled."}
              </div>
            </Card>

            {canManageMaintenance && (
              <Card className="p-4 space-y-3">
                <div className="font-semibold">Job actions<InfoHint text="Staff can do these even if the contractor has not updated anything." /></div>
                {isJobClosed ? (
                  <p className="text-sm text-muted-foreground">
                    This job is {job.status === "COMPLETED" ? "completed" : "cancelled"}; no further actions.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      disabled={isActing}
                      onClick={() => runAction(() => markJobDone(job), "Maintenance job marked as done")}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" /> Done
                    </Button>
                    <Button type="button" variant="outline" disabled={isActing} onClick={() => setNotCompleteOpen(true)}>
                      <RotateCcw className="h-4 w-4 mr-2" /> Not complete
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isActing}
                      onClick={() => runAction(() => cancelJob(job), "Maintenance job cancelled")}
                    >
                      <XCircle className="h-4 w-4 mr-2" /> Cancel job
                    </Button>
                  </div>
                )}
              </Card>
            )}

            {canManageMaintenance && (
              <Card className="p-4">
                <div className="font-semibold mb-3">Assign contractor</div>
                {isJobClosed ? (
                  <p className="text-sm text-muted-foreground">
                    This job is {job.status === "COMPLETED" ? "completed" : "cancelled"} and can no longer be edited.
                  </p>
                ) : !canReassignContractor ? (
                  <p className="text-sm text-muted-foreground">
                    A contractor is already assigned. Reassignment is disabled until the job is submitted as done or its due date passes.
                  </p>
                ) : (
                  <div className="flex items-end gap-2">
                    <div className="flex-1 max-w-sm">
                      <ContractorPicker
                        label="Contractor"
                        name="_pendingContractorId"
                        watch={() => pendingContractorId}
                        setValue={(_name: string, value: string) => setPendingContractorId(value)}
                        clearErrors={() => undefined}
                      />
                    </div>
                    <Button disabled={isAssigning || !pendingContractorId} onClick={handleAssignContractor}>
                      {job.contractorId ? "Reassign" : "Assign"}
                    </Button>
                  </div>
                )}
              </Card>
            )}

            <JobMediaPanel job={job} canManage={canManageMaintenance} />
          </>
        )}
          </TabsContent>
        </Tabs>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-4">
            <Card className="p-4 space-y-3">
              <div className="font-semibold">Summary</div>
              <dl className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd><Badge variant="outline" className={statusBadgeClass(job.status)}>{jobStatusLabel(job.status, STATUS_LABELS[job.status] ?? job.status, job.contractorRef?.name)}</Badge></dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Responsibility</dt>
                  <dd className="font-medium">{partyLabel(job.responsibility)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Reported by</dt>
                  <dd className="font-medium">{partyLabel(job.reportedBy)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Priority</dt>
                  <dd>
                    {job.priority ? (
                      <Badge variant="outline" className={priorityBadgeClass(job.priority)}>{job.priority}</Badge>
                    ) : (
                      "-"
                    )}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted-foreground">Due</dt>
                  <dd className={`text-right ${priorityTextClass(job.priority, isOverdue)}`}>
                    {job.dueAt ? formatLondonDateTime(job.dueAt) : due ? formatLondonDate(due) : "-"}
                    {isOverdue && <div className="text-xs font-semibold text-red-600">Overdue</div>}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted-foreground">Chase up at</dt>
                  <dd className="text-right">{formatLondonDateTime(job.chaseUpAt)}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted-foreground">Landlord informed at</dt>
                  <dd className="text-right">{job.landlordInformedAt ? formatLondonDateTime(job.landlordInformedAt) : "Not yet"}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted-foreground">Visit</dt>
                  <dd className="text-right">{formatVisit(job)}</dd>
                </div>
              </dl>
            </Card>
            <Card className="p-4 text-sm space-y-1">
              <div className="font-semibold">Property</div>
              <div>{formatJobAddress(job.property)}</div>
              {job.contractorRef?.name && <div className="text-muted-foreground">Contractor: {contractorLabel(job.contractorRef.name)}</div>}
              {landlordName && <div className="text-muted-foreground">Landlord: {landlordName}</div>}
            </Card>
          </aside>
        </div>
      </div>

      <NotePromptDialog
        open={notCompleteOpen}
        onOpenChange={setNotCompleteOpen}
        title="Mark as not complete"
        description="The job goes back to the contractor. Say what is still outstanding."
        submitLabel="Mark not complete"
        onSubmit={async (note) => {
          if (!job.id) return;
          try {
            await markJobNotComplete(job, note);
            toast.success("Job sent back as not complete");
            refresh();
          } catch (error) {
            toast.error(error?.message || "Failed to update the job");
          }
        }}
      />
    </DashboardLayout>
  );
};

export default MaintenanceDetail;
